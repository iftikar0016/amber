---
mode: testing
max_steps: 30
timeout: 300
target: chrome
headless: true
variables:
  global.amber_user:
    value: ""
    secret: false
    syntax: '{{amber_user}}'
    type: global
  secrets.user.amber_password:
    value: ""
    secret: true
    syntax: '{{amber_password}}'
    type: secret
  global.amber_tag:
    value: ""
    secret: false
    syntax: '{{amber_tag}}'
    type: global
---

# Session: j11-rename

## Step 1
Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. Open the project Website relaunch and open the task Write homepage copy. Change its title to Homepage copy {{amber_tag}}. Go back to the Website relaunch list and verify Homepage copy {{amber_tag}} is listed. Reload the page, then verify Homepage copy {{amber_tag}} is still listed.
