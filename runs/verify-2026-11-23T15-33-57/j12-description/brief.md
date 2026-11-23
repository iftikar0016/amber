# Brief: j12-description

Verdict **FAIL** (kane) in run `verify-2026-11-23T15-33-57`, attempt 1, replay. Tag this run: `bnaifg`.

## The journey (frozen; do not edit it)

> Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. Open the project Kitchen renovation and open the task Choose worktop. Set its description to Oak or quartz {{amber_tag}} and save it. Reload the page, then verify the description Oak or quartz {{amber_tag}} is shown.

Expected outcome: The new description is still there after a reload

## What Kane saw

- The task description cannot be reliably saved and is missing after the page reloads.
- Kane's summary: The task description cannot be reliably saved and is missing after the page reloads.
- Step 16 failed: analyze: Checking whether the task description is present
- Failure record (step 16): analyzer_failed: @ step 7
  - Kane's root-cause guess (a lead, not an instruction): The application rejects the requested description change, so the saved text is not retained when the task page is loaded again.

Screenshots, last one is the final page (open them with the Read tool):
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j12-description\a1\shots\13.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j12-description\a1\shots\14.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j12-description\a1\shots\15.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j12-description\a1\shots\16.jpg

## What the capsule could not answer in this flow

- `PATCH /api/v2/tasks/7` → 501 unanswered-write body: [{"op":"add","path":"/title","value":"Choose worktop"},{"op":"add","path":"/description","value":"<p>Oak or quartz bnaifg</p>"},{"op":"add","path":"/done","value":false},{"op":"add","path":"/due_date" …

## What the real server did in this journey during capture

From `capture/journeys/j12-description.ndjson` (scrubbed). Changes and the reads that followed them are what the store has to reproduce:
- GET /api/v2/info → 200
- POST /api/v2/login → 200
  - request: {"username":"amber","password":"[scrubbed]","long_token":true}
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/AuthTokenBodyBody.json","token":"amber-demo-token"}
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- GET /api/v2/avatar/amber?size=40 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/labels?page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedLabelWithTaskID.json","items":[{"id":1,"title":"urgent","description":"","hex_color":"e8445a","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"created":"2026-11-23 …
- GET /api/v2/projects?is_archived=true&expand=permissions&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedProject.json","items":[{"id":1,"title":"Inbox","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- POST /api/v2/user/token/refresh → 200
  - request: null
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/AuthTokenBodyBody.json","token":"amber-demo-token"}
- GET /api/v2/notifications?page=1&per_page=20 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedDatabaseNotification.json","items":[],"total":0,"page":1,"per_page":20,"total_pages":0}
- GET /api/v2/tasks?sort_by=due_date&sort_by=id&order_by=asc&order_by=desc&filter=done%20%3D%20false&filter_include_nulls=false&q=&expand=comment_count&expand=is_unread&filter_timezone=GMT&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":8,"title":"Order tiles","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"2026-11-25T12:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"000 …
- GET /api/v2/tasks?per_page=1&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":1,"title":"Write homepage copy","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_da …
- GET /api/v2/projects/3 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/ProjectReadBody.json","id":3,"title":"Kitchen renovation","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"}," …
- GET /api/v2/projects/3/views/13/tasks?sort_by=position&order_by=asc&filter=&filter_include_nulls=false&filter_timezone=GMT&q=&expand=subtasks&expand=comment_count&expand=is_unread&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":9,"title":"Book electrician","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"2026-11-29T12:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date" …
- GET /api/v2/tasks/7?expand=reactions&expand=is_unread&expand=buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/TaskReadOneBody.json","id":7,"title":"Choose worktop","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"0001-01- …
- GET /api/v2/projects/3/views/16/buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedBucket.json","items":[{"id":10,"title":"To-Do","project_view_id":16,"limit":0,"count":0,"position":100,"created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"20 …
- GET /api/v2/tasks/7/comments?order_by=asc&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTaskComment.json","items":[],"total":0,"page":1,"per_page":50,"total_pages":0}
- GET /api/v2/avatar/amber?size=48 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- PATCH /api/v2/tasks/7 → 200
  - request: [{"op":"add","path":"/title","value":"Choose worktop"},{"op":"add","path":"/description","value":"<p>Oak or quartz poryba</p>"},{"op":"add","path":"/done","value":false},{"op":"add","path":"/due_date","value":"0001-01-01T00:00:00Z"},{"op":"add","path":"/start_date","value":"0001-01-01T00:00:00Z"},{" …
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/Task.json","id":7,"title":"Choose worktop","description":"<p>Oak or quartz poryba</p>","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"0001-01-01T00:00:00Z","end_date":"0001-01-01T00:00:00Z","assignees":[],"labels":null,"hex_co …
- GET /api/v2/info → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/VikunjaInfos.json","version":"v2.8.0","frontend_url":"http://127.0.0.1:4790/","motd":"","link_sharing_enabled":true,"max_file_size":"20MB","max_items_per_page":50,"available_migrators":["vikunja-file","ticktick","wekan","csv","planka"],"task_attachmen …
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- GET /api/v2/avatar/amber?size=40 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/labels?page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedLabelWithTaskID.json","items":[{"id":1,"title":"urgent","description":"","hex_color":"e8445a","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"created":"2026-11-23 …
- GET /api/v2/projects?is_archived=true&expand=permissions&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedProject.json","items":[{"id":1,"title":"Inbox","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- GET /api/v2/tasks/7?expand=reactions&expand=is_unread&expand=buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/TaskReadOneBody.json","id":7,"title":"Choose worktop","description":"<p>Oak or quartz poryba</p>","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priorit …
- POST /api/v2/user/token/refresh → 200
  - request: null
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/AuthTokenBodyBody.json","token":"amber-demo-token"}
- GET /api/v2/notifications?page=1&per_page=20 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedDatabaseNotification.json","items":[],"total":0,"page":1,"per_page":20,"total_pages":0}
- GET /api/v2/projects/3/views/16/buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedBucket.json","items":[{"id":10,"title":"To-Do","project_view_id":16,"limit":0,"count":0,"position":100,"created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"20 …
- GET /api/v2/projects/3 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/ProjectReadBody.json","id":3,"title":"Kitchen renovation","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"}," …
- GET /api/v2/avatar/amber?size=48 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/tasks/7/comments?order_by=asc&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTaskComment.json","items":[],"total":0,"page":1,"per_page":50,"total_pages":0}

## Rules

- Fix **one** interaction, in `capsule-src/amber/handlers.js` and the store (`capsule-src/amber/store.js`, `src/capsule/model.mjs`). One commit, naming this flow and this run.
- Never edit `flows/`, `journeys.json` or anything a Kane run wrote. Never detect Kane, its tag or its test account to special-case it.
- Answer the request the way Vikunja would, from the store, for any data, not just the values in this journey.
- Then: `node bin/amber.mjs build`, and re-run this flow with `node bin/amber.mjs verify --only j12-description`.
