// @ts-check
// Kane's tests of AMBER's own page. `author` has Kane write each test from plain English (kane-cli run --name) and saves
// it in tests/amber-page/ (account IDs blanked, as for the frozen flows); `replay` replays the saved tests.
import fs from 'node:fs';
import path from 'node:path';
import { KANE_CWD, ROOT, RUNS_DIR } from '../config.mjs';
import { createCapsuleServer } from '../capsule/serve.mjs';
import { openBatch } from '../run/budget.mjs';
import { runFlow, timelineWriter } from '../run/kane-flow.mjs';
import { sanitizeRecording, sanitizeSavedFlow } from '../flows/materialize.mjs';
import { acquire } from '../verify/lock.mjs';

const DIR = path.join(ROOT, 'tests', 'amber-page');
const ACCOUNT = path.join(ROOT, '.amber', 'kane-account.json');

function spec() {
  return JSON.parse(fs.readFileSync(path.join(DIR, 'suite.json'), 'utf8')).tests;
}

/** A replayable copy of a saved page test in .amber/, with the account IDs restored. */
function runCopy(id) {
  const dir = path.join(KANE_CWD, 'page-runs', id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(DIR, `${id}_test.md`), path.join(dir, `${id}_test.md`));
  const out = path.join(DIR, `output-${id}`);
  if (fs.existsSync(out)) {
    fs.cpSync(out, path.join(dir, `output-${id}`), { recursive: true });
    const account = JSON.parse(fs.readFileSync(ACCOUNT, 'utf8'));
    for (const n of ['meta.json', 'execution.json']) {
      const p = path.join(dir, `output-${id}`, '.internal', n);
      if (!fs.existsSync(p)) continue;
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      for (const k of ['org_id', 'user_id']) if (k in j) j[k] = account[k] ?? '';
      fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
    }
  }
  return path.join(dir, `${id}_test.md`);
}

/**
 * @param {{mode: 'author'|'replay', only?: string[], log?: (s:string)=>void}} o
 */
export async function pageSuite(o) {
  const log = o.log ?? (() => {});
  const tests = spec().filter((t) => !o.only?.length || o.only.includes(t.id));
  const release = acquire(`page suite (${o.mode})`);
  const runId = `page-${o.mode}-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  const batch = openBatch(`page suite ${o.mode} ${tests.map((t) => t.id).join(',')}`, tests.length * (o.mode === 'author' ? 40 : 10));
  const emit = timelineWriter(runId);
  const srv = createCapsuleServer({ logDir: path.join(RUNS_DIR, runId, 'capsule-log') });
  const results = [];
  try {
    await srv.listen();
    emit({ type: 'run_start', runId, kind: 'page-suite', mode: o.mode, tests: tests.map((t) => t.id) });
    for (const t of tests) {
      let r;
      for (let attempt = 1; attempt <= 2; attempt++) {
        log(`${t.id}: ${o.mode} (attempt ${attempt})`);
        r = await runFlow(
          o.mode === 'author'
            ? { runId, flow: t.id, attempt, mode: 'author', objective: t.objective, name: t.id, emit }
            : { runId, flow: t.id, attempt, mode: 'replay', file: runCopy(t.id), emit },
        );
        log(`${t.id}: ${r.record.verdict} ${r.record.reasons.join('; ')}`);
        if (r.record.verdict !== 'INCONCLUSIVE') break;
      }
      if (o.mode === 'author' && r.record.verdict === 'PASS') {
        const saved = path.join(KANE_CWD, '.testmuai', 'tests', `${t.id}_test.md`);
        const out = path.join(KANE_CWD, '.testmuai', 'tests', `output-${t.id}`);
        if (fs.existsSync(saved)) fs.writeFileSync(path.join(DIR, `${t.id}_test.md`), sanitizeSavedFlow(fs.readFileSync(saved, 'utf8')));
        if (fs.existsSync(out)) {
          fs.rmSync(path.join(DIR, `output-${t.id}`), { recursive: true, force: true });
          fs.cpSync(out, path.join(DIR, `output-${t.id}`), { recursive: true });
          sanitizeRecording(path.join(DIR, `output-${t.id}`));
        }
      }
      results.push({ id: t.id, verdict: r.record.verdict, reasons: r.record.reasons, record: path.relative(ROOT, r.outDir).split(path.sep).join('/') });
    }
  } finally {
    await srv.close();
    const spend = batch.close({ runId });
    emit({ type: 'run_done', runId, spent: spend.spent });
    fs.writeFileSync(path.join(RUNS_DIR, runId, 'summary.json'), JSON.stringify({ runId, kind: 'page-suite', mode: o.mode, spend, results }, null, 2));
    release();
  }
  return { runId, results };
}
