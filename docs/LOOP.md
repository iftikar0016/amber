# The repair loop, one interaction at a time

Each entry: the Kane failure that drove the repair, what changed in the capsule, and the Kane run that proved it with the server off. Credits are AMBER's measured spend (balance before and after each batch, `runs/credits.ndjson`).

Development aid used before spending credits: `node scripts/store-check.mjs pristine` (every pre-change read the store answers, compared with what the real server sent) and `node scripts/store-check.mjs journey <id>` (a captured journey's requests through the capsule's own `sw.js` in a Node VM; every read after the change is compared with the real server's). Zero credits, never evidence.

## j09-add-task: add a task

- **Failure** (baseline `verify-2026-11-23T15-33-57`): `POST /api/v2/projects/3/tasks/bulk` refused with 501, so "Paint samples <tag>" never appeared.
- **Repair:** the model now holds the seeded tasks, projects (with their views) and each captured view's task positions, lifted from the pristine capture. `POST /projects/:p/tasks/bulk` creates tasks the way Vikunja does (next id, next index in the project, `#<index>` identifier, first in every view at half the lowest position). `GET /projects/:p/views/:v/tasks` for list and table views is answered from the store (view filter, `done = …` request filters, `sort_by`/`order_by`, pagination), and only for views whose order the capture shows; anything else still falls through to the replay.
- **Checked first (zero credits):** the store's answers to the three pristine list/table reads equal the server's; in the captured journey, the post-change list read equals the server's. Known difference: the create response lists positions only for the list and table views (the capture never showed the Gantt or Kanban order, so they are not invented).
- **Proof:** `verify-2026-11-23T16-13-35`, PASS, 9.10 credits.
