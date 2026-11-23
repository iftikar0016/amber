// @ts-check
// Per-flow history across verify runs (runs/state.json, committed): what passed, when, at which commit.
// A flow that has passed before and fails now is a regression; the Stop hook refuses to let the agent stop on one.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RUNS_DIR } from '../config.mjs';

const FILE = path.join(RUNS_DIR, 'state.json');

export function gitHead() {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** @returns {{flows: Record<string, {verdict:string, everPassed:boolean, needsHuman?:boolean, failStreak:number, history:any[]}>}} */
export function readState() {
  return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { flows: {} };
}

export function writeState(s) {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2) + '\n');
}

/** Flows that have passed at some point and whose latest verdict is FAIL. */
export function regressions(s = readState()) {
  return Object.entries(s.flows)
    .filter(([, f]) => f.everPassed && f.verdict === 'FAIL')
    .map(([id]) => id);
}

/** Record one verdict (INCONCLUSIVE never changes the flow's verdict, it is only kept in the history). */
export function recordVerdict(flow, entry, maxAttempts = 3) {
  const s = readState();
  const f = (s.flows[flow] ??= { verdict: 'UNKNOWN', everPassed: false, failStreak: 0, history: [] });
  f.history.push({ ...entry, commit: gitHead(), at: new Date().toISOString() });
  if (entry.verdict === 'PASS') {
    f.verdict = 'PASS';
    f.everPassed = true;
    f.failStreak = 0;
    f.needsHuman = false;
  } else if (entry.verdict === 'FAIL') {
    f.verdict = 'FAIL';
    f.failStreak += 1;
    f.needsHuman = f.failStreak >= maxAttempts;
  }
  writeState(s);
  return f;
}
