// @ts-check
// Re-judge a finished verify run with the current verdict rules, from what the run recorded (Kane's exit code and
// status, the capsule's own log). Nothing Kane said is changed: kaneStatus keeps Kane's verdict, and the timeline gets
// an extra entry marked adjudicated, so the page and the README show both.
import fs from 'node:fs';
import path from 'node:path';
import { RUNS_DIR } from '../config.mjs';
import { verdict } from '../run/verdict.mjs';
import { readState, writeState } from './state.mjs';
import { writeBrief } from './brief.mjs';

const readNdjson = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

export function readjudicate(runId, why) {
  const dir = path.join(RUNS_DIR, runId);
  const log = readNdjson(path.join(dir, 'capsule-log', 'capsule-log.ndjson'));
  const summaryFile = path.join(dir, 'summary.json');
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  const changed = [];
  for (const res of summary.results) {
    const attempts = fs.readdirSync(path.join(dir, res.id)).filter((d) => /^a\d+$/.test(d)).sort();
    const last = attempts.at(-1);
    const recFile = path.join(dir, res.id, last, 'result.json');
    const rec = JSON.parse(fs.readFileSync(recFile, 'utf8'));
    const events = readNdjson(path.join(dir, res.id, last, 'kane-events.ndjson'));
    const terminal = events.find((e) => e.type === 'test_md_done' || e.type === 'run_end');
    const unansweredWrites = log.filter((e) => e.flow === res.id && e.outcome === 'unanswered-write').length;
    const v = verdict({ exitCode: rec.exitCode, killed: rec.killed, terminal, serverOff: rec.serverOff, leaks: rec.leaks, unansweredWrites, mode: rec.mode, summaryText: rec.oneLiner });
    if (v.verdict === rec.verdict) continue;
    const before = rec.verdict;
    Object.assign(rec, { kaneStatus: rec.kaneStatus ?? rec.status, unansweredWrites, ...v, adjudicated: { from: before, to: v.verdict, at: new Date().toISOString(), why } });
    fs.writeFileSync(recFile, JSON.stringify(rec, null, 2));
    fs.appendFileSync(path.join(dir, 'timeline.ndjson'), JSON.stringify({ t: Date.now(), type: 'flow_done', flow: res.id, attempt: rec.attempt, mode: rec.mode, verdict: v.verdict, basis: v.basis, reasons: v.reasons, adjudicated: true, kaneStatus: rec.kaneStatus }) + '\n');
    Object.assign(res, { verdict: v.verdict, reasons: v.reasons, adjudicated: true, kaneStatus: rec.kaneStatus });
    res.brief = writeBrief({ flow: res.id, runId, outDir: path.join(dir, res.id, last), record: rec, regression: false });
    // Correct this run's entry in the per-flow state, then recompute the flow's flags from its history.
    const s = readState();
    const f = s.flows[res.id];
    for (const h of f.history) if (h.runId === runId) Object.assign(h, { verdict: v.verdict, reasons: v.reasons, adjudicated: true });
    const judged = f.history.filter((h) => h.verdict !== 'INCONCLUSIVE');
    f.everPassed = judged.some((h) => h.verdict === 'PASS');
    f.verdict = judged.at(-1)?.verdict ?? 'UNKNOWN';
    let streak = 0;
    for (const h of [...judged].reverse()) {
      if (h.verdict !== 'FAIL') break;
      streak++;
    }
    f.failStreak = streak;
    writeState(s);
    changed.push({ flow: res.id, from: before, to: v.verdict, reasons: v.reasons });
  }
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  return changed;
}
