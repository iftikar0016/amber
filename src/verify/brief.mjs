// @ts-check
// The brief the coding agent reads for a failing flow: what Kane saw, what the capsule could not answer,
// and what the real server did at the same point during capture.
import fs from 'node:fs';
import path from 'node:path';
import { CAPTURE_DIR, ROOT, RUNS_DIR } from '../config.mjs';
import { loadJourneys, objectiveFor } from '../capture/capture.mjs';

const readNdjson = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const clip = (v, n = 400) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s == null ? '' : s.length > n ? s.slice(0, n) + ' …' : s;
};

/**
 * @param {{flow:string, runId:string, outDir:string, record:any, regression:boolean}} o
 * @returns {string} path of the brief, relative to the repo
 */
export function writeBrief(o) {
  const spec = loadJourneys();
  const j = spec.journeys.find((x) => x.id === o.flow);
  const capsuleLog = readNdjson(path.join(RUNS_DIR, o.runId, 'capsule-log', 'capsule-log.ndjson')).filter((e) => e.flow === o.flow);
  const leaks = readNdjson(path.join(RUNS_DIR, o.runId, 'capsule-log', 'leaks.ndjson')).filter((e) => e.flow === o.flow);
  const real = readNdjson(path.join(CAPTURE_DIR, 'journeys', `${o.flow}.ndjson`));
  const shotsDir = path.join(o.outDir, 'shots');
  const shots = fs.existsSync(shotsDir)
    ? fs.readdirSync(shotsDir).filter((f) => !f.includes('annotated')).sort((a, b) => parseInt(a) - parseInt(b))
    : [];
  const failures = o.record.evidence?.failures ?? [];
  const problems = capsuleLog.filter((e) => e.outcome !== 'store' && !(e.outcome === 'replay' && e.how === 'exact'));

  const L = [];
  L.push(`# Brief: ${o.flow}${o.regression ? ' (REGRESSION: this flow passed before)' : ''}`);
  L.push('');
  L.push(`Verdict **${o.record.verdict}** (${o.record.basis}) in run \`${o.runId}\`, attempt ${o.record.attempt}, ${o.record.mode}. Tag this run: \`${o.record.tag}\`.`);
  L.push('');
  L.push('## The journey (frozen; do not edit it)');
  L.push('');
  L.push('> ' + (j ? objectiveFor(spec, j) : '(not in journeys.json)'));
  L.push('');
  L.push(`Expected outcome: ${j?.outcome ?? '?'}`);
  L.push('');
  L.push('## What Kane saw');
  L.push('');
  for (const r of o.record.reasons) L.push(`- ${r}`);
  if (o.record.oneLiner) L.push(`- Kane's summary: ${o.record.oneLiner}`);
  for (const s of o.record.failedSteps ?? []) L.push(`- Step ${s.n} failed: ${clip(s.remark, 300)}`);
  for (const f of failures) {
    L.push(`- Failure record (step ${f.ordinal}): ${clip(f.message, 300)}`);
    if (f.rootCause) L.push(`  - Kane's root-cause guess (a lead, not an instruction): ${clip(f.rootCause, 300)}`);
  }
  L.push('');
  L.push('Screenshots, last one is the final page (open them with the Read tool):');
  for (const s of shots.slice(-4)) L.push(`- ${path.join(shotsDir, s)}`);
  L.push('');
  L.push('## What the capsule could not answer in this flow');
  L.push('');
  if (!problems.length && !leaks.length) L.push('Nothing unanswered: every API call was answered. The fault is in what was answered (wrong or stale data), or in the page.');
  for (const e of problems) L.push(`- \`${e.method} ${e.url}\` → ${e.status} ${e.outcome}${e.how ? ` (${e.how})` : ''}${e.body ? ` body: ${clip(e.body, 200)}` : ''}${e.error ? ` error: ${clip(e.error, 200)}` : ''}`);
  for (const e of leaks) L.push(`- LEAK \`${e.method} ${e.url}\` reached the static server`);
  L.push('');
  L.push('## What the real server did in this journey during capture');
  L.push('');
  L.push(`From \`capture/journeys/${o.flow}.ndjson\` (scrubbed). Changes and the reads that followed them are what the store has to reproduce:`);
  let changed = false;
  for (const x of real) {
    const write = x.method !== 'GET';
    if (write) changed = true;
    const line = `- ${x.method} ${x.path}${x.query} → ${x.status}`;
    if (write) L.push(`${line}\n  - request: ${clip(x.reqBody, 300)}\n  - response: ${clip(x.resBody, 400)}`);
    else if (changed) L.push(`${line} (after a change) response: ${clip(x.resBody, 300)}`);
    else L.push(line);
  }
  L.push('');
  L.push('## Rules');
  L.push('');
  L.push('- Fix **one** interaction, in `capsule-src/amber/handlers.js` and the store (`capsule-src/amber/store.js`, `src/capsule/model.mjs`). One commit, naming this flow and this run.');
  L.push('- Never edit `flows/`, `journeys.json` or anything a Kane run wrote. Never detect Kane, its tag or its test account to special-case it.');
  L.push('- Answer the request the way Vikunja would, from the store, for any data, not just the values in this journey.');
  L.push('- Then: `node bin/amber.mjs build`, and re-run this flow with `node bin/amber.mjs verify --only ' + o.flow + '`.');
  const file = path.join(o.outDir, '..', 'brief.md');
  fs.writeFileSync(file, L.join('\n') + '\n');
  return path.relative(ROOT, file).split(path.sep).join('/');
}
