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

# Session: page-replay

## Step 1
Go to http://127.0.0.1:4790/amber/?t=start&speed=10. Verify the line above the block reads 0 of 15 interactions proven with the server off. Click the Replay the run button and wait until that line reads 15 of 15 interactions proven with the server off, then verify it does.
