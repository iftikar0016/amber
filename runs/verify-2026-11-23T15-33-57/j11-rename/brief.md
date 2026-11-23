# Brief: j11-rename

Verdict **FAIL** (kane) in run `verify-2026-11-23T15-33-57`, attempt 1, replay. Tag this run: `kwemhc`.

## The journey (frozen; do not edit it)

> Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. Open the project Website relaunch and open the task Write homepage copy. Change its title to Homepage copy {{amber_tag}}. Go back to the Website relaunch list and verify Homepage copy {{amber_tag}} is listed. Reload the page, then verify Homepage copy {{amber_tag}} is still listed.

Expected outcome: The new title is listed, and still listed after a reload

## What Kane saw

- The renamed task is not listed because the application rejects the task update request.
- Kane's summary: The renamed task is not listed because the application rejects the task update request.
- Step 16 failed: assert: Homepage copy {{global.amber_tag}} is listed.
- Failure record (step 16): assertion_failed: @ step 7
  - Kane's root-cause guess (a lead, not an instruction): The server refused the request to save the new task title, so the project list continued to show the old title.

Screenshots, last one is the final page (open them with the Read tool):
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j11-rename\a1\shots\13.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j11-rename\a1\shots\14.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j11-rename\a1\shots\15.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j11-rename\a1\shots\16.jpg

## What the capsule could not answer in this flow

- `PATCH /api/v2/tasks/1` → 501 unanswered-write body: [{"op":"add","path":"/title","value":"Homepage copy kwemhc"},{"op":"add","path":"/description","value":""},{"op":"add","path":"/done","value":false},{"op":"add","path":"/due_date","value":"0001-01-01T …

## What the real server did in this journey during capture

From `capture/journeys/j11-rename.ndjson` (scrubbed). Changes and the reads that followed them are what the store has to reproduce:
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
- GET /api/v2/projects/2 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/ProjectReadBody.json","id":2,"title":"Website relaunch","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- GET /api/v2/projects/2/views/9/tasks?sort_by=position&order_by=asc&filter=&filter_include_nulls=false&filter_timezone=GMT&q=&expand=subtasks&expand=comment_count&expand=is_unread&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":5,"title":"Launch checklist","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date" …
- GET /api/v2/tasks/1?expand=reactions&expand=is_unread&expand=buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/TaskReadOneBody.json","id":1,"title":"Write homepage copy","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"000 …
- GET /api/v2/projects/2/views/12/buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedBucket.json","items":[{"id":7,"title":"To-Do","project_view_id":12,"limit":0,"count":0,"position":100,"created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"202 …
- GET /api/v2/avatar/amber?size=48 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/tasks/1/comments?order_by=asc&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTaskComment.json","items":[],"total":0,"page":1,"per_page":50,"total_pages":0}
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- PATCH /api/v2/tasks/1 → 200
  - request: [{"op":"add","path":"/title","value":"Homepage copy imwezs"},{"op":"add","path":"/description","value":""},{"op":"add","path":"/done","value":false},{"op":"add","path":"/due_date","value":"0001-01-01T00:00:00Z"},{"op":"add","path":"/start_date","value":"0001-01-01T00:00:00Z"},{"op":"add","path":"/en …
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/Task.json","id":1,"title":"Homepage copy imwezs","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"0001-01-01T00:00:00Z","end_date":"0001-01-01T00:00:00Z","assignees":[],"labels":null,"hex_color":"","percent_done …
- GET /api/v2/info → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/VikunjaInfos.json","version":"v2.8.0","frontend_url":"http://127.0.0.1:4790/","motd":"","link_sharing_enabled":true,"max_file_size":"20MB","max_items_per_page":50,"available_migrators":["vikunja-file","ticktick","wekan","csv","planka"],"task_attachmen …
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- GET /api/v2/avatar/amber?size=40 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/labels?page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedLabelWithTaskID.json","items":[{"id":1,"title":"urgent","description":"","hex_color":"e8445a","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"created":"2026-11-23 …
- GET /api/v2/projects?is_archived=true&expand=permissions&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedProject.json","items":[{"id":1,"title":"Inbox","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- GET /api/v2/projects/2 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/ProjectReadBody.json","id":2,"title":"Website relaunch","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- POST /api/v2/user/token/refresh → 200
  - request: null
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/AuthTokenBodyBody.json","token":"amber-demo-token"}
- GET /api/v2/notifications?page=1&per_page=20 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedDatabaseNotification.json","items":[],"total":0,"page":1,"per_page":20,"total_pages":0}
- GET /api/v2/projects/2/views/9/tasks?sort_by=position&order_by=asc&filter=&filter_include_nulls=false&filter_timezone=GMT&q=&expand=subtasks&expand=comment_count&expand=is_unread&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":5,"title":"Launch checklist","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date" …

## Rules

- Fix **one** interaction, in `capsule-src/amber/handlers.js` and the store (`capsule-src/amber/store.js`, `src/capsule/model.mjs`). One commit, naming this flow and this run.
- Never edit `flows/`, `journeys.json` or anything a Kane run wrote. Never detect Kane, its tag or its test account to special-case it.
- Answer the request the way Vikunja would, from the store, for any data, not just the values in this journey.
- Then: `node bin/amber.mjs build`, and re-run this flow with `node bin/amber.mjs verify --only j11-rename`.
