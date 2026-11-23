# Brief: j15-comment

Verdict **FAIL** (wire) in run `verify-2026-11-23T15-33-57`, attempt 1, replay. Tag this run: `comcvg`.

## The journey (frozen; do not edit it)

> Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. Open the project Kitchen renovation and open the task Get three quotes. Add the comment Third quote {{amber_tag}}, then verify the comments show both Third quote {{amber_tag}} and Two quotes in so far. Reload the page, then verify Third quote {{amber_tag}} is still shown.

Expected outcome: The new comment shows beside the existing one, and after a reload

## What Kane saw

- disputed: Kane said passed, but the capsule refused 1 change(s) during the flow, so the change cannot have been kept

Screenshots, last one is the final page (open them with the Read tool):
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j15-comment\a1\shots\16.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j15-comment\a1\shots\17.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j15-comment\a1\shots\18.jpg
- C:\Users\iftik\hackathons\kane\amber\runs\verify-2026-11-23T15-33-57\j15-comment\a1\shots\19.jpg

## What the capsule could not answer in this flow

- `POST /api/v2/tasks/6/comments` → 501 unanswered-write body: {"comment":"<p>Third quote comcvg</p>"}

## What the real server did in this journey during capture

From `capture/journeys/j15-comment.ndjson` (scrubbed). Changes and the reads that followed them are what the store has to reproduce:
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
- GET /api/v2/labels?page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedLabelWithTaskID.json","items":[{"id":1,"title":"urgent","description":"","hex_color":"e8445a","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"created":"2026-11-23 …
- GET /api/v2/notifications?page=1&per_page=20 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedDatabaseNotification.json","items":[],"total":0,"page":1,"per_page":20,"total_pages":0}
- GET /api/v2/tasks?sort_by=due_date&sort_by=id&order_by=asc&order_by=desc&filter=done%20%3D%20false&filter_include_nulls=false&q=&expand=comment_count&expand=is_unread&filter_timezone=GMT&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":8,"title":"Order tiles","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"2026-11-25T12:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"000 …
- GET /api/v2/tasks?per_page=1&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":1,"title":"Write homepage copy","description":"","project_id":2,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_da …
- GET /api/v2/projects/3 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/ProjectReadBody.json","id":3,"title":"Kitchen renovation","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"}," …
- GET /api/v2/projects/3/views/13/tasks?sort_by=position&order_by=asc&filter=&filter_include_nulls=false&filter_timezone=GMT&q=&expand=subtasks&expand=comment_count&expand=is_unread&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTask.json","items":[{"id":9,"title":"Book electrician","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"2026-11-29T12:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date" …
- GET /api/v2/tasks/6?expand=reactions&expand=is_unread&expand=buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/TaskReadOneBody.json","id":6,"title":"Get three quotes","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"0001-0 …
- GET /api/v2/projects/3/views/16/buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedBucket.json","items":[{"id":10,"title":"To-Do","project_view_id":16,"limit":0,"count":0,"position":100,"created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"20 …
- GET /api/v2/tasks/6/comments?order_by=asc&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTaskComment.json","items":[{"id":1,"comment":"Two quotes in so far, waiting on the third.","author":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"reactions":null,"created":" …
- GET /api/v2/avatar/amber?size=48 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/avatar/amber?size=20 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- POST /api/v2/tasks/6/comments → 201
  - request: {"comment":"<p>Third quote dszhls</p>"}
  - response: {"id":2,"comment":"<p>Third quote dszhls</p>","author":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"reactions":null,"created":"2026-11-23T15:24:57.9204331Z","updated":"2026-11-23T15:24:57.9204331Z"}
- GET /api/v2/info → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/VikunjaInfos.json","version":"v2.8.0","frontend_url":"http://127.0.0.1:4790/","motd":"","link_sharing_enabled":true,"max_file_size":"20MB","max_items_per_page":50,"available_migrators":["vikunja-file","ticktick","wekan","csv","planka"],"task_attachmen …
- GET /api/v2/user → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/UserInfoBody.json","id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z","settings":{"name":"Amber Demo","email_reminders_enabled":false,"discoverable_by_name":false,"discoverable_by_email":fal …
- GET /api/v2/avatar/amber?size=40 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>
- GET /api/v2/labels?page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedLabelWithTaskID.json","items":[{"id":1,"title":"urgent","description":"","hex_color":"e8445a","created_by":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"created":"2026-11-23 …
- GET /api/v2/projects?is_archived=true&expand=permissions&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedProject.json","items":[{"id":1,"title":"Inbox","description":"","identifier":"","hex_color":"","parent_project_id":0,"owner":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"is …
- GET /api/v2/tasks/6?expand=reactions&expand=is_unread&expand=buckets → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/TaskReadOneBody.json","id":6,"title":"Get three quotes","description":"","project_id":3,"done":false,"done_at":"0001-01-01T00:00:00Z","due_date":"0001-01-01T00:00:00Z","reminders":null,"repeat_after":0,"repeat_mode":0,"priority":0,"start_date":"0001-0 …
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
- GET /api/v2/tasks/6/comments?order_by=asc&page=1 → 200 (after a change) response: {"$schema":"http://127.0.0.1:4790/api/v2/schemas/PaginatedTaskComment.json","items":[{"id":1,"comment":"Two quotes in so far, waiting on the third.","author":{"id":1,"name":"Amber Demo","username":"amber","created":"2026-11-23T14:18:43Z","updated":"2026-11-23T14:18:43Z"},"reactions":null,"created":" …
- GET /api/v2/avatar/amber?size=20 → 200 (after a change) response: <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <rect width="100" height="100" fill="#e3f5f8"/>
  <text x="50" y="50" font-family="sans-serif" font-size="50" fill="#00548c" text-anchor="middle" dominant-baseline="central">A</text>
</svg>

## Rules

- Fix **one** interaction, in `capsule-src/amber/handlers.js` and the store (`capsule-src/amber/store.js`, `src/capsule/model.mjs`). One commit, naming this flow and this run.
- Never edit `flows/`, `journeys.json` or anything a Kane run wrote. Never detect Kane, its tag or its test account to special-case it.
- Answer the request the way Vikunja would, from the store, for any data, not just the values in this journey.
- Then: `node bin/amber.mjs build`, and re-run this flow with `node bin/amber.mjs verify --only j15-comment`.
