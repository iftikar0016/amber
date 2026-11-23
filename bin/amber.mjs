#!/usr/bin/env node
// @ts-check
// AMBER command line. Each command prints one JSON line on success, so a coding agent can read it.
import * as vikunja from '../src/vikunja.mjs';
import { seed, alignDueDates, readCredentials } from '../src/seed.mjs';
import { createRecorder } from '../src/capture/proxy.mjs';
import { capture } from '../src/capture/capture.mjs';
import { cap, spentSoFar } from '../src/run/budget.mjs';
import { readBalance } from '../src/kane/spawn.mjs';
import { build } from '../src/capsule/build.mjs';
import { createCapsuleServer } from '../src/capsule/serve.mjs';
import { verify } from '../src/verify/verify.mjs';
import { readState, regressions } from '../src/verify/state.mjs';
import { freeze, check as frozenCheck } from '../src/flows/freeze.mjs';
import { gate } from '../src/verify/gate.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/config.mjs';

/** Values after a flag, e.g. --only a,b */
const flag = (name) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};

/** Literal secrets that must never reach a committed file. */
function secretsToScrub() {
  try {
    return [readCredentials().password];
  } catch {
    return [];
  }
}

const [cmd, ...rest] = process.argv.slice(2);
const out = (o) => console.log(JSON.stringify(o));

const commands = {
  /** Fresh database, seeded account, pristine snapshot. Wipes the local Vikunja data. */
  async setup() {
    vikunja.ensureBinary();
    await vikunja.wipe();
    await vikunja.start();
    const seeded = await seed();
    const pristine = await vikunja.snapshotPristine();
    out({ ok: true, seeded, pristine });
  },
  /** Run the recording proxy on its own (journey label from --journey), until Ctrl+C. */
  async record() {
    const i = rest.indexOf('--journey');
    const rec = createRecorder({ secrets: secretsToScrub(), log: (o) => console.error(JSON.stringify(o)) });
    rec.setJourney(i >= 0 ? rest[i + 1] : 'manual');
    out({ ok: true, recording: await rec.listen() });
  },
  /** Stage 1: Kane walks the journeys against the real server through the recording proxy. Spends credits. */
  async capture() {
    const only = flag('--only')?.split(',').filter(Boolean);
    const r = await capture({ only, log: (l) => console.error(l) });
    out({ ok: true, ...r });
  },
  /** Credit cap, AMBER's spend so far, and the live balance. */
  async budget() {
    out({ ok: true, cap: cap(), spent: Math.round(spentSoFar() * 100) / 100, balance: readBalance() });
  },
  /** Stage 2: build the capsule (static files) from the capture. */
  async build() {
    const captureDir = flag('--capture');
    const outDir = flag('--out');
    out({ ok: true, ...build({ captureDir: captureDir && path.resolve(ROOT, captureDir), outDir: outDir && path.resolve(ROOT, outDir), secrets: secretsToScrub() }) });
  },
  /** Serve the capsule as static files on the app's origin (no API), until Ctrl+C. Leaks and the capsule log go to --log. */
  async serve() {
    const dir = flag('--dir');
    const logDir = flag('--log');
    const srv = createCapsuleServer({ dir: dir && path.resolve(ROOT, dir), logDir: logDir && path.resolve(ROOT, logDir) });
    out({ ok: true, serving: await srv.listen(), serverOff: await vikunja.serverOffProof() });
  },
  /** Stage 3: Kane runs the frozen flows against the capsule with the server off (--mode replay|author). Spends credits. */
  async verify() {
    const only = flag('--only')?.split(',').filter(Boolean);
    const mode = /** @type {'replay'|'author'} */ (flag('--mode') ?? 'replay');
    const r = await verify({ only, mode, label: flag('--label'), log: (l) => console.error(l) });
    out({ ok: true, ...r });
    if (r.results.some((x) => x.verdict !== 'PASS')) process.exitCode = 1;
  },
  /** Every flow's latest verdict, and any regressions. */
  async status() {
    const s = readState();
    const flows = Object.fromEntries(Object.entries(s.flows).map(([id, f]) => [id, { verdict: f.verdict, everPassed: f.everPassed, needsHuman: f.needsHuman ?? false, runs: f.history.length }]));
    out({ ok: true, flows, regressions: regressions(s) });
  },
  /**
   * Freeze the flows that passed against the real server (--only ids, default: every flow in flows/), or with --check
   * report frozen files that changed (exit 1). Freezing is one-way: a frozen flow is never re-locked.
   */
  async freeze() {
    if (rest.includes('--check')) {
      const c = frozenCheck();
      out({ ok: c.changed.length === 0, ...c });
      if (c.changed.length) process.exitCode = 1;
      return;
    }
    const only = flag('--only')?.split(',').filter(Boolean);
    const ids = only ?? fs.readdirSync(path.join(ROOT, 'flows')).filter((f) => f.endsWith('_test.md')).map((f) => f.replace(/_test.md$/, ''));
    // Provenance: the capture run in which each flow passed against the real server.
    const provenance = {};
    for (const d of fs.readdirSync(path.join(ROOT, 'runs')).filter((d) => d.startsWith('capture-')).sort()) {
      const sum = path.join(ROOT, 'runs', d, 'summary.json');
      if (!fs.existsSync(sum)) continue;
      for (const r of JSON.parse(fs.readFileSync(sum, 'utf8')).results) if (r.verdict === 'PASS') provenance[r.id] = { capturedIn: d, record: r.record };
    }
    const missing = ids.filter((id) => !provenance[id]);
    if (missing.length) throw new Error(`No passing capture run for: ${missing.join(', ')}`);
    out({ ok: true, frozen: freeze(ids, provenance) });
  },
  /** The Stop hook. With --hook, reads the hook input on stdin and prints the hook's JSON answer. */
  async gate() {
    let input = {};
    if (rest.includes('--hook')) {
      try {
        input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
      } catch {
        input = {};
      }
    }
    const answer = await gate({ via: rest.includes('--hook') ? 'hook' : 'cli', stopHookActive: Boolean(input.stop_hook_active), rebuild: () => build({ secrets: secretsToScrub() }) });
    if (rest.includes('--hook')) console.log(JSON.stringify(answer));
    else out({ ok: true, ...answer });
  },
  async vikunja() {
    const sub = rest[0];
    if (sub === 'start') out({ ok: true, ...(await vikunja.start()) });
    else if (sub === 'stop') out({ ok: true, ...(await vikunja.stop()) });
    else if (sub === 'reset') {
      await vikunja.resetToPristine();
      out({ ok: true, reset: true, dueDatesAligned: await alignDueDates() });
    } else if (sub === 'status') out({ ok: true, healthy: await vikunja.healthy(), ...(await vikunja.serverOffProof()) });
    else throw new Error('usage: amber vikunja start|stop|reset|status');
  },
};

const fn = commands[cmd];
if (!fn) {
  console.error(`usage: amber <${Object.keys(commands).join('|')}>`);
  process.exit(2);
}
// exitCode rather than process.exit(): exiting while fetch sockets close trips a libuv assertion on Windows.
fn().catch((e) => {
  out({ ok: false, error: String(e?.message ?? e) });
  process.exitCode = 1;
});
