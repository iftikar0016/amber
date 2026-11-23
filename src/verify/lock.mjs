// @ts-check
// One Kane check of the capsule at a time. A verify run serves the capsule on the app's port and the Stop hook may
// rebuild the capsule, so a second run starting during the first would either fail on the port or rebuild files under
// it. The lock is reentrant for the process that holds it (the gate takes it, then calls verify).
import fs from 'node:fs';
import path from 'node:path';
import { STATE } from '../config.mjs';

const LOCK = path.join(STATE, 'verify.lock');

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return /** @type {any} */ (e).code === 'EPERM';
  }
}

/** The live process holding the lock, if it is not this one. */
export function heldByOther() {
  if (!fs.existsSync(LOCK)) return null;
  try {
    const l = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
    if (l.pid === process.pid || !alive(l.pid)) return null;
    return l;
  } catch {
    return null;
  }
}

/** Take the lock (or throw if another live process holds it); returns a release function. */
export function acquire(what) {
  const other = heldByOther();
  if (other) throw new Error(`another Kane check is running (pid ${other.pid}, ${other.what}, since ${other.since})`);
  if (fs.existsSync(LOCK)) {
    try {
      if (JSON.parse(fs.readFileSync(LOCK, 'utf8')).pid === process.pid) return () => {}; // reentrant
    } catch {
      /* stale or unreadable: take it */
    }
  }
  fs.mkdirSync(STATE, { recursive: true });
  fs.writeFileSync(LOCK, JSON.stringify({ pid: process.pid, what, since: new Date().toISOString() }));
  return () => {
    try {
      if (JSON.parse(fs.readFileSync(LOCK, 'utf8')).pid === process.pid) fs.rmSync(LOCK, { force: true });
    } catch {
      /* already gone */
    }
  };
}
