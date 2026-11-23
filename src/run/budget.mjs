// @ts-check
// Credit guard. Every batch that can spend Kane credits goes through here.
// The ledger (runs/credits.ndjson) is committed, so the spend is auditable.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RUNS_DIR } from '../config.mjs';
import { readBalance } from '../kane/spawn.mjs';

const LEDGER = path.join(RUNS_DIR, 'credits.ndjson');
const CONFIG = path.join(ROOT, 'amber.config.json');

export function cap() {
  const c = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, 'utf8')) : {};
  return Number(process.env.AMBER_CREDIT_CAP || c.budget?.cap || 0);
}

export function ledger() {
  if (!fs.existsSync(LEDGER)) return [];
  return fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

export function spentSoFar() {
  return ledger().reduce((a, e) => a + (Number(e.spent) || 0), 0);
}

/**
 * Refuse a batch that could take total AMBER spend past the cap.
 * @param {string} what  label for the ledger
 * @param {number} estimate  credits this batch could spend
 */
export function openBatch(what, estimate) {
  const limit = cap();
  if (!limit) throw new Error('No credit cap set. Put {"budget":{"cap":N}} in amber.config.json or set AMBER_CREDIT_CAP.');
  const before = readBalance();
  if (before === null) throw new Error('Could not read the Kane credit balance (is kane-cli signed in?)');
  const spent = spentSoFar();
  if (spent + estimate > limit) {
    throw new Error(`Credit cap: ${what} could spend ~${Math.round(estimate)}; AMBER has spent ${Math.round(spent)} of its ${limit} cap.`);
  }
  if (before < estimate) throw new Error(`Only ${before} credits left; ${what} needs ~${estimate}.`);
  const started = new Date().toISOString();
  return {
    before,
    /** Record the batch's real spend from the balance delta. */
    close(note = {}) {
      const after = readBalance();
      const entry = { started, ended: new Date().toISOString(), what, estimate, balanceBefore: before, balanceAfter: after, spent: after === null ? null : Math.round((before - after) * 100) / 100, ...note };
      fs.mkdirSync(RUNS_DIR, { recursive: true });
      fs.appendFileSync(LEDGER, JSON.stringify(entry) + '\n');
      return entry;
    },
  };
}
