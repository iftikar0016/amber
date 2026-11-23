// @ts-check
// Ported from Bad Day (github.com/iftikar0016/badday, MIT, same author).
// Spawns kane-cli without cmd.exe so objectives are passed as a single argv entry.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { classify } from './ndjson.mjs';

let cachedEntry = null;

/** Locate @testmuai/kane-cli's JS entry (the .cmd shim needs shell:true, which mangles quotes). */
export function resolveKaneEntry() {
  if (process.env.AMBER_KANE_ENTRY) return process.env.AMBER_KANE_ENTRY;
  if (cachedEntry) return cachedEntry;
  const rel = path.join('node_modules', '@testmuai', 'kane-cli', 'bin', 'kane-cli.cjs');
  const usual = process.platform === 'win32' && process.env.APPDATA ? path.join(process.env.APPDATA, 'npm', rel) : null;
  if (usual && fs.existsSync(usual)) return (cachedEntry = usual);
  // Otherwise ask npm where global packages live (via cmd.exe on Windows, where npm is a .cmd shim).
  const r = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'npm root -g'], { encoding: 'utf8', windowsHide: true })
    : spawnSync('npm', ['root', '-g'], { encoding: 'utf8' });
  const global = r.status === 0 && r.stdout.trim() ? path.join(r.stdout.trim(), '@testmuai', 'kane-cli', 'bin', 'kane-cli.cjs') : null;
  cachedEntry = global && fs.existsSync(global) ? global : null;
  if (!cachedEntry) throw new Error('Could not find @testmuai/kane-cli. Install it with: npm install -g @testmuai/kane-cli');
  return cachedEntry;
}

/** Kill a whole process tree (node → bundled node → runner → Chrome). */
export function killTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    else process.kill(-pid, 'SIGKILL');
  } catch { /* already gone */ }
}

// Kane picks Chrome's debugging port by scanning upward for the first free one.
// Two runs launched before either Chrome has bound its port pick the same port,
// and the second run silently drives the first run's browser. So launches are
// serialised: a run starts only once the previous one has its browser up (its
// first step event) or has exited, with a ceiling so a stuck launch cannot block.
const LAUNCH_HOLD_MAX_MS = 45_000;
let launchQueue = Promise.resolve();

function takeLaunchSlot() {
  let release = () => {};
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const turn = launchQueue;
  launchQueue = launchQueue.then(() => held);
  return turn.then(() => {
    const ceiling = setTimeout(release, LAUNCH_HOLD_MAX_MS);
    return () => {
      clearTimeout(ceiling);
      release();
    };
  });
}

/**
 * Run kane-cli and stream classified events.
 * Launches are serialised (see takeLaunchSlot); the runs themselves overlap.
 * @param {{args:string[], cwd:string, timeoutSec:number, onEvent?:(e:any)=>void, onStderr?:(line:string)=>void}} o
 * @returns {Promise<{exitCode:number|null, terminal:any, events:any[], stderr:string[], killed:boolean, sessionId:string|null}>}
 */
export async function runKane(o) {
  const entry = resolveKaneEntry();
  fs.mkdirSync(o.cwd, { recursive: true });
  const releaseLaunch = await takeLaunchSlot();
  const isWin = process.platform === 'win32';
  const child = spawn(isWin ? process.execPath : 'kane-cli', isWin ? [entry, ...o.args] : o.args, {
    cwd: o.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    detached: !isWin,
    env: {
      ...process.env,
      KANE_CLI_USER_AGENT: 'claude-code',
      NO_COLOR: '1',
      KANE_CLI_CDP_TIMEOUT_MS: process.env.KANE_CLI_CDP_TIMEOUT_MS ?? '60000',
      KANE_CLI_CDP_RETRIES: process.env.KANE_CLI_CDP_RETRIES ?? '3',
    },
  });

  const events = [];
  const stderr = [];
  let terminal = null;
  let sessionId = null;
  let killed = false;

  const out = readline.createInterface({ input: /** @type {any} */ (child.stdout) });
  out.on('line', (line) => {
    const e = classify(line);
    if (!e) return;
    e._rt = Date.now();
    events.push(e);
    if (e.type === 'recording_state' && e.session_id) sessionId = e.session_id;
    if (e.type === 'run_end' || e.type === 'test_md_done') terminal = e;
    if (e.kind === 'step' || terminal) releaseLaunch();
    o.onEvent?.(e);
  });
  const err = readline.createInterface({ input: /** @type {any} */ (child.stderr) });
  err.on('line', (line) => {
    stderr.push(line);
    o.onStderr?.(line);
  });

  const watchdog = setTimeout(() => {
    killed = true;
    killTree(child.pid);
  }, (o.timeoutSec + 45) * 1000);

  return new Promise((resolve) => {
    child.on('close', (code) => {
      releaseLaunch();
      clearTimeout(watchdog);
      resolve({ exitCode: code, terminal, events, stderr, killed, sessionId });
    });
    child.on('error', (e) => {
      releaseLaunch();
      clearTimeout(watchdog);
      stderr.push(String(e));
      resolve({ exitCode: null, terminal, events, stderr, killed, sessionId });
    });
  });
}

/** Normalise Kane's session_dir (it can start with ~ and mix slashes). */
export function normaliseSessionDir(dir) {
  if (!dir) return null;
  return path.normalize(String(dir).replace(/^~(?=[\\/])/, os.homedir()));
}

export function sessionDirFor(sessionId) {
  return sessionId ? path.join(os.homedir(), '.testmuai', 'kaneai', 'sessions', sessionId) : null;
}

/** Credit balance via `kane-cli balance` (number or null). */
export function readBalance() {
  try {
    const entry = resolveKaneEntry();
    const r = spawnSync(process.execPath, [entry, 'balance'], { encoding: 'utf8', windowsHide: true, env: { ...process.env, NO_COLOR: '1' } });
    const m = /Available credits:\s*([\d.,]+)/.exec(r.stdout ?? '');
    return m ? Number(m[1].replace(/,/g, '')) : null;
  } catch {
    return null;
  }
}
