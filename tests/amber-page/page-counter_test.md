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

# Session: page-counter

## Step 1
Go to http://127.0.0.1:4790/amber/. Verify the line above the amber block reads 21 of 21 interactions proven with the server off, and verify the caption below the block mentions Kane CLI.
