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

## Stop-hook demonstration (deliberate regression)

To show that the Stop hook really gates the coding agent, a fresh Claude Code session in this folder broke j15's repair **on purpose**: the `POST /api/v2/tasks/:id/comments` route was made to fall through to the capsule's 501. The change was never committed. Then the session tried to end its turn. Every decision is in [`runs/gate.ndjson`](../runs/gate.ndjson).

1. **The hook fired** (`via: "hook"`, 2026-11-23 18:28:59 UTC). The capsule source had changed, so it rebuilt the capsule and had Kane replay all 15 journeys with the server off: [`verify-2026-11-23T18-29-00`](../runs/verify-2026-11-23T18-29-00/summary.json), 17 minutes, 169.92 credits.
2. **Kane was fooled again; AMBER was not.** Kane reported j15 as *passed*: after the reload, Vikunja restored the unsent comment draft into the editor, and Kane's recorded text check found it. The capsule's own log showed the comment refused, so AMBER recorded FAIL (disputed) ([`result.json`](../runs/verify-2026-11-23T18-29-00/j15-comment/a1/result.json): `kaneStatus: passed`, `unansweredWrites: 1`).
3. **The hook blocked the agent**, verbatim:
   > AMBER Stop hook (attempt 1 of 3): Kane replayed the frozen flows against the capsule with the server off, and a flow that passed before now fails.
   > - j15-comment: passed before, fails now (run verify-2026-11-23T18-29-00). Brief: runs/verify-2026-11-23T18-29-00/j15-comment/brief.md
   > Read the brief, fix the regression in the capsule store, rebuild, and re-run: node bin/amber.mjs verify --only j15-comment
4. The session read the brief, restored the route, rebuilt, and Kane proved j15 again: [`verify-2026-11-23T18-47-52`](../runs/verify-2026-11-23T18-47-52/summary.json), PASS, 13.50 credits.
5. **The hook fired again** when the session tried to stop (18:50:16 UTC): Kane replayed all 15 against the restored capsule, [`verify-2026-11-23T18-50-16`](../runs/verify-2026-11-23T18-50-16/summary.json), 15/15 PASS, 16 minutes, 148.56 credits. **The hook allowed the stop.**

The demonstration cost 331.98 credits (each full hook check re-authors j10 and replays the write journeys at 4–9 credits each), about twice the estimate. AMBER's total after it: 1,942.64 of 2,500.

## Round 2

Six new journeys (j16–j21), frozen on the real server; baseline `verify-2026-11-25T04-15-29`, server off: all six fail. AMBER's total at the start of the round-2 loop: 2,521.42 of 3,700.

Found while checking for free, not repaired (no journey fails on it): round 1 was captured on 2026-11-23 and round 2 on 2026-11-25, but the build moves every captured date by one offset (computed from the latest capture), so round-1 data, including the store's seeded tasks, now lands two days early (a task due "in 2 days" at capture shows as due today).

### j16-open-new-task: first attempt fails on the recording, not the capsule

- **Failure** (baseline): opening a task just added in the list showed "Not found": its own read (`GET /tasks/13?expand=…buckets`) fell through to a 404, because the store did not know a new task's kanban buckets.
- **Repair tried:** the model lifts each kanban view's bucket list; a new task goes into each kanban view's default bucket and gets its creator's subscription (the capture shows Vikunja does both). The zero-credit check: the new task's read then equals the real server's, field for field.
- **Kane** `verify-2026-11-25T04-51-13`: FAIL, "expected 'Order grout dmkrhw' but the opened task is titled 'Order grout rsotgq'". The store answered the read, and the screenshot shows the right page with this run's tag. The frozen recording hard-codes the capture's tag in its assertion (`'expected': 'Order grout dmkrhw'`) and the morning greeting in its variables, so as a replay it cannot pass with a fresh tag. j18's recording has the same defect (`'expected': 'Buy sealant fggucf'`). The lock is not the loop's to change; asked the session that owns it whether j16 and j18 should be verified by authored runs, like j09 and j10. The change is held, uncommitted, until it can be proved.

### j17-home-new-task: a new task on the home page

- **Failure** (baseline): a task added in Kitchen renovation was missing from Overview's Current Tasks. Every call was answered, but the list (`GET /tasks?…filter=done = false…`) was the replayed pre-change one.
- **Repair:** `GET /tasks` (the task collection across projects) is answered from the store for `done = …` filters and the sorts the store knows (due date with no-date last, then id), with `comment_count` when asked and pagination; the same route answers the front end's `per_page=1` probe. A search (`q`) or any other filter (Upcoming's due-date range) still falls through to the replay. The model already held every task: the captured home list shows all 12.
- **Checked first (zero credits):** the store's answers to the pristine home list and probe equal the server's; in the captured journey, the home list after the change has the new task in the server's place (only the date-shift noise differs).
- **Proof:** `verify-2026-11-25T04-55-12`, PASS, 9.52 credits.

### Re-check after the j17 repair, and what it now costs

- `verify-2026-11-25T04-57-28` (AMBER's gate, all 16 journeys that had passed): 16/16 PASS, no regression, **187.13 credits**, about twice the expected ~100. j09 and j10 (authored) cost 63; the 14 replays cost about 124, around 9 each (a read-only replay cost about 0.5 in round 1). Cause: every recording waits for the greeting it was captured with, "Still at it, Amber Demo?" (Vikunja's evening greeting); in the morning that wait runs 46 s and the greeting check is then re-evaluated. Reported to the session that owns the budget, with a proposal to re-check once after the remaining repairs instead of after each.

### j19-done-kanban: a task marked done moves to the Kanban Done column

- **Failure** (baseline): after "Mark task done!", Choose worktop stayed in To-Do on the Kanban board. The update was accepted, but the board (`GET /projects/3/views/16/buckets/tasks`) was the replayed pre-change one, and the store did not move the task.
- **Repair:** the model lifts each kanban view's buckets, and from the captured board each task's bucket and position there. The board is answered from the store (buckets in order, each with its tasks by position, `tasks` left out of an empty bucket as Vikunja does, `count`, `bucket_id` on each card), only when the store knows every task's bucket and position. Marking a task done moves it into each kanban view's done bucket at index × 2^16 (the capture shows 131072 for index 2); reopening a task that is in the done bucket moves it to the default bucket. The task's own read shows the new bucket.
- **Checked first (zero credits):** the store's answer to the pristine board (j06) equals the server's; in the captured journey, both boards after the change equal the server's (only the date-shift noise differs).
- **Proof:** `verify-2026-11-25T05-19-04`, PASS, 5.31 credits.

### j20-favourite-project: mark a project as a favourite

- **Failure** (baseline): the star beside Reading list sent `PATCH /api/v2/projects/4` (`[{"op":"replace","path":"/is_favorite","value":true}]`), refused with 501.
- **Repair:** `PATCH /projects/:id` carries out `is_favorite` and answers with Vikunja's `Project` body (no permission, as the capture shows); any other field must be unchanged, or the change is still refused (501). The projects list, already answered from the store, then shows the flag, and the front end lists the project under favourites.
- **Checked first (zero credits):** in the captured journey, the update's response and the projects list after it equal the real server's.
- **Proof:** `verify-2026-11-25T05-20-52`, PASS, 1.98 credits.

### j21-label-task: create a label and put it on a task

- **Failure** (baseline): creating the label (`POST /api/v2/labels`) was refused with 501, so the task never showed it.
- **Repair:** the model keeps the user's labels when the captured list is complete. `POST /labels` creates Vikunja's label (next label id; the create body carries the creator without profile details, as Vikunja's does), `GET /labels` is answered from the store (a search with `s` still falls through), and `POST /tasks/:id/labels` puts an existing label on the task; the task's own read and the list views, already answered from the store, then show it.
- **Checked first (zero credits):** the store's answers to every journey's pristine label list equal the server's; in the captured journey, the create, both label lists, the attach and the task's read after it equal the real server's (only the date-shift noise differs).
- **Proof:** `verify-2026-11-25T05-22-53`, PASS, 10.69 credits.

### Re-check after the j19, j20 and j21 repairs

- `verify-2026-11-25T05-24-38` (AMBER's gate, all 19 journeys that have passed): **19/19 PASS**, no regression, no refused change, no leak, 224.31 credits. Run once after the three repairs rather than after each, because a full re-check now costs about 200 credits (see the re-check after j17); proposed to the session that owns the budget beforehand.
- AMBER's total after it: 2,966.95 of 3,700. j16 and j18 wait on a lock decision (their recordings hard-code the capture's tag).

### j16-open-new-task: open a task just added (second attempt, authored)

- **Decision:** the lock owner switched j16 and j18 to authored verification (0c31fc1), as for j09 and j10, because their recordings check the capture's own tag. The user chose to prove each round-2 repair on its own and let the Stop hook's full pass (when this session stops) be the regression check and the final check.
- **Repair** (as tried in the first attempt above): a new task gets its creator's subscription (the next id; captured subscriptions run with task ids) and goes into each kanban view's default bucket, so its own read with `expand=buckets` is answered from the store.
- **Checked first (zero credits):** the new task's read equals the real server's, field for field; all 22 pristine reads the store answers still equal the server's.
- **Proof:** `verify-2026-11-25T05-53-07`, PASS (authored, server off), 37.01 credits: "#5 Order grout ctxeau" shown on its page, also after the reload; both reads answered by the store.

### j18-search-new-task: find a task just added with the top-bar search (authored)

- **Failure** (baseline): the search (`GET /tasks?q=<tag>&sort_by=done&sort_by=relevance…`) was never captured, so it answered 404 and there was no result to open. Its recording also checks the capture's own tag, so the lock verifies it by authored runs (0c31fc1).
- **Repair:** the task collection, already answered from the store for j17, now also answers a search: `q` in a task's title or description, case-insensitive, sorted by Vikunja's `done` then `relevance`. Relevance here is a title that starts with the text, then a title that contains it, then a description match; the capture only ever shows single results, so that order is not otherwise evidenced. Opening the result uses the j16 repair.
- **Checked first (zero credits):** the store's answer to the pristine search (j08, "tiles") and, in the captured journey, to the search for the new task equal the real server's; all 23 pristine reads the store answers still equal the server's.
- **Proof:** `verify-2026-11-25T05-56-28`, PASS (authored, server off), 50.65 credits: the search found "Buy sealant tjaqmd" (answered by the store) and its page still showed it after the reload.

All six round-2 repairs are now proven, each in its own Kane run. As the user chose, the regression check and final check is the Stop hook's full pass over every journey that has passed, when this session stops.

### The Stop hook's pass after the j18 repair: cut off, and j01 fails on its recorded greeting

- When this session ended its turn after the j18 repair, the Stop hook started the full pass over all 21 journeys: `verify-2026-11-25T06-01-37`. It stopped partway (about 31 minutes in, just as j17 started, when a message from another session arrived). It left no summary, and its spend is not in `runs/credits.ndjson`: the Kane balance went from 6,656.81 (after j18) to 6,424.93, so **231.88 credits** went to it. AMBER's real total at that point: 3,054.61 recorded + 231.88 = **about 3,286.49**.
- It finished 16 journeys: 15 PASS and **j01-sign-in FAIL**, recorded in `runs/state.json` as a regression. Kane's own diagnosis: "The home page correctly identifies Amber Demo, but the recorded greeting check is too specific for the current greeting wording." The page said "Back at it, Amber Demo"; the recording checks for "Still at it, Amber Demo?". Every call was answered by the capsule. This is the same recorded-greeting defect that moved j09 to authored runs; it fails **only** on the greeting. Not changed here: the flow and the lock are not the loop's to change.
