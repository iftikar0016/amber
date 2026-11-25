# Brief: j20-favourite-project

Verdict **FAIL** (kane) in run `verify-2026-11-25T04-15-29`, attempt 1, replay. Tag this run: `gazsca`.

## The journey (frozen; do not edit it)

> Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. In the main menu on the left, hover over the project Reading list and click the star button beside its name, labelled Mark this project as favorite; do not star any task. Then verify Reading list is listed as a favorite project in the main menu. Reload the page, then verify Reading list is still listed as a favorite project.

Expected outcome: A favourite project stays a favourite after a reload

## What Kane saw

- The app cannot save Reading list as a favorite because its project update request fails.
- Kane's summary: The app cannot save Reading list as a favorite because its project update request fails.
- Step 12 failed: assert: Reading list is listed as a favorite project in the main menu
- Failure record (step 12): assertion_failed: @ step 4
  - Kane's root-cause guess (a lead, not an instruction): When the user marks the Reading list project as a favorite, the server does not support the requested change and rejects it. As a result, the project is not added to Favorites.

Screenshots, last one is the final page (paths relative to the repository; open them with the Read tool):
- runs/verify-2026-11-25T04-15-29/j20-favourite-project/a1/shots/9.jpg
- runs/verify-2026-11-25T04-15-29/j20-favourite-project/a1/shots/10.jpg
- runs/verify-2026-11-25T04-15-29/j20-favourite-project/a1/shots/11.jpg
- runs/verify-2026-11-25T04-15-29/j20-favourite-project/a1/shots/12.jpg

## What the capsule could not answer in this flow

- `PATCH /api/v2/projects/4` → 501 unanswered-write body: [{"op":"replace","path":"/is_favorite","value":true}]

## What the real server did in this journey during capture

From `capture/journeys/j20-favourite-project.ndjson` (scrubbed). Changes and the reads that followed them are what the store has to reproduce:
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
- GET /api/v2/tasks?sort_by=due_date&sort_by=id&order_by=asc&order_by=desc&filter=done%20%3D%20false&filter_include_nulls=false&q=&expand=comment_count&expand=is_unread&filter_timezone=GMT&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":8,"title":"Order tiles","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"2026-11-27T12:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"000 …
- GET /api/v2/tasks?per_page=1&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":1,"title":"Write homepage copy","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_da …
- PATCH /api/v2/projects/4 → 200
  - request: [{"op":"replace","path":"/is_favorite","value":true}]
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/Project.json","id":4,"title":"Reading list","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is_archived":false,"background_information":null,"background_blur_hash":"","is_favorite":true,"position":262144,"v …
- GET /api/v2/info → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/VikunjaInfos.json","version":"v2.8.0","frontend_url":"http://127.0.0.1:4790/","motd":"","link_sharing_enabled":true,"max_file_size":"20MB","max_items_per_page":50,"available_migrators":["vikunja-file","ticktick","wekan","csv","planka"],"task_attachmen …
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- GET /api/v2/avatar/amber?size=40 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/projects?is_archived=true&expand=permissions&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedProject.json","items":[{"id":1,"title":"Inbox","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- GET /api/v2/labels?page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedLabelWithTaskID.json","items":[{"id":1,"title":"urgent","description":"","hex_color":"e8445a","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"created":"2026-11-23 …
- GET /api/v2/notifications?page=1&per_page=20 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedDatabaseNotification.json","items":[],"total":0,"page":1,"per_page":20,"total_pages":0}
- POST /api/v2/user/token/refresh → 200
  - request: null
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/AuthTokenBodyBody.json","token":"amber-demo-token"}
- GET /api/v2/tasks?sort_by=due_date&sort_by=id&order_by=asc&order_by=desc&filter=done%20%3D%20false&filter_include_nulls=false&q=&expand=comment_count&expand=is_unread&filter_timezone=GMT&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":8,"title":"Order tiles","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"2026-11-27T12:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"000 …
- GET /api/v2/tasks?per_page=1&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":1,"title":"Write homepage copy","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_da …

## Rules

- Fix **one** interaction, in `capsule-src/amber/handlers.js` and the store (`capsule-src/amber/store.js`, `src/capsule/model.mjs`). One commit, naming this flow and this run.
- Never edit `flows/`, `journeys.json` or anything a Kane run wrote. Never detect Kane, its tag or its test account to special-case it.
- Answer the request the way Vikunja would, from the store, for any data, not just the values in this journey.
- Then: `node bin/amber.mjs build`, and re-run this flow with `node bin/amber.mjs verify --only j20-favourite-project`.
