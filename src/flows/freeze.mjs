// @ts-check
// Freezing: once a journey passes against the real server, its saved Kane flow is locked by hash.
// The agent may not edit a frozen flow to make it pass; check() is run by the Stop hook, the pre-commit hook and verify.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { FLOWS_DIR, ROOT } from '../config.mjs';

const LOCK = path.join(FLOWS_DIR, 'flows.lock.json');
const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/**
 * The files that define a flow: its _test.md and everything Kane recorded for it in output-<id>/ (the replayed
 * actions and their checks live in .internal/steps). Replays run a copy in .amber/, so none of these ever change.
 */
export function flowFiles(id) {
  const files = [path.join(FLOWS_DIR, `${id}_test.md`)];
  const out = path.join(FLOWS_DIR, `output-${id}`);
  if (fs.existsSync(out)) {
    for (const rel of /** @type {string[]} */ (fs.readdirSync(out, { recursive: true })).sort()) {
      const abs = path.join(out, rel);
      if (fs.statSync(abs).isFile()) files.push(abs);
    }
  }
  return files.filter((f) => fs.existsSync(f));
}

/**
 * Lock the given flows (adds to an existing lock; never re-locks a flow that is already frozen).
 * @param {string[]} ids
 * @param {Record<string, any>} provenance  per flow: the capture run that passed against the real server
 */
export function freeze(ids, provenance = {}) {
  const lock = fs.existsSync(LOCK) ? JSON.parse(fs.readFileSync(LOCK, 'utf8')) : { note: 'Frozen Kane flows. Changing any of these files fails amber freeze --check.', flows: {} };
  for (const id of ids) {
    if (lock.flows[id]) continue;
    const files = flowFiles(id);
    if (!files.length) throw new Error(`No saved flow for ${id} in flows/`);
    lock.flows[id] = { frozenAt: new Date().toISOString(), ...provenance[id], files: Object.fromEntries(files.map((f) => [path.relative(ROOT, f).split(path.sep).join('/'), sha(f)])) };
  }
  fs.writeFileSync(LOCK, JSON.stringify(lock, null, 2) + '\n');
  return Object.keys(lock.flows);
}

/** Every frozen file whose content no longer matches its hash (or that is missing). */
export function check() {
  if (!fs.existsSync(LOCK)) return { locked: 0, changed: [] };
  const lock = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
  const changed = [];
  for (const [id, f] of Object.entries(lock.flows)) {
    for (const [rel, want] of Object.entries(/** @type {Record<string,string>} */ (f.files))) {
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) changed.push({ id, file: rel, problem: 'missing' });
      else if (sha(abs) !== want) changed.push({ id, file: rel, problem: 'changed' });
    }
  }
  return { locked: Object.keys(lock.flows).length, changed };
}
