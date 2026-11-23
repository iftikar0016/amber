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

## j14-new-project: create a project

- **Failure** (baseline `verify-2026-11-23T15-33-57`): `POST /api/v2/projects` refused with 501; the dialog stayed open and Kane could not reach the Projects page.
- **Repair:** `POST /projects` creates the project as Vikunja does: the next project id, position id × 2^16, the four default views (List with `done = false`, Gantt, Table, Kanban with its To-Do / Doing / Done bucket ids) from the next view and bucket ids, and Vikunja's create body (owner without profile details, no permission). `GET /projects` (the sidebar and Projects page) and `GET /projects/:id` are answered from the store; the list counts only real projects in `total`, as Vikunja does, while still listing the "My Open Tasks" saved filter. The new project's list and table views are known to be empty, so its list view answers from the store. Favourites and sub-projects are still refused (501).
- **Checked first (zero credits):** the store's answers to every journey's pristine projects list and project reads equal the server's; in the captured journey the create and all three reads after it equal the server's.
- **Proof:** `verify-2026-11-23T16-48-28`, PASS, 9.39 credits.

## j15-comment: comment on a task

- **Failure** (baseline `verify-2026-11-23T15-33-57`): a **Kane false pass, disputed by AMBER**. Kane said PASS, but the capsule had refused `POST /api/v2/tasks/6/comments` (501). The final screenshot shows why Kane was fooled: after the reload, Vikunja restored the unsent comment draft into the editor, and the recorded check is a plain text locator (`text="Third quote <tag>"`), which matched the draft rather than a posted comment.
- **Repair:** the model keeps each task's comments when the capture shows the complete list (or the task counts none). `GET /tasks/:id/comments` is answered from the store (order, pagination) and `POST /tasks/:id/comments` adds Vikunja's comment (next global comment id, the user as author) and raises the task's `comment_count`. A task whose comments the store cannot list does not get new ones (501).
- **Checked first (zero credits):** the store's answers to all six pristine comment lists equal the server's; in the captured journey the create and the reads after it equal the server's.
- **Proof:** `verify-2026-11-23T16-59-33`, PASS, 9.15 credits. This time the capsule log shows the comment accepted (201) and the list after the reload answered by the store, and the final screenshot shows "Third quote iuhsvb" as a posted comment ("just now") with the editor empty.

## j10-mark-done: mark a task done (done last: verified by a fresh authored Kane run)

- **Failure** (`verify-2026-11-23T15-56-36`, authored run with the server off; its recording cannot replay anywhere, so the lock verifies it by authoring): Kane ticked the checkbox four times and each `PATCH /api/v2/tasks/7` with `done: true` was refused with 501, so the task stayed open after the reload. After the j11 repair the update route existed but still refused a change of `done` on purpose, leaving this interaction to its own repair.
- **Repair:** the task update now carries out `done`: it sets `done_at` to now (back to Vikunja's zero date when undone); the list view's own filter (`done = false`, from the store) then leaves the task out. Closing a repeating task is still refused (501), since Vikunja reschedules it instead.
- **Checked first (zero credits):** in the captured journey the update and the list read after it equal the real server's; in headless Chrome the tick was accepted and the task was gone after a reload.
- **Proof:** `verify-2026-11-23T17-12-04`, PASS (authored), 31.29 credits.
- **Known gap, not invented:** Vikunja also moves a task that is marked done into the Kanban view's Done bucket. The capture never shows a read after that, so the store does not move it yet; the Kanban board (still a replay) and the task page's bucket label do not reflect it.

## Final check: all 15 journeys with the server off

- `verify-2026-11-23T17-14-48` (AMBER's gate, `node bin/amber.mjs gate`, the same check the Stop hook runs): **15 of 15 PASS** in one run, Vikunja stopped, no refused changes, no leaks; j10 by a fresh authored run, the rest as replays. 80.16 credits.
- The loop spent 284.59 credits (AMBER total 724.84 → 1,009.43 of the 2,500 cap): repairs 79.74, regression replays 124.69, final check 80.16. No flow needed a second attempt, and none is marked as needing a human.

## Known gaps (reads no journey checks yet)

- Reads still replayed, so they do not show store changes: the home page and Upcoming task lists (`GET /tasks?…`), search, the Kanban board (`…/buckets/tasks`), and Gantt views.
- A task created in the capsule has no kanban buckets in the store, so its own read with `expand=buckets` falls through (404, never captured).
- Marking a task done does not move it into the Kanban Done bucket (see j10).
