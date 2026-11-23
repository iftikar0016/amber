# Brief: j13-delete

Verdict **FAIL** (kane) in run `verify-2026-11-23T15-33-57`, attempt 1, replay. Tag this run: `yushku`.

## The journey (frozen; do not edit it)

> Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. Open the project Website relaunch and open the task Pick a colour palette. Delete the task and confirm. Verify the Website relaunch list no longer shows Pick a colour palette. Reload the page, then verify Pick a colour palette is still gone and Set up analytics is still listed.

Expected outcome: The task is gone from the list, and still gone after a reload

## What Kane saw

- Deleting “Pick a colour palette” fails because the application rejects the delete request, leaving the task in the Website relaunch list.
- Kane's summary: Deleting “Pick a colour palette” fails because the application rejects the delete request, leaving the task in the Website relaunch list.
- Step 14 failed: assert: the Website relaunch list no longer shows Pick a colour palette.
- Failure record (step 14): assertion_failed: @ step 6
  - Kane's root-cause guess (a lead, not an instruction): The application does not support the requested task deletion, so it leaves the task in place instead of removing it.

Screenshots, last one is the final page (open them with the Read tool):
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j13-delete\a1\shots\11.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j13-delete\a1\shots\12.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j13-delete\a1\shots\13.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j13-delete\a1\shots\14.jpg

## What the capsule could not answer in this flow

- `DELETE /api/v2/tasks/2` → 501 unanswered-write

## What the real server did in this journey during capture

From `capture/journeys/j13-delete.ndjson` (scrubbed). Changes and the reads that followed them are what the store has to reproduce:
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
- GET /api/v2/tasks/2?expand=reactions&expand=is_unread&expand=buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/TaskReadOneBody.json","id":2,"title":"Pick a colour palette","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"0 …
- GET /api/v2/projects/2/views/12/buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedBucket.json","items":[{"id":7,"title":"To-Do","project_view_id":12,"limit":0,"count":0,"position":100,"created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"202 …
- GET /api/v2/tasks/2/comments?order_by=asc&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTaskComment.json","items":[],"total":0,"page":1,"per_page":50,"total_pages":0}
- GET /api/v2/avatar/amber?size=48 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- DELETE /api/v2/tasks/2 → 204
  - request: null
  - response: null
- GET /api/v2/projects/2/views/9/tasks?sort_by=position&order_by=asc&filter=&filter_include_nulls=false&filter_timezone=GMT&q=&expand=subtasks&expand=comment_count&expand=is_unread&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":5,"title":"Launch checklist","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date" …
- GET /api/v2/info → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/VikunjaInfos.json","version":"v2.8.0","frontend_url":"http://127.0.0.1:4790/","motd":"","link_sharing_enabled":true,"max_file_size":"20MB","max_items_per_page":50,"available_migrators":["vikunja-file","ticktick","wekan","csv","planka"],"task_attachmen …
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- GET /api/v2/avatar/amber?size=40 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/projects/2 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/ProjectReadBody.json","id":2,"title":"Website relaunch","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- GET /api/v2/projects?is_archived=true&expand=permissions&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedProject.json","items":[{"id":1,"title":"Inbox","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- GET /api/v2/labels?page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedLabelWithTaskID.json","items":[{"id":1,"title":"urgent","description":"","hex_color":"e8445a","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"created":"2026-11-23 …
- POST /api/v2/user/token/refresh → 200
  - request: null
  - response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/AuthTokenBodyBody.json","token":"amber-demo-token"}
- GET /api/v2/notifications?page=1&per_page=20 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedDatabaseNotification.json","items":[],"total":0,"page":1,"per_page":20,"total_pages":0}
- GET /api/v2/projects/2/views/9/tasks?sort_by=position&order_by=asc&filter=&filter_include_nulls=false&filter_timezone=GMT&q=&expand=subtasks&expand=comment_count&expand=is_unread&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":5,"title":"Launch checklist","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date" …

## Rules

- Fix **one** interaction, in `capsule-src/amber/handlers.js` and the store (`capsule-src/amber/store.js`, `src/capsule/model.mjs`). One commit, naming this flow and this run.
- Never edit `flows/`, `journeys.json` or anything a Kane run wrote. Never detect Kane, its tag or its test account to special-case it.
- Answer the request the way Vikunja would, from the store, for any data, not just the values in this journey.
- Then: `node bin/amber.mjs build`, and re-run this flow with `node bin/amber.mjs verify --only j13-delete`.
