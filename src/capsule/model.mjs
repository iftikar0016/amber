// @ts-check
// Lifts the store's model out of the captured responses (build time).
// Only GETs captured before any change in their journey reach this function, so the model is the seeded state.
// The repair loop adds entities here as interactions need them; each comes with the evidence that it is complete
// enough for the routes that read it (see `positions`).

/** Fields of a task that belong to the task itself, as Vikunja returns them (not per-view or per-request fields). */
const TASK_FIELDS = [
  'id', 'title', 'description', 'project_id', 'done', 'done_at', 'due_date', 'reminders', 'repeat_after', 'repeat_mode',
  'priority', 'start_date', 'end_date', 'assignees', 'labels', 'hex_color', 'percent_done', 'identifier', 'index',
  'related_tasks', 'attachments', 'cover_image_attachment_id', 'is_favorite', 'created', 'updated', 'bucket_id',
  'reactions', 'created_by',
];

const isTask = (o) => o && typeof o === 'object' && typeof o.id === 'number' && 'done' in o && 'project_id' in o && 'index' in o;
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
const withoutSchema = (o) => {
  const { $schema, ...rest } = o;
  void $schema;
  return rest;
};

/**
 * @param {Array<{method:string, path:string, query:string, status:number, resBody:any, journey:string}>} pristine
 *   GET exchanges captured before any change in their journey
 * @returns {Record<string, any>}
 */
export function liftModel(pristine) {
  /** @type {Record<string, any>} id -> task (TASK_FIELDS) */
  const tasks = {};
  /** @type {Record<string, any>} id -> project as GET /projects lists it (with its views) */
  const projects = {};
  /** @type {Record<string, Record<string, number>>} view id -> task id -> position in that view */
  const positions = {};
  /** @type {Record<string, any[]>} task id -> all its comments (only when the captured list was complete) */
  const comments = {};
  /** @type {Record<string, any[]>} kanban view id -> its buckets, as GET /projects/:p/views/:v/buckets lists them */
  const buckets = {};
  /** @type {any} */
  let user = null;

  const addTask = (t) => {
    if (!tasks[t.id]) tasks[t.id] = pick(t, TASK_FIELDS);
    // comment_count is only sent when a list asks for it (expand=comment_count); subscription only by a task's own read
    if (typeof t.comment_count === 'number' && tasks[t.id].comment_count === undefined) tasks[t.id].comment_count = t.comment_count;
    if (t.subscription !== undefined && tasks[t.id].subscription === undefined) tasks[t.id].subscription = t.subscription;
    // the kanban buckets a task is in (a task's own read with expand=buckets)
    if (Array.isArray(t.buckets) && tasks[t.id].buckets === undefined) tasks[t.id].buckets = t.buckets;
    if (!user && t.created_by && t.created_by.name) user = t.created_by;
  };

  for (const x of pristine) {
    const b = x.resBody;
    if (!b || typeof b !== 'object') continue;
    if (x.path === '/api/v2/projects' && Array.isArray(b.items)) {
      for (const p of b.items) if (!projects[p.id]) projects[p.id] = withoutSchema(p);
      continue;
    }
    const cm = /^\/api\/v2\/tasks\/(\d+)\/comments$/.exec(x.path);
    if (cm && Array.isArray(b.items)) {
      if (!comments[cm[1]] && b.items.length === b.total) comments[cm[1]] = b.items.map(withoutSchema);
      continue;
    }
    const bm = /^\/api\/v2\/projects\/(\d+)\/views\/(\d+)\/buckets$/.exec(x.path);
    if (bm && Array.isArray(b.items)) {
      if (!buckets[bm[2]]) buckets[bm[2]] = b.items.map(withoutSchema);
      continue;
    }
    // A kanban board: each bucket with its tasks, in the view's order. It shows which bucket each task is in.
    const km = /^\/api\/v2\/projects\/(\d+)\/views\/(\d+)\/buckets\/tasks$/.exec(x.path);
    if (km && Array.isArray(b.items)) {
      const view = (positions[km[2]] ||= {});
      for (const bucket of b.items) {
        const { tasks: inBucket, ...plain } = bucket;
        for (const t of inBucket || []) {
          if (!isTask(t)) continue;
          addTask({ ...t, bucket_id: 0 }); // a board sends the bucket's id here; a task's own bucket_id is 0
          if (typeof t.position === 'number') view[t.id] = t.position;
          // as a task's own read lists its buckets: no creator, count 0
          if (tasks[t.id].buckets === undefined) tasks[t.id].buckets = [{ ...plain, count: 0, created_by: null }];
        }
      }
      if (!buckets[km[2]]) buckets[km[2]] = b.items.map(({ tasks: _t, ...plain }) => ({ ...plain, count: 0 }));
      continue;
    }
    const pm = /^\/api\/v2\/projects\/(\d+)$/.exec(x.path);
    if (pm && b.id) {
      if (!projects[b.id]) projects[b.id] = withoutSchema(b);
      continue;
    }
    // A project view's task list: the only place a task's position in that view is visible.
    const vm = /^\/api\/v2\/projects\/(\d+)\/views\/(\d+)\/tasks$/.exec(x.path);
    if (vm && Array.isArray(b.items)) {
      const view = (positions[vm[2]] ||= {});
      for (const t of b.items) {
        if (!isTask(t)) continue;
        addTask(t);
        if (typeof t.position === 'number') view[t.id] = t.position;
      }
      continue;
    }
    if (Array.isArray(b.items)) for (const t of b.items) if (isTask(t)) addTask(t);
    if (isTask(b)) addTask(b);
  }

  // Next ids, as the server's sequences would give them. Kanban views name their default and done buckets,
  // and bucket lists name the rest, so the highest bucket id seen is the last one the server handed out.
  const maxOf = (xs) => xs.reduce((m, x) => (typeof x === 'number' && x > m ? x : m), 0);
  const realProjects = Object.values(projects).filter((p) => p.id > 0);
  const views = realProjects.flatMap((p) => p.views || []);
  const bucketIds = views.flatMap((v) => [v.default_bucket_id, v.done_bucket_id]);
  for (const x of pristine) {
    if (/^\/api\/v2\/projects\/\d+\/views\/\d+\/buckets$/.test(x.path) && Array.isArray(x.resBody?.items)) bucketIds.push(...x.resBody.items.map((b) => b.id));
  }
  // Comment ids are global: at least every comment counted on a task has used one.
  const commentIds = Object.values(comments).flatMap((cs) => cs.map((c) => c.id));
  const counted = Object.values(tasks).reduce((n, t) => n + (t.comment_count || 0), 0);
  return {
    user,
    tasks,
    projects,
    positions,
    comments,
    buckets,
    next: {
      comment: Math.max(maxOf(commentIds), counted) + 1,
      task: maxOf(Object.keys(tasks).map(Number)) + 1,
      project: maxOf(realProjects.map((p) => p.id)) + 1,
      view: maxOf(Object.values(projects).flatMap((p) => (p.views || []).map((v) => v.id))) + 1,
      bucket: maxOf(bucketIds) + 1,
    },
  };
}
