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

# Session: page-evidence

## Step 1
Go to http://127.0.0.1:4790/amber/. Click the tile labelled J15 · Comment on a task inside the amber block. Verify a side panel opens with the heading Comment on a task, and verify its history lists both a FAIL and a PASS for the capsule.
