# The repair loop, one interaction at a time

Each entry: the Kane failure that drove the repair, what changed in the capsule, and the Kane run that proved it with the server off. Credits are AMBER's measured spend (balance before and after each batch, `runs/credits.ndjson`).

Development aid used before spending credits: `node scripts/store-check.mjs pristine` (every pre-change read the store answers, compared with what the real server sent) and `node scripts/store-check.mjs journey <id>` (a captured journey's requests through the capsule's own `sw.js` in a Node VM; every read after the change is compared with the real server's). Zero credits, never evidence.

## j09-add-task: add a task

- **Failure** (baseline `verify-2026-11-23T15-33-57`): `POST /api/v2/projects/3/tasks/bulk` refused with 501, so "Paint samples <tag>" never appeared.
- **Repair:** the model now holds the seeded tasks, projects (with their views) and each captured view's task positions, lifted from the pristine capture. `POST /projects/:p/tasks/bulk` creates tasks the way Vikunja does (next id, next index in the project, `#<index>` identifier, first in every view at half the lowest position). `GET /projects/:p/views/:v/tasks` for list and table views is answered from the store (view filter, `done = …` request filters, `sort_by`/`order_by`, pagination), and only for views whose order the capture shows; anything else still falls through to the replay.
- **Checked first (zero credits):** the store's answers to the three pristine list/table reads equal the server's; in the captured journey, the post-change list read equals the server's. Known difference: the create response lists positions only for the list and table views (the capture never showed the Gantt or Kanban order, so they are not invented).
- **Proof:** `verify-2026-11-23T16-13-35`, PASS, 9.10 credits.

## j11-rename: rename a task

- **Failure** (baseline `verify-2026-11-23T15-33-57`): `PATCH /api/v2/tasks/1` refused with 501, so the list kept "Write homepage copy".
- **Repair:** `PATCH /tasks/:id` applies the task page's JSON Patch (top-level `add`/`replace`) to the task's own fields in the store and answers with Vikunja's `Task` body; the list view (already answered from the store) shows the new title. A change the store cannot carry out yet (marking done, moving the task to another project or bucket, an unknown field) is still refused with a 501, never half-applied. The model now also keeps a task's `subscription`, which Vikunja returns with the update.
- **Checked first (zero credits):** in the captured journey, the update's response and the list read after it equal the real server's.
- **Proof:** `verify-2026-11-23T16-21-57`, PASS, 9.37 credits.

## j12-description: set a task's description

- **Failure** (baseline `verify-2026-11-23T15-33-57`): the description save (`PATCH /api/v2/tasks/7`) was refused with 501. After the j11 repair the save is accepted, but the zero-credit check showed the next gap: after the reload, the task page's own read (`GET /tasks/7?expand=…buckets`) was still the replayed pre-change response, with an empty description.
- **Repair:** `GET /tasks/:id` is answered from the store in Vikunja's `TaskReadOneBody` shape (the task's kanban buckets with `expand=buckets`, its subscription, the project's `max_permission`, and Vikunja's `ETag`). It answers `expand=buckets` only for tasks whose buckets the capture shows; others still fall through to the replay. The model now keeps each task's buckets from its captured read.
- **Checked first (zero credits):** the store's answers to all six pristine task reads equal the server's, and in the captured journey the read after the change equals the server's.
- **Proof:** `verify-2026-11-23T16-29-21`, PASS, 7.18 credits.

## j13-delete: delete a task

- **Failure** (baseline `verify-2026-11-23T15-33-57`): `DELETE /api/v2/tasks/2` refused with 501, so "Pick a colour palette" stayed in the list.
- **Repair:** `DELETE /tasks/:id` removes the task from the store and from every view's order and answers 204 as Vikunja does; the list view (from the store) no longer shows it. The id is remembered as deleted, so the task's own read answers 404 rather than falling back to the captured task.
- **Checked first (zero credits):** in the captured journey, the delete and both list reads after it equal the real server's.
- **Proof:** `verify-2026-11-23T16-38-00`, PASS, 4.26 credits.
