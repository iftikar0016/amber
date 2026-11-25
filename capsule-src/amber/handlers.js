/* AMBER capsule routes: the requests the capsule answers from its own state instead of the capture.
 * The coding agent adds to this file in the repair loop, one interaction per commit.
 * A route returns a Response, or null to fall through to the captured replay.
 */
(() => {
  const json = (status, body, extraHeaders) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...(extraHeaders || {}) } });

  /** Vikunja-style problem response; the front end shows `message`. */
  const problem = (status, message) =>
    new Response(JSON.stringify({ status, title: message, detail: message, message, code: status }), {
      status,
      headers: { 'content-type': 'application/problem+json' },
    });

  const preview = (body) => {
    if (body == null) return null;
    const s = typeof body === 'string' ? body : JSON.stringify(body);
    return s.replace(/"(password|token)"\s*:\s*"[^"]*"/gi, '"$1":"[scrubbed]"').slice(0, 300);
  };

  const b64url = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  /**
   * A JWT-shaped token for the demo user. Vikunja's front end reads its claims (id, username, exp, type);
   * nothing checks the signature, because there is no server. It never leaves the browser.
   */
  function demoToken() {
    const u = AmberStore.seed.meta.user;
    const now = Math.floor(Date.now() / 1000);
    const claims = { exp: now + 3600, iat: now, id: u.id, is_admin: false, jti: crypto.randomUUID(), sid: crypto.randomUUID(), type: 1, username: u.username };
    return b64url({ alg: 'HS256', typ: 'JWT' }) + '.' + b64url(claims) + '.amber-capsule-unsigned';
  }

  // ---- Vikunja's shapes, built from the store's model -------------------------------------------------------

  const ZERO = '0001-01-01T00:00:00Z'; // Vikunja's "no date"
  const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const schema = (url, name) => url.origin + '/api/v2/schemas/' + name + '.json';
  const MAX_PER_PAGE = 50; // /api/v2/info max_items_per_page

  /** A task as Vikunja serialises it; `mid` goes after bucket_id (comment_count, position, positions). */
  function taskJson(t, mid) {
    const o = {};
    for (const k of ['id', 'title', 'description', 'project_id', 'done', 'done_at', 'due_date', 'reminders', 'repeat_after', 'repeat_mode', 'priority', 'start_date', 'end_date', 'assignees', 'labels', 'hex_color', 'percent_done', 'identifier', 'index', 'related_tasks', 'attachments', 'cover_image_attachment_id', 'is_favorite', 'created', 'updated', 'bucket_id']) {
      o[k] = t[k] === undefined ? null : t[k];
    }
    Object.assign(o, mid || {});
    o.reactions = t.reactions === undefined ? null : t.reactions;
    o.created_by = t.created_by;
    return o;
  }

  /** Vikunja's paginated body: { items, total, page, per_page, total_pages }. `total` may count fewer than the items. */
  function paginated(url, query, items, schemaName, counted) {
    const page = Math.max(1, parseInt(query.get('page') || '1', 10) || 1);
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, parseInt(query.get('per_page') || String(MAX_PER_PAGE), 10) || MAX_PER_PAGE));
    const total = counted === undefined ? items.length : counted;
    return json(200, {
      $schema: schema(url, schemaName),
      items: items.slice((page - 1) * perPage, page * perPage),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    });
  }

  /**
   * A task filter as a predicate, or null when the capsule cannot evaluate it (the caller then does not answer).
   * Supported: empty, and `done = true|false` clauses joined by &&.
   */
  function parseFilter(expr) {
    const s = String(expr || '').trim();
    if (!s) return () => true;
    const clauses = [];
    for (const part of s.split('&&')) {
      const m = /^\s*done\s*=\s*(true|false)\s*$/.exec(part);
      if (!m) return null;
      const want = m[1] === 'true';
      clauses.push((t) => Boolean(t.done) === want);
    }
    return (t) => clauses.every((c) => c(t));
  }

  /** Comparator for Vikunja's sort_by/order_by lists, or null for a sort the capsule cannot reproduce. */
  function taskOrder(sortBy, orderBy, positions) {
    const dateKey = (v) => (!v || String(v).startsWith('0001-') ? null : Date.parse(v));
    const getters = {
      position: (t) => positions[t.id],
      id: (t) => t.id,
      index: (t) => t.index,
      priority: (t) => t.priority,
      percent_done: (t) => t.percent_done,
      done: (t) => (t.done ? 1 : 0),
      title: (t) => String(t.title || '').toLowerCase(),
      due_date: (t) => dateKey(t.due_date),
      start_date: (t) => dateKey(t.start_date),
      end_date: (t) => dateKey(t.end_date),
      done_at: (t) => dateKey(t.done_at),
      created: (t) => dateKey(t.created),
      updated: (t) => dateKey(t.updated),
    };
    const keys = [];
    for (let i = 0; i < sortBy.length; i++) {
      const get = getters[sortBy[i]];
      if (!get) return null;
      keys.push({ get, desc: String(orderBy[i] || 'asc').toLowerCase() === 'desc' });
    }
    keys.push({ get: getters.id, desc: false });
    return (a, b) => {
      for (const { get, desc } of keys) {
        const x = get(a);
        const y = get(b);
        if (x === y) continue;
        if (x === null) return 1; // no date: last, either way round
        if (y === null) return -1;
        return (x < y ? -1 : 1) * (desc ? -1 : 1);
      }
      return 0;
    };
  }

  const projectView = (model, projectId, viewId) => {
    const p = model.projects && model.projects[projectId];
    return p ? { project: p, view: (p.views || []).find((v) => String(v.id) === String(viewId)) } : { project: null, view: null };
  };

  /**
   * GET /projects/:p/views/:v/tasks for list and table views, from the store.
   * Answers only views whose positions the model knows (captured, or the project was created in the capsule).
   */
  function viewTasks({ params, query, url, store }) {
    const m = store.model;
    const { view } = projectView(m, params.project, params.view);
    if (!view || (view.view_kind !== 'list' && view.view_kind !== 'table')) return null;
    const positions = m.positions && m.positions[view.id];
    if (!positions) return null;
    const viewFilter = parseFilter(view.filter && view.filter.filter);
    const requestFilter = parseFilter(query.get('filter'));
    if (!viewFilter || !requestFilter || (query.get('q') || '').trim()) return null;
    const items = Object.values(m.tasks || {}).filter((t) => String(t.project_id) === String(params.project) && viewFilter(t) && requestFilter(t));
    if (items.some((t) => typeof positions[t.id] !== 'number')) return null;
    const order = taskOrder(query.getAll('sort_by'), query.getAll('order_by'), positions);
    if (!order) return null;
    items.sort(order);
    const withCount = query.getAll('expand').includes('comment_count');
    const out = items.map((t) => taskJson(t, { ...(withCount ? { comment_count: t.comment_count || 0 } : {}), position: positions[t.id] }));
    return paginated(url, query, out, 'PaginatedTask');
  }

  /**
   * GET /tasks: every task the user can see, across projects (the home page's Current Tasks, and the
   * "is there any task" probe with per_page=1). Answered for `done = …` filters and the sorts taskOrder knows;
   * a search (q) or any other filter (Upcoming's due-date range) still falls through.
   */
  function listTasks({ query, url, store }) {
    const m = store.model;
    if (!m.tasks || (query.get('q') || '').trim() || (query.get('s') || '').trim()) return null;
    const filter = parseFilter(query.get('filter'));
    if (!filter) return null;
    const visible = (t) => {
      const p = m.projects && m.projects[t.project_id];
      return Boolean(p && p.id > 0);
    };
    const items = Object.values(m.tasks).filter((t) => visible(t) && filter(t));
    const sortBy = query.getAll('sort_by');
    if (sortBy.includes('position')) return null; // a position belongs to a project view, not to this list
    const order = taskOrder(sortBy, query.getAll('order_by'), {});
    if (!order) return null;
    items.sort(order);
    const withCount = query.getAll('expand').includes('comment_count');
    const out = items.map((t) => taskJson(t, { ...(withCount ? { comment_count: t.comment_count || 0 } : {}), position: 0 }));
    return paginated(url, query, out, 'PaginatedTask');
  }

  /** The bucket a task is in on a kanban view, from its own bucket list. */
  const bucketOf = (t, viewId) => (Array.isArray(t.buckets) ? t.buckets.find((b) => String(b.project_view_id) === String(viewId)) : undefined);

  /**
   * GET /projects/:p/views/:v/buckets/tasks: a kanban board, each bucket with its tasks in the view's order.
   * Answered only when the store knows the view's buckets and, for every task of the project, its bucket and position.
   */
  function kanbanTasks({ params, query, url, store }) {
    const m = store.model;
    const { view } = projectView(m, params.project, params.view);
    if (!view || view.view_kind !== 'kanban') return null;
    const list = m.buckets && m.buckets[view.id];
    const positions = m.positions && m.positions[view.id];
    if (!list || !positions) return null;
    const filter = parseFilter(query.get('filter'));
    if (!filter || (query.get('q') || '').trim()) return null;
    const tasks = Object.values(m.tasks || {}).filter((t) => String(t.project_id) === String(params.project) && filter(t));
    if (tasks.some((t) => !bucketOf(t, view.id) || typeof positions[t.id] !== 'number')) return null;
    const perBucket = Math.min(MAX_PER_PAGE, Math.max(1, parseInt(query.get('per_page') || '25', 10) || 25));
    const withCount = query.getAll('expand').includes('comment_count');
    const items = [...list]
      .sort((a, b) => a.position - b.position || a.id - b.id)
      .map((bucket) => {
        const inBucket = tasks
          .filter((t) => bucketOf(t, view.id).id === bucket.id)
          .sort((a, b) => positions[a.id] - positions[b.id] || a.id - b.id);
        const out = { id: bucket.id, title: bucket.title, project_view_id: bucket.project_view_id };
        // Vikunja leaves `tasks` out of an empty bucket
        if (inBucket.length) {
          out.tasks = inBucket.slice(0, perBucket).map((t) => taskJson({ ...t, bucket_id: bucket.id }, { ...(withCount ? { comment_count: t.comment_count || 0 } : {}), position: positions[t.id] }));
        }
        return { ...out, limit: bucket.limit, count: inBucket.length, position: bucket.position, created: bucket.created, updated: bucket.updated, created_by: bucket.created_by };
      });
    return json(200, { $schema: schema(url, 'BucketsWithTasksBodyBody'), items, total: items.length });
  }

  /**
   * Vikunja moves a task that is marked done into each kanban view's done bucket (and one that is reopened out of it,
   * into the default bucket), at the position its index gives (index × 2^16). Only where the store knows the buckets.
   */
  function moveForDone(m, t) {
    const project = m.projects && m.projects[t.project_id];
    for (const v of (project && project.views) || []) {
      if (v.view_kind !== 'kanban' || !v.done_bucket_id) continue;
      const current = bucketOf(t, v.id);
      const list = m.buckets && m.buckets[v.id];
      if (!current || !list) continue;
      const targetId = t.done ? v.done_bucket_id : current.id === v.done_bucket_id ? v.default_bucket_id : current.id;
      const target = list.find((b) => b.id === targetId);
      if (!target || target.id === current.id) continue;
      t.buckets = t.buckets.map((b) => (b === current ? { ...target, count: 0, created_by: null } : b));
      if (m.positions && m.positions[v.id]) m.positions[v.id][t.id] = (t.index || 0) * 65536;
    }
  }

  /** POST /projects/:p/tasks/bulk: Vikunja's task creation (the list view's "Add" sends it). */
  async function createTasks({ params, body, url, store }) {
    const m = store.model;
    const project = m.projects && m.projects[params.project];
    if (!project || Number(params.project) <= 0) return problem(404, 'The project does not exist.');
    const input = body && Array.isArray(body.tasks) ? body.tasks : null;
    if (!input || !input.length) return problem(400, 'Invalid model provided.');
    if (input.some((t) => !String((t && t.title) || '').trim())) return problem(400, 'Task title cannot be empty.');
    const created = [];
    for (const t of input) {
      const now = nowIso();
      const siblings = Object.values(m.tasks).filter((x) => x.project_id === project.id);
      const index = 1 + siblings.reduce((max, x) => Math.max(max, x.index || 0), 0);
      const task = {
        id: m.next.task++,
        title: String(t.title),
        description: t.description || '',
        project_id: project.id,
        done: Boolean(t.done),
        done_at: t.done ? now : ZERO,
        due_date: t.due_date || ZERO,
        reminders: Array.isArray(t.reminders) && t.reminders.length ? t.reminders : null,
        repeat_after: t.repeat_after || 0,
        repeat_mode: t.repeat_mode || 0,
        priority: t.priority || 0,
        start_date: t.start_date || ZERO,
        end_date: t.end_date || ZERO,
        assignees: null,
        labels: null,
        hex_color: t.hex_color || '',
        percent_done: t.percent_done || 0,
        identifier: (project.identifier ? project.identifier + '-' : '#') + index,
        index,
        related_tasks: {},
        attachments: null,
        cover_image_attachment_id: t.cover_image_attachment_id || 0,
        is_favorite: Boolean(t.is_favorite),
        created: now,
        updated: now,
        bucket_id: 0,
        reactions: null,
        created_by: m.user,
        comment_count: 0,
      };
      m.tasks[task.id] = task;
      // Vikunja puts a new task first in each view: half the lowest position there (2^16 in an empty view).
      const positions = [];
      for (const v of project.views || []) {
        const pos = m.positions[v.id];
        if (!pos) continue; // a view whose order the capsule never saw stays unknown
        const values = Object.values(pos);
        pos[task.id] = values.length ? Math.min(...values) / 2 : 65536;
        positions.push({ task_id: task.id, project_view_id: v.id, position: pos[task.id] });
      }
      created.push(taskJson({ ...task, assignees: [], related_tasks: null }, { position: 0, positions }));
    }
    await store.save();
    return json(201, { tasks: created });
  }

  /** Fields a task update changes directly, with how Vikunja stores the value it was sent. */
  const date = (v) => (v ? String(v) : ZERO);
  const UPDATABLE = {
    title: (v) => String(v),
    description: (v) => String(v || ''),
    due_date: date,
    start_date: date,
    end_date: date,
    priority: (v) => Number(v) || 0,
    hex_color: (v) => String(v || ''),
    percent_done: (v) => Number(v) || 0,
    repeat_after: (v) => Number(v) || 0,
    repeat_mode: (v) => Number(v) || 0,
    is_favorite: (v) => Boolean(v),
    reminders: (v) => (Array.isArray(v) && v.length ? v : null),
    cover_image_attachment_id: (v) => Number(v) || 0,
  };
  /** Read-only or separately managed fields: Vikunja's task update ignores them. */
  const IGNORED_ON_UPDATE = new Set(['id', 'identifier', 'index', 'created', 'updated', 'created_by', 'done_at', 'labels', 'assignees', 'attachments', 'related_tasks', 'reactions', 'subscription', 'buckets', 'position', 'positions', 'comment_count', 'max_permission']);

  /** The fields a PATCH body sets: a JSON Patch list of top-level add/replace ops, or a plain object. Null if neither. */
  function patchFields(body) {
    if (Array.isArray(body)) {
      const out = {};
      for (const op of body) {
        const m = op && /^\/([a-z_]+)$/.exec(op.path || '');
        if (!m || (op.op !== 'add' && op.op !== 'replace')) return null;
        out[m[1]] = op.value;
      }
      return out;
    }
    return body && typeof body === 'object' ? body : null;
  }

  /**
   * PATCH /tasks/:id: Vikunja's task update (the task page and the list's checkbox send every field on each save).
   * A change the capsule cannot carry out yet (closing a repeating task, moving to another project or bucket,
   * an unknown field) is not answered here, so the Service Worker refuses it with a 501.
   */
  async function updateTask({ params, body, url, store }) {
    const m = store.model;
    const t = m.tasks && m.tasks[params.id];
    if (!t) return problem(404, 'This task does not exist.');
    const fields = patchFields(body);
    if (!fields) return null;
    const next = {};
    for (const [k, v] of Object.entries(fields)) {
      if (IGNORED_ON_UPDATE.has(k)) continue;
      if (k === 'done') {
        const done = Boolean(v);
        if (done === Boolean(t.done)) continue;
        // Vikunja reschedules a repeating task instead of closing it; the store cannot do that yet.
        const repeatAfter = 'repeat_after' in fields ? Number(fields.repeat_after) : t.repeat_after;
        const repeatMode = 'repeat_mode' in fields ? Number(fields.repeat_mode) : t.repeat_mode;
        if (done && (repeatAfter > 0 || repeatMode === 1)) return null;
        next.done = done;
        next.done_at = done ? nowIso() : ZERO;
        continue;
      }
      if (k === 'project_id') {
        if (v && Number(v) !== t.project_id) return null;
        continue;
      }
      if (k === 'bucket_id') {
        if (v && Number(v) !== t.bucket_id) return null;
        continue;
      }
      if (!UPDATABLE[k]) return null;
      next[k] = UPDATABLE[k](v);
    }
    if ('title' in next && !next.title.trim()) return problem(400, 'Task title cannot be empty.');
    Object.assign(t, next, { updated: nowIso() });
    if ('done' in next) moveForDone(m, t);
    await store.save();
    const out = taskJson({ ...t, assignees: t.assignees || [] }, { position: 0 });
    if (t.subscription !== undefined) out.subscription = t.subscription;
    return json(200, { $schema: schema(url, 'Task'), ...out });
  }

  /**
   * GET /tasks/:id: a task's own read (the task page), from the store.
   * With expand=buckets it answers only when the store knows the task's kanban buckets.
   */
  function readTask({ params, query, url, store }) {
    const m = store.model;
    const t = m.tasks && m.tasks[params.id];
    if (!t) return m.deleted && m.deleted[params.id] ? problem(404, 'This task does not exist.') : null;
    const expand = query.getAll('expand');
    if (expand.includes('buckets') && !Array.isArray(t.buckets)) return null;
    const project = m.projects && m.projects[t.project_id];
    const maxPermission = project && typeof project.max_permission === 'number' ? project.max_permission : null;
    const out = { $schema: schema(url, 'TaskReadOneBody'), ...taskJson(t, { ...(expand.includes('buckets') ? { buckets: t.buckets } : {}), position: 0 }), max_permission: maxPermission };
    if (t.subscription !== undefined) out.subscription = t.subscription;
    // Vikunja's ETag: the task's last change in nanoseconds, and the caller's permission
    const etag = '"' + String(Date.parse(t.updated)) + '000000-' + maxPermission + '"';
    return json(200, out, { etag });
  }

  /**
   * DELETE /tasks/:id: the task leaves the store and every view's order. Its id is remembered as deleted,
   * so its own read answers 404 instead of falling back to the captured task.
   */
  async function deleteTask({ params, store }) {
    const m = store.model;
    const t = m.tasks && m.tasks[params.id];
    if (!t) return m.deleted && m.deleted[params.id] ? problem(404, 'This task does not exist.') : null;
    delete m.tasks[t.id];
    for (const pos of Object.values(m.positions || {})) delete pos[t.id];
    (m.deleted ||= {})[t.id] = nowIso();
    await store.save();
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  }

  /** A project as Vikunja serialises it (list item and ProjectReadBody). */
  function projectJson(p) {
    const o = {};
    for (const k of ['id', 'title', 'description', 'identifier', 'hex_color', 'parent_project_id', 'owner', 'is_archived', 'background_information', 'background_blur_hash', 'is_favorite', 'position', 'views', 'max_permission', 'created', 'updated']) {
      o[k] = p[k] === undefined ? null : p[k];
    }
    return o;
  }

  /**
   * GET /projects: every project the user can see, ordered by position, then the saved-filter pseudo projects
   * (negative ids), as Vikunja lists them. Answered for the request the front end makes (expand=permissions).
   */
  function listProjects({ query, url, store }) {
    const m = store.model;
    if (!m.projects || !query.getAll('expand').includes('permissions') || (query.get('s') || '').trim()) return null;
    const all = Object.values(m.projects).filter((p) => query.get('is_archived') === 'true' || !p.is_archived);
    const real = all.filter((p) => p.id > 0).sort((a, b) => a.position - b.position || a.id - b.id);
    const pseudo = all.filter((p) => p.id < 0);
    // Vikunja lists the saved filters but counts only real projects in `total`.
    return paginated(url, query, [...real, ...pseudo].map(projectJson), 'PaginatedProject', real.length);
  }

  /** GET /projects/:id for a real project, from the store. */
  function readProject({ params, url, store }) {
    const p = store.model.projects && store.model.projects[params.project];
    if (!p || p.id <= 0) return null;
    return json(200, { $schema: schema(url, 'ProjectReadBody'), ...projectJson(p) });
  }

  /**
   * POST /projects: Vikunja's project creation. A new project gets the four default views (List with "done = false",
   * Gantt, Table, Kanban with its To-Do / Doing / Done buckets) and the position id × 2^16.
   */
  async function createProject({ body, url, store }) {
    const m = store.model;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return problem(400, 'Invalid model provided.');
    const title = String(body.title || '').trim();
    if (!title) return problem(400, 'The project title cannot be empty.');
    // Favourites (a pseudo project) and sub-projects are not in the store yet.
    if (body.is_favorite || (body.parent_project_id && Number(body.parent_project_id) !== 0)) return null;
    const now = nowIso();
    const id = m.next.project++;
    const view = (title2, kind, position, extra) => ({
      id: m.next.view++,
      title: title2,
      project_id: id,
      view_kind: kind,
      filter: null,
      position,
      bucket_configuration_mode: 'none',
      bucket_configuration: null,
      default_bucket_id: 0,
      done_bucket_id: 0,
      updated: now,
      created: now,
      ...extra,
    });
    const views = [
      view('List', 'list', 100, { filter: { s: '', sort_by: null, order_by: null, filter: 'done = false', filter_include_nulls: false } }),
      view('Gantt', 'gantt', 200),
      view('Table', 'table', 300),
    ];
    const toDo = m.next.bucket++;
    m.next.bucket++; // Doing
    const done = m.next.bucket++;
    views.push(view('Kanban', 'kanban', 400, { bucket_configuration_mode: 'manual', default_bucket_id: toDo, done_bucket_id: done }));
    const owner = { id: m.user.id, name: m.user.name, username: m.user.username, created: m.user.created, updated: m.user.updated };
    const project = {
      id,
      title,
      description: String(body.description || ''),
      identifier: String(body.identifier || ''),
      hex_color: String(body.hex_color || ''),
      parent_project_id: 0,
      owner,
      is_archived: Boolean(body.is_archived),
      background_information: null,
      background_blur_hash: '',
      is_favorite: false,
      position: Number(body.position) || id * 65536,
      views,
      max_permission: 2, // the owner
      created: now,
      updated: now,
    };
    m.projects[id] = project;
    for (const v of views) if (v.view_kind === 'list' || v.view_kind === 'table') m.positions[v.id] = {}; // empty, and known to be
    await store.save();
    // The create response carries the owner without profile details and no permission, as Vikunja's does.
    const out = projectJson({ ...project, owner: { id: owner.id, name: '', username: owner.username, created: ZERO, updated: ZERO }, max_permission: null });
    return json(201, { $schema: schema(url, 'Project'), ...out });
  }

  /** A task's comments when the store knows all of them: captured, or none counted on the task. */
  function knownComments(m, t) {
    if (m.comments && m.comments[t.id]) return m.comments[t.id];
    return t.comment_count === 0 ? [] : null;
  }

  /** GET /tasks/:id/comments, from the store. */
  function listComments({ params, query, url, store }) {
    const m = store.model;
    const t = m.tasks && m.tasks[params.id];
    if (!t) return m.deleted && m.deleted[params.id] ? problem(404, 'This task does not exist.') : null;
    const list = knownComments(m, t);
    if (!list) return null;
    const desc = String(query.get('order_by') || 'asc').toLowerCase() === 'desc';
    const items = [...list].sort((a, b) => (Date.parse(a.created) - Date.parse(b.created) || a.id - b.id) * (desc ? -1 : 1));
    return paginated(url, query, items, 'PaginatedTaskComment');
  }

  /** POST /tasks/:id/comments: Vikunja's new comment, by the signed-in user. */
  async function createComment({ params, body, store }) {
    const m = store.model;
    const t = m.tasks && m.tasks[params.id];
    if (!t) return m.deleted && m.deleted[params.id] ? problem(404, 'This task does not exist.') : null;
    const list = knownComments(m, t);
    if (!list) return null; // the store cannot list this task's comments, so it does not add to them
    const text = body && typeof body === 'object' ? String(body.comment || '') : '';
    if (!text.trim()) return problem(400, 'The comment cannot be empty.');
    const now = nowIso();
    const comment = { id: m.next.comment++, comment: text, author: m.user, reactions: null, created: now, updated: now };
    (m.comments ||= {})[t.id] = [...list, comment];
    t.comment_count = (t.comment_count || 0) + 1;
    await store.save();
    return json(201, comment);
  }

  const routes = [
    {
      name: 'kanban-tasks',
      method: 'GET',
      path: /^\/api\/v2\/projects\/(?<project>-?\d+)\/views\/(?<view>\d+)\/buckets\/tasks$/,
      handle: kanbanTasks,
    },
    {
      name: 'task-list',
      method: 'GET',
      path: /^\/api\/v2\/tasks$/,
      handle: listTasks,
    },
    {
      name: 'task-comments',
      method: 'GET',
      path: /^\/api\/v2\/tasks\/(?<id>\d+)\/comments$/,
      handle: listComments,
    },
    {
      name: 'comment-create',
      method: 'POST',
      path: /^\/api\/v2\/tasks\/(?<id>\d+)\/comments$/,
      handle: createComment,
    },
    {
      name: 'project-list',
      method: 'GET',
      path: /^\/api\/v2\/projects$/,
      handle: listProjects,
    },
    {
      name: 'project-read',
      method: 'GET',
      path: /^\/api\/v2\/projects\/(?<project>-?\d+)$/,
      handle: readProject,
    },
    {
      name: 'project-create',
      method: 'POST',
      path: /^\/api\/v2\/projects$/,
      handle: createProject,
    },
    {
      name: 'task-delete',
      method: 'DELETE',
      path: /^\/api\/v2\/tasks\/(?<id>\d+)$/,
      handle: deleteTask,
    },
    {
      name: 'task-read',
      method: 'GET',
      path: /^\/api\/v2\/tasks\/(?<id>\d+)$/,
      handle: readTask,
    },
    {
      name: 'task-update',
      method: 'PATCH',
      path: /^\/api\/v2\/tasks\/(?<id>\d+)$/,
      handle: updateTask,
    },
    {
      name: 'project-view-tasks',
      method: 'GET',
      path: /^\/api\/v2\/projects\/(?<project>-?\d+)\/views\/(?<view>\d+)\/tasks$/,
      handle: viewTasks,
    },
    {
      name: 'task-create',
      method: 'POST',
      path: /^\/api\/v2\/projects\/(?<project>-?\d+)\/tasks\/bulk$/,
      handle: createTasks,
    },
    {
      name: 'login',
      method: 'POST',
      path: /^\/api\/v2\/login$/,
      // The real password is never in the capsule, so any password signs in as the demo user.
      handle: ({ body }) => {
        const u = AmberStore.seed.meta.user;
        if (!body || String(body.username || '').toLowerCase() !== u.username.toLowerCase()) {
          return problem(412, 'Wrong username or password.');
        }
        return json(200, { token: demoToken() });
      },
    },
    {
      name: 'token-refresh',
      method: 'POST',
      path: /^\/api\/v2\/user\/token\/refresh$/,
      handle: () => json(200, { token: demoToken() }),
    },
  ];

  self.AmberHandlers = {
    routes,
    json,
    problem,
    preview,
    context: ({ method, url, body, headers }) => ({ method, url, query: url.searchParams, body, headers, store: AmberStore, json, problem }),
  };
})();
