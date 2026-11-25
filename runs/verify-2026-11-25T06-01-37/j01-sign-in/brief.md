# Brief: j01-sign-in (REGRESSION: this flow passed before)

Verdict **FAIL** (kane) in run `verify-2026-11-25T06-01-37`, attempt 1, replay. Tag this run: `rmezgr`.

## The journey (frozen; do not edit it)

> Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. Verify the home page lists the task Order tiles among the current tasks.

Expected outcome: Home greets Amber Demo and lists current tasks

## What Kane saw

- The home page correctly identifies Amber Demo, but the recorded greeting check is too specific for the current greeting wording.
- Kane's summary: The home page correctly identifies Amber Demo, but the recorded greeting check is too specific for the current greeting wording.
- Step 10 failed: assert: the home page greets Amber Demo
- Failure record (step 10): assertion_failed: @ step 10
  - Kane's root-cause guess (a lead, not an instruction): The replayed assertion expects an older exact greeting format. The live home page shows “Back at it, Amber Demo,” which fulfills the objective of greeting Amber Demo but is not accepted by the recorded check.

Screenshots, last one is the final page (paths relative to the repository; open them with the Read tool):
- runs/verify-2026-11-25T06-01-37/j01-sign-in/a1/shots/7.jpg
- runs/verify-2026-11-25T06-01-37/j01-sign-in/a1/shots/8.jpg
- runs/verify-2026-11-25T06-01-37/j01-sign-in/a1/shots/9.jpg
- runs/verify-2026-11-25T06-01-37/j01-sign-in/a1/shots/10.jpg

## What the capsule could not answer in this flow

Nothing unanswered: every API call was answered. The fault is in what was answered (wrong or stale data), or in the page.

## What the real server did in this journey during capture

From `capture/journeys/j01-sign-in.ndjson` (scrubbed). Changes and the reads that followed them are what the store has to reproduce:
- GET /api/v2/info → 200
- POST /api/v2/login → 200
  - request: {"username":"amber","password":"[scrubbed]","long_token":true}
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/AuthTokenBodyBody.json","token":"amber-demo-token"}
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- GET /api/v2/avatar/amber?size=40 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/projects?is_archived=true&expand=permissions&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedProject.json","items":[{"id":1,"title":"Inbox","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- POST /api/v2/user/token/refresh → 200
  - request: null
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/AuthTokenBodyBody.json","token":"amber-demo-token"}
- GET /api/v2/notifications?page=1&per_page=20 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedDatabaseNotification.json","items":[],"total":0,"page":1,"per_page":20,"total_pages":0}
- GET /api/v2/labels?page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedLabelWithTaskID.json","items":[{"id":1,"title":"urgent","description":"","hex_color":"e8445a","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"created":"2026-11-23 …
- GET /api/v2/tasks?sort_by=due_date&sort_by=id&order_by=asc&order_by=desc&filter=done%20%3D%20false&filter_include_nulls=false&q=&expand=comment_count&expand=is_unread&filter_timezone=GMT&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":8,"title":"Order tiles","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"2026-11-25T12:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"000 …
- GET /api/v2/tasks?per_page=1&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":1,"title":"Write homepage copy","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_da …

## Rules

- Fix **one** interaction, in `capsule-src/amber/handlers.js` and the store (`capsule-src/amber/store.js`, `src/capsule/model.mjs`). One commit, naming this flow and this run.
- Never edit `flows/`, `journeys.json` or anything a Kane run wrote. Never detect Kane, its tag or its test account to special-case it.
- Answer the request the way Vikunja would, from the store, for any data, not just the values in this journey.
- Then: `node bin/amber.mjs build`, and re-run this flow with `node bin/amber.mjs verify --only j01-sign-in`.
