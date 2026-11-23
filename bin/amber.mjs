#!/usr/bin/env node
// @ts-check
// AMBER command line. Each command prints one JSON line on success, so a coding agent can read it.
import * as vikunja from '../src/vikunja.mjs';
import { seed, alignDueDates } from '../src/seed.mjs';

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
