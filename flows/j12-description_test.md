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

# Session: j12-description

## Step 1
Go to http://127.0.0.1:4790/login. Sign in with username {{amber_user}} and password {{amber_password}} with Stay logged in ticked, then verify the home page greets Amber Demo. Open the project Kitchen renovation and open the task Choose worktop. Set its description to Oak or quartz {{amber_tag}} and save it. Reload the page, then verify the description Oak or quartz {{amber_tag}} is shown.
