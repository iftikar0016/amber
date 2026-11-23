// @ts-check
// Stage 3: Kane runs the frozen flows against the capsule, with the real server off.
import fs from 'node:fs';
import path from 'node:path';
import { CAPSULE_DIR, FLOWS_DIR, KANE_CWD, ROOT, RUNS_DIR } from '../config.mjs';
import { serverOffProof } from '../vikunja.mjs';
import { createCapsuleServer } from '../capsule/serve.mjs';
import { openBatch } from '../run/budget.mjs';
import { runFlow, timelineWriter } from '../run/kane-flow.mjs';
import { loadJourneys, objectiveFor, EST_CREDITS_PER_AUTHORED_RUN } from '../capture/capture.mjs';
import { recordVerdict, readState, gitHead } from './state.mjs';
import { writeBrief } from './brief.mjs';

/** Estimated credits for a saved-flow replay; corrected once the spike measures it. */
export const EST_CREDITS_PER_REPLAY = 5;

export function lockedFlows() {
  const lock = path.join(FLOWS_DIR, 'flows.lock.json');
  if (!fs.existsSync(lock)) throw new Error('No frozen flows yet (flows/flows.lock.json). Capture and freeze first.');
  return JSON.parse(fs.readFileSync(lock, 'utf8')).flows;
}

/**
 * @param {{only?: string[], mode?: 'replay'|'author', runId?: string, label?: string, log?: (s:string)=>void}} o
 */
export async function verify(o = {}) {
  const log = o.log ?? (() => {});
  const mode = o.mode ?? 'replay';
  const off = await serverOffProof();
  if (!off.off) throw new Error(`The real server is not off (port ${off.port} open: ${off.portOpen}; Vikunja processes: ${off.vikunjaProcesses.length}). Run: node bin/amber.mjs vikunja stop`);
  if (!fs.existsSync(path.join(CAPSULE_DIR, 'index.html'))) throw new Error('No capsule built. Run: node bin/amber.mjs build');

  const flows = Object.keys(lockedFlows()).filter((id) => !o.only?.length || o.only.includes(id));
  const runId = o.runId ?? `verify-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  const runDir = path.join(RUNS_DIR, runId);
  const est = flows.length * (mode === 'author' ? EST_CREDITS_PER_AUTHORED_RUN : EST_CREDITS_PER_REPLAY) * 1.5;
  const batch = openBatch(`verify ${mode} ${flows.join(',')}`, est);
  const emit = timelineWriter(runId);
  const srv = createCapsuleServer({ logDir: path.join(runDir, 'capsule-log') });
  await srv.listen();
  const spec = loadJourneys();
  const before = readState();
  emit({ type: 'run_start', runId, kind: 'verify', mode, target: 'capsule-server-off', commit: gitHead(), label: o.label ?? null, flows, serverOff: off });
  const results = [];
  try {
    for (const id of flows) {
      srv.setFlow(id);
      let r;
      for (let attempt = 1; attempt <= 2; attempt++) {
        log(`${id}: ${mode} against the capsule (attempt ${attempt})`);
        const journey = spec.journeys.find((j) => j.id === id);
        r = await runFlow({
          runId,
          flow: id,
          attempt,
          mode,
          ...(mode === 'replay' ? { file: path.join(FLOWS_DIR, `${id}_test.md`) } : { objective: objectiveFor(spec, journey) }),
          cwd: KANE_CWD,
          serverOff: serverOffProof,
          leaks: () => srv.flowCounts(id).leaks,
          emit,
        });
        log(`${id}: ${r.record.verdict} ${r.record.reasons.join('; ')} (${r.record.credits ?? '?'} credits, ${Math.round(r.record.ms / 1000)} s)`);
        if (r.record.verdict !== 'INCONCLUSIVE') break;
      }
      const wasPassing = before.flows[id]?.verdict === 'PASS';
      const f = recordVerdict(id, { runId, mode, verdict: r.record.verdict, reasons: r.record.reasons, record: path.relative(ROOT, r.outDir).split(path.sep).join('/') });
      const regression = wasPassing && r.record.verdict === 'FAIL';
      let brief = null;
      if (r.record.verdict !== 'PASS') brief = writeBrief({ flow: id, runId, outDir: r.outDir, record: r.record, regression });
      results.push({ id, verdict: r.record.verdict, regression, needsHuman: f.needsHuman ?? false, reasons: r.record.reasons, unanswered: srv.flowCounts(id).unanswered, leaks: srv.flowCounts(id).leaks, brief });
    }
  } finally {
    await srv.close();
    const spend = batch.close({ runId });
    const tally = results.reduce((a, r) => ((a[r.verdict] = (a[r.verdict] ?? 0) + 1), a), /** @type {Record<string,number>} */ ({}));
    emit({ type: 'run_done', runId, spent: spend.spent, tally, regressions: results.filter((r) => r.regression).map((r) => r.id) });
    fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify({ runId, kind: 'verify', mode, commit: gitHead(), label: o.label ?? null, serverOff: off, spend, results }, null, 2));
  }
  return { runId, results };
}
