# Brief: j18-search-new-task

Verdict **FAIL** (kane) in run `verify-2026-11-25T04-15-29`, attempt 1, replay. Tag this run: `xrexgf`.

## The journey (frozen; do not edit it)

> Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. Open the project Kitchen renovation and add a new task titled Buy sealant {{amber_tag}}. Use the search in the top bar to search for {{amber_tag}}, open Buy sealant {{amber_tag}} from the results, then verify its page shows the title Buy sealant {{amber_tag}}. Reload the page, then verify the title Buy sealant {{amber_tag}} is still shown.

Expected outcome: Search finds a new task and opens it

## What Kane saw

- Searching for the newly created task fails because the task-search request returns a 404 error, leaving no result to open.
- Kane's summary: Searching for the newly created task fails because the task-search request returns a 404 error, leaving no result to open.
- Step 16 failed: click: Clicking open Buy sealant {{global.amber_tag}} from the results
- Failure record (step 16): action_failed: click @ step 8
  - Kane's root-cause guess (a lead, not an instruction): The application has no working server route for the task search request used by the top-bar search.

Screenshots, last one is the final page (paths relative to the repository; open them with the Read tool):
- runs/verify-2026-11-25T04-15-29/j18-search-new-task/a1/shots/13.jpg
- runs/verify-2026-11-25T04-15-29/j18-search-new-task/a1/shots/14.jpg
- runs/verify-2026-11-25T04-15-29/j18-search-new-task/a1/shots/15.jpg
- runs/verify-2026-11-25T04-15-29/j18-search-new-task/a1/shots/16.jpg

## What the capsule could not answer in this flow

- `GET /api/v2/tasks?q=xrexgf&sort_by=done&sort_by=relevance&filter=&page=1` → 404 unanswered
- `GET /api/v2/tasks?q=xrexgf&sort_by=done&sort_by=relevance&filter=&page=1` → 404 unanswered

## What the real server did in this journey during capture

From `capture/journeys/j18-search-new-task.ndjson` (scrubbed). Changes and the reads that followed them are what the store has to reproduce:
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
- GET /api/v2/projects/3 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/ProjectReadBody.json","id":3,"title":"Kitchen renovation","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"}," …
- GET /api/v2/projects/3/views/13/tasks?sort_by=position&order_by=asc&filter=&filter_include_nulls=false&filter_timezone=GMT&q=&expand=subtasks&expand=comment_count&expand=is_unread&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":9,"title":"Book electrician","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"2026-12-01T12:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date" …
- POST /api/v2/projects/3/tasks/bulk → 201
  - request: {"tasks":[{"title":"Buy sealant fggucf","description":"","done":false,"priority":0,"hex_color":"","percent_done":0,"repeat_after":0,"repeat_mode":0,"is_favorite":false,"bucket_id":0,"project_id":3,"reminders":[],"cover_image_attachment_id":0}]}
  - response: {"tasks":[{"id":13,"title":"Buy sealant fggucf","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"0001-01-01T00:00:00Z","end_date":"0001-01-01T00:00:00Z","assignees":[],"labels":null,"hex_color":"","percent_done":0,"identifier":"#5","index":5,"related_tasks":nu …
- GET /api/v2/projects/3/views/13/tasks?sort_by=position&order_by=asc&filter=&filter_include_nulls=false&filter_timezone=GMT&q=&expand=subtasks&expand=comment_count&expand=is_unread&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":13,"title":"Buy sealant fggucf","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_da …
- GET /api/v2/tasks?q=fggucf&sort_by=done&sort_by=relevance&filter=&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":13,"title":"Buy sealant fggucf","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_da …
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- GET /api/v2/tasks/13?expand=reactions&expand=is_unread&expand=buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/TaskReadOneBody.json","id":13,"title":"Buy sealant fggucf","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"000 …
- GET /api/v2/projects/3/views/16/buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedBucket.json","items":[{"id":10,"title":"To-Do","project_view_id":16,"limit":0,"count":0,"position":100,"created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"20 …
- GET /api/v2/tasks/13/comments?order_by=asc&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTaskComment.json","items":[],"total":0,"page":1,"per_page":50,"total_pages":0}
- GET /api/v2/avatar/amber?size=48 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/info → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/VikunjaInfos.json","version":"v2.8.0","frontend_url":"http://127.0.0.1:4790/","motd":"","link_sharing_enabled":true,"max_file_size":"20MB","max_items_per_page":50,"available_migrators":["vikunja-file","ticktick","wekan","csv","planka"],"task_attachmen …
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- GET /api/v2/avatar/amber?size=40 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/labels?page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedLabelWithTaskID.json","items":[{"id":1,"title":"urgent","description":"","hex_color":"e8445a","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"created":"2026-11-23 …
- GET /api/v2/tasks/13?expand=reactions&expand=is_unread&expand=buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/TaskReadOneBody.json","id":13,"title":"Buy sealant fggucf","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"000 …
- GET /api/v2/projects?is_archived=true&expand=permissions&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedProject.json","items":[{"id":1,"title":"Inbox","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- POST /api/v2/user/token/refresh → 200
  - request: null
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/AuthTokenBodyBody.json","token":"amber-demo-token"}
- GET /api/v2/notifications?page=1&per_page=20 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedDatabaseNotification.json","items":[],"total":0,"page":1,"per_page":20,"total_pages":0}
- GET /api/v2/avatar/amber?size=48 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/tasks/13/comments?order_by=asc&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTaskComment.json","items":[],"total":0,"page":1,"per_page":50,"total_pages":0}
- GET /api/v2/projects/3/views/16/buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedBucket.json","items":[{"id":10,"title":"To-Do","project_view_id":16,"limit":0,"count":0,"position":100,"created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"20 …

## Rules

- Fix **one** interaction, in `capsule-src/amber/handlers.js` and the store (`capsule-src/amber/store.js`, `src/capsule/model.mjs`). One commit, naming this flow and this run.
- Never edit `flows/`, `journeys.json` or anything a Kane run wrote. Never detect Kane, its tag or its test account to special-case it.
- Answer the request the way Vikunja would, from the store, for any data, not just the values in this journey.
- Then: `node bin/amber.mjs build`, and re-run this flow with `node bin/amber.mjs verify --only j18-search-new-task`.
