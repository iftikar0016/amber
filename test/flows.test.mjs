import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSavedFlow, stepsOf } from '../src/flows/materialize.mjs';
import { verdict } from '../src/run/verdict.mjs';

const saved = `---
mode: testing
variables:
  global.amber_user:
    value: amber
    secret: false
    syntax: '{{amber_user}}'
    type: global
  secrets.user.amber_password:
    value: hunter2-not-real
    secret: true
    syntax: '{{amber_password}}'
    type: secret
  global.amber_tag:
    value: abcdef
    secret: false
    syntax: '{{amber_tag}}'
    type: global
---

# Session: j09-add-task

## Step 1
Add a task titled Paint samples {{amber_tag}}.
`;

test('a saved flow enters the repo with every variable value blanked and its steps unchanged', () => {
  const s = sanitizeSavedFlow(saved);
  assert.ok(!s.includes('hunter2-not-real'));
  assert.ok(!s.includes('abcdef'));
  assert.ok(s.includes("syntax: '{{amber_password}}'"));
  assert.equal(stepsOf(s), stepsOf(saved));
});

test('verdict tiers', () => {
  const passed = { type: 'test_md_done', overall_status: 'passed' };
  const failed = { type: 'test_md_done', overall_status: 'failed' };
  assert.equal(verdict({ exitCode: 0, terminal: passed, mode: 'replay' }).verdict, 'PASS');
  assert.equal(verdict({ exitCode: 1, terminal: failed, mode: 'replay', summaryText: 'x' }).verdict, 'FAIL');
  assert.equal(verdict({ exitCode: 2, terminal: null, mode: 'replay' }).verdict, 'INCONCLUSIVE');
  assert.equal(verdict({ exitCode: 3, terminal: null, mode: 'replay' }).verdict, 'INCONCLUSIVE');
  // The real server answering during a capsule run makes any result meaningless.
  assert.equal(verdict({ exitCode: 0, terminal: passed, mode: 'replay', serverOff: { off: false } }).verdict, 'INCONCLUSIVE');
  // Kane said passed, but an API call reached the static server: disputed, so FAIL.
  const leak = verdict({ exitCode: 0, terminal: passed, mode: 'replay', serverOff: { off: true }, leaks: 1 });
  assert.equal(leak.verdict, 'FAIL');
  assert.match(leak.reasons[0], /disputed/);
});
