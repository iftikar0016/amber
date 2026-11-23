// @ts-check
// The Stop hook: the coding agent may not end its turn while a flow that passed before is failing now.
// Contract (code.claude.com/docs/en/hooks, "Stop"): print {"decision":"block","reason":...} to keep Claude working;
// print nothing (or {"systemMessage":...}) to let it stop. Capped at 3 blocks per regression, and it fails open
// on infrastructure problems, saying why, so a broken Kane setup never traps the agent.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RUNS_DIR, STATE } from '../config.mjs';
import { check as frozenCheck } from '../flows/freeze.mjs';
import { readState, regressions } from './state.mjs';
import { verify } from './verify.mjs';
import { acquire, heldByOther } from './lock.mjs';

const GATE_FILE = path.join(STATE, 'gate.json');
const MAX_BLOCKS = 3;
const GATE_LOG = path.join(RUNS_DIR, 'gate.ndjson');

/** A hash of everything that decides what the capsule answers. */
export function capsuleSourceHash() {
  const h = createHash('sha256');
  const add = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const rel of /** @type {string[]} */ (fs.readdirSync(dir, { recursive: true })).sort()) {
      const abs = path.join(dir, rel);
      if (fs.statSync(abs).isFile()) h.update(rel).update(fs.readFileSync(abs));
    }
  };
  add(path.join(ROOT, 'capsule-src'));
  add(path.join(ROOT, 'src', 'capsule'));
  return h.digest('hex').slice(0, 16);
}

const readGate = () => (fs.existsSync(GATE_FILE) ? JSON.parse(fs.readFileSync(GATE_FILE, 'utf8')) : { verifiedHash: null, blocks: {} });
const writeGate = (g) => {
  fs.mkdirSync(STATE, { recursive: true });
  fs.writeFileSync(GATE_FILE, JSON.stringify(g, null, 2));
};

/**
 * Every gate decision, appended to runs/gate.ndjson (committed): when the Stop hook fired, what it checked, and
 * whether it blocked the agent or let it stop, and why.
 * @param {{stopHookActive?: boolean, rebuild?: () => any, via?: 'hook'|'cli'}} o
 * @returns {Promise<{decision?:'block', reason?:string, systemMessage?:string}>}
 */
export async function gate(o = {}) {
  const started = Date.now();
  const entry = { at: new Date(started).toISOString(), via: o.via ?? 'cli', stopHookActive: Boolean(o.stopHookActive), capsuleHash: capsuleSourceHash(), checked: /** @type {any} */ (null) };
  const answer = await decide(o, entry);
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const outcome = answer.decision === 'block' ? 'blocked' : answer.systemMessage ? 'allowed, with a message' : 'allowed';
  fs.appendFileSync(GATE_LOG, JSON.stringify({ ...entry, ms: Date.now() - started, outcome, regressions: regressions(), message: answer.reason ?? answer.systemMessage ?? null }) + '\n');
  return answer;
}

/** @returns {Promise<{decision?:'block', reason?:string, systemMessage?:string}>} */
async function decide(o, entry) {
  // 1. Frozen flows must be untouched: that is never an infrastructure question.
  const frozen = frozenCheck();
  if (frozen.changed.length) {
    return { decision: 'block', reason: `AMBER: frozen flows were changed (${frozen.changed.map((c) => `${c.file} ${c.problem}`).join(', ')}). Restore them with git checkout; never edit a frozen flow to make it pass.` };
  }

  const g = readGate();
  const hash = capsuleSourceHash();
  // 2. If the capsule changed since it was last verified, replay the flows that have passed before.
  if (g.verifiedHash !== hash) {
    const passing = Object.entries(readState().flows)
      .filter(([, f]) => f.everPassed)
      .map(([id]) => id);
    if (passing.length) {
      // Never rebuild the capsule or start Kane while another check is running (it serves the capsule on the port).
      const other = heldByOther();
      if (other) return { systemMessage: `AMBER gate: a Kane check is already running (pid ${other.pid}, ${other.what}); not starting a second one. Its result will be checked the next time a turn ends.` };
      let release = () => {};
      try {
        release = acquire('stop-hook regression check');
        o.rebuild?.();
        const r = await verify({ only: passing, mode: 'replay', label: 'stop-hook regression check' });
        entry.checked = { runId: r.runId, flows: passing.length };
      } catch (e) {
        return { systemMessage: `AMBER gate skipped (failing open): could not run the regression check: ${String(e?.message ?? e).slice(0, 300)}` };
      } finally {
        release();
      }
    }
    g.verifiedHash = hash;
    writeGate(g);
  }

  // 3. Block on regressions, at most MAX_BLOCKS times for the same set.
  const reg = regressions();
  if (!reg.length) {
    g.blocks = {};
    writeGate(g);
    return {};
  }
  const key = reg.sort().join(',');
  g.blocks[key] = (g.blocks[key] ?? 0) + 1;
  writeGate(g);
  if (g.blocks[key] > MAX_BLOCKS) {
    return { systemMessage: `AMBER: ${reg.join(', ')} still failing after ${MAX_BLOCKS} attempts. Marked as needing a human; letting the turn end.` };
  }
  const state = readState();
  const lines = reg.map((id) => {
    const last = state.flows[id].history.at(-1);
    return `- ${id}: passed before, fails now (run ${last?.runId}). Brief: ${last?.record ? last.record.replace(/\/a\d+$/, '') + '/brief.md' : '(none)'}`;
  });
  return {
    decision: 'block',
    reason: `AMBER Stop hook (attempt ${g.blocks[key]} of ${MAX_BLOCKS}): Kane replayed the frozen flows against the capsule with the server off, and a flow that passed before now fails.\n${lines.join('\n')}\nRead the brief, fix the regression in the capsule store, rebuild, and re-run: node bin/amber.mjs verify --only ${reg.join(',')}`,
  };
}
