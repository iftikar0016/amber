// @ts-check
// Stage 1: Kane walks each journey against the REAL Vikunja, through the recording proxy.
// A journey that fails here is a wrong journey (or a Kane misread), and is fixed before anything else.
import fs from 'node:fs';
import path from 'node:path';
import { CAPTURE_DIR, FLOWS_DIR, KANE_CWD, ROOT, RUNS_DIR } from '../config.mjs';
import * as vikunja from '../vikunja.mjs';
import { alignDueDates, readCredentials } from '../seed.mjs';
import { createRecorder } from './proxy.mjs';
import { openBatch } from '../run/budget.mjs';
import { runFlow, timelineWriter } from '../run/kane-flow.mjs';
import { sanitizeSavedFlow, sanitizeRecording } from '../flows/materialize.mjs';
import { completeFrontend } from './frontend.mjs';

export const EST_CREDITS_PER_AUTHORED_RUN = 35;

export function loadJourneys() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'journeys.json'), 'utf8'));
}

export function objectiveFor(spec, journey) {
  return `${spec.signIn} ${journey.steps}`;
}

/** Where kane-cli run --name <id> leaves the saved test and its recording. */
function savedTestPaths(id) {
  const testsDir = path.join(KANE_CWD, '.testmuai', 'tests');
  const file = path.join(testsDir, `${id}_test.md`);
  const outputs = [path.join(testsDir, `output-${id}`), path.join(KANE_CWD, `output-${id}`)];
  return { file, output: outputs.find((p) => fs.existsSync(p)) ?? null, candidates: outputs };
}

/**
 * @param {{only?: string[], runId?: string, log?: (s:string)=>void}} o
 */
export async function capture(o = {}) {
  const log = o.log ?? (() => {});
  const spec = loadJourneys();
  const todo = spec.journeys.filter((j) => !o.only?.length || o.only.includes(j.id));
  const runId = o.runId ?? `capture-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  const batch = openBatch(`capture ${todo.map((j) => j.id).join(',')}`, todo.length * EST_CREDITS_PER_AUTHORED_RUN);
  const emit = timelineWriter(runId);
  const rec = createRecorder({ secrets: [readCredentials().password] });
  await rec.listen();
  emit({ type: 'run_start', runId, kind: 'capture', target: 'real-server', flows: todo.map((j) => j.id) });
  const results = [];
  try {
    for (const j of todo) {
      await vikunja.resetToPristine();
      await alignDueDates();
      fs.rmSync(path.join(CAPTURE_DIR, 'journeys', `${j.id}.ndjson`), { force: true });
      const saved = savedTestPaths(j.id);
      fs.rmSync(saved.file, { force: true });
      for (const c of saved.candidates) fs.rmSync(c, { recursive: true, force: true });
      rec.setJourney(j.id);

      let r;
      for (let attempt = 1; attempt <= 2; attempt++) {
        log(`${j.id}: authoring against the real server (attempt ${attempt})`);
        r = await runFlow({ runId, flow: j.id, attempt, mode: 'author', objective: objectiveFor(spec, j), name: j.id, emit });
        log(`${j.id}: ${r.record.verdict} ${r.record.reasons.join('; ')} (${r.record.credits} credits, ${Math.round(r.record.ms / 1000)} s)`);
        if (r.record.verdict !== 'INCONCLUSIVE') break;
      }
      const after = savedTestPaths(j.id);
      let frozenCandidate = null;
      if (r.record.verdict === 'PASS' && fs.existsSync(after.file)) {
        fs.mkdirSync(FLOWS_DIR, { recursive: true });
        // Kane writes variable values (the test password among them) into the frontmatter: blank them before the flow enters the repo.
        fs.writeFileSync(path.join(FLOWS_DIR, `${j.id}_test.md`), sanitizeSavedFlow(fs.readFileSync(after.file, 'utf8')));
        if (after.output) {
          fs.cpSync(after.output, path.join(FLOWS_DIR, `output-${j.id}`), { recursive: true });
          sanitizeRecording(path.join(FLOWS_DIR, `output-${j.id}`));
        }
        frozenCandidate = `flows/${j.id}_test.md`;
      }
      results.push({ id: j.id, verdict: r.record.verdict, reasons: r.record.reasons, credits: r.record.credits, savedTest: fs.existsSync(after.file), frozenCandidate, record: path.relative(ROOT, r.outDir).split(path.sep).join('/') });
    }
    rec.setJourney('frontend-completion');
    const fe = await completeFrontend(log);
    emit({ type: 'frontend_completed', ...fe });
  } finally {
    await rec.close();
    const spend = batch.close({ runId });
    emit({ type: 'run_done', runId, spent: spend.spent, tally: tally(results) });
    fs.writeFileSync(path.join(RUNS_DIR, runId, 'summary.json'), JSON.stringify({ runId, kind: 'capture', spend, results }, null, 2));
  }
  return { runId, results, tally: tally(results) };
}

const tally = (rs) => rs.reduce((a, r) => ((a[r.verdict] = (a[r.verdict] ?? 0) + 1), a), /** @type {Record<string,number>} */ ({}));
