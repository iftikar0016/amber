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

# Session: j14-new-project

## Step 1
Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. Create a new project named Garden {{amber_tag}}. Open the Projects page from the main menu and verify Garden {{amber_tag}} is listed. Reload the page, then verify the Projects page still lists Garden {{amber_tag}} as well as Kitchen renovation.
