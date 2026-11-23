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
  /** @type {any} */
  let user = null;

  const addTask = (t) => {
    if (!tasks[t.id]) tasks[t.id] = pick(t, TASK_FIELDS);
    // comment_count is only sent when a list asks for it (expand=comment_count); subscription only by a task's own read
    if (typeof t.comment_count === 'number' && tasks[t.id].comment_count === undefined) tasks[t.id].comment_count = t.comment_count;
    if (t.subscription !== undefined && tasks[t.id].subscription === undefined) tasks[t.id].subscription = t.subscription;
    if (!user && t.created_by && t.created_by.name) user = t.created_by;
  };

  for (const x of pristine) {
    const b = x.resBody;
    if (!b || typeof b !== 'object') continue;
    if (x.path === '/api/v2/projects' && Array.isArray(b.items)) {
      for (const p of b.items) if (!projects[p.id]) projects[p.id] = withoutSchema(p);
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

  const ids = Object.keys(tasks).map(Number);
  return {
    user,
    tasks,
    projects,
    positions,
    next: { task: (ids.length ? Math.max(...ids) : 0) + 1 },
  };
}
