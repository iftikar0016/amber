// Replay frozen flows with a fresh {{amber_tag}}, against the real server (through the recorder, to see what Kane
// typed; the database is restored before each flow) or against the capsule with the server off. Used for the spike
// and to check that frozen flows replay at all on the real server. The loop itself uses `amber verify`.
//   node scripts/spike-replay.mjs real <flow>
//   node scripts/spike-replay.mjs capsule <flow> [<flow> ...]
import fs from 'node:fs';
import path from 'node:path';
import { CAPTURE_DIR, RUNS_DIR } from '../src/config.mjs';
import * as vikunja from '../src/vikunja.mjs';
import { alignDueDates, readCredentials } from '../src/seed.mjs';
import { createRecorder } from '../src/capture/proxy.mjs';
import { createCapsuleServer } from '../src/capsule/serve.mjs';
import { openBatch } from '../src/run/budget.mjs';
import { runFlow, timelineWriter } from '../src/run/kane-flow.mjs';

const [target, ...flows] = process.argv.slice(2);
const runId = `spike-replay-${target}-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
const emit = timelineWriter(runId);
const batch = openBatch(`spike: replay ${flows.join(',')} against the ${target}`, 15 * flows.length);
const out = [];
try {
  if (target === 'real') {
    const rec = createRecorder({ secrets: [readCredentials().password] });
    await rec.listen();
    for (const id of flows) {
      await vikunja.resetToPristine();
      await alignDueDates();
      const label = `spike-replay-${id}`;
      fs.rmSync(path.join(CAPTURE_DIR, 'journeys', `${label}.ndjson`), { force: true });
      rec.setJourney(label);
      const r = await runFlow({ runId, flow: id, attempt: 1, mode: 'replay', emit });
      const wire = path.join(CAPTURE_DIR, 'journeys', `${label}.ndjson`);
      const writes = fs.existsSync(wire)
        ? fs.readFileSync(wire, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.method !== 'GET').map((e) => ({ m: e.method, p: e.path, s: e.status, body: JSON.stringify(e.reqBody).slice(0, 120) }))
        : [];
      // The wire record of the replay belongs with the spike run, not with the capture the capsule is built from.
      if (fs.existsSync(wire)) fs.renameSync(wire, path.join(RUNS_DIR, runId, id, 'wire.ndjson'));
      out.push({ id, tag: r.record.tag, verdict: r.record.verdict, status: r.record.status, credits: r.record.credits, ms: r.record.ms, reasons: r.record.reasons, writes, summary: r.record.testmdSummary });
    }
    await rec.close();
  } else {
    const off = await vikunja.serverOffProof();
    if (!off.off) throw new Error('server is not off');
    const srv = createCapsuleServer({ logDir: path.join(RUNS_DIR, runId, 'capsule-log') });
    await srv.listen();
    for (const id of flows) {
      srv.setFlow(id);
      const r = await runFlow({ runId, flow: id, attempt: 1, mode: 'replay', serverOff: vikunja.serverOffProof, leaks: () => srv.flowCounts(id).leaks, emit });
      out.push({ id, tag: r.record.tag, verdict: r.record.verdict, status: r.record.status, credits: r.record.credits, ms: r.record.ms, reasons: r.record.reasons, counts: srv.flowCounts(id), summary: r.record.testmdSummary });
    }
    await srv.close();
  }
} finally {
  const spend = batch.close({ runId });
  fs.writeFileSync(path.join(RUNS_DIR, runId, 'summary.json'), JSON.stringify({ runId, kind: 'spike', target, spend, results: out }, null, 2));
  console.log(JSON.stringify({ runId, spend: spend.spent, results: out }, null, 2));
}
