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
