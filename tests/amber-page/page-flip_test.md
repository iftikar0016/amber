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

# Session: page-flip

## Step 1
Go to http://127.0.0.1:4790/amber/. Click the Open the live app button. Verify the block now shows the Vikunja app signed in as Amber Demo, with the projects Website relaunch and Kitchen renovation in its menu.
