// @ts-check
// Runs the real Vikunja (the target app) from a known database, and proves when it is off.
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { ROOT, STATE, VIKUNJA, APP } from './config.mjs';

const PID_FILE = path.join(STATE, 'vikunja.pid');
const LOG_FILE = path.join(STATE, 'vikunja.log');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sha256File(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** Copy the checksum-verified Vikunja binary into .amber/vikunja/. */
export function ensureBinary() {
  if (fs.existsSync(VIKUNJA.bin)) return VIKUNJA.bin;
  const candidates = [process.env.AMBER_VIKUNJA_BIN, path.resolve(ROOT, '..', 'amber-check', 'vikunja', VIKUNJA.asset)].filter(Boolean);
  const src = candidates.find((p) => p && fs.existsSync(p));
  if (!src) {
    throw new Error(
      `Vikunja ${VIKUNJA.version} binary not found. Download ${VIKUNJA.asset} from Vikunja's official ${VIKUNJA.version} release, ` +
        `check its SHA-256 is ${VIKUNJA.sha256}, and set AMBER_VIKUNJA_BIN to its path.`,
    );
  }
  const got = sha256File(src);
  if (got !== VIKUNJA.sha256) throw new Error(`Checksum mismatch for ${src}: ${got}, expected ${VIKUNJA.sha256}`);
  fs.mkdirSync(path.dirname(VIKUNJA.bin), { recursive: true });
  fs.copyFileSync(src, VIKUNJA.bin);
  return VIKUNJA.bin;
}

function jwtSecret() {
  if (!fs.existsSync(VIKUNJA.jwtSecretFile)) {
    fs.mkdirSync(STATE, { recursive: true });
    fs.writeFileSync(VIKUNJA.jwtSecretFile, randomBytes(32).toString('hex'));
  }
  return fs.readFileSync(VIKUNJA.jwtSecretFile, 'utf8').trim();
}

/** True if something accepts TCP connections on host:port. */
export function isPortOpen(host, port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    const done = (v) => {
      s.destroy();
      resolve(v);
    };
    s.setTimeout(timeoutMs, () => done(false));
    s.once('connect', () => done(true));
    s.once('error', () => done(false));
  });
}

/** Every running process whose image name contains "vikunja" (Windows: tasklist; elsewhere: pgrep). */
export function vikunjaProcesses() {
  if (process.platform === 'win32') {
    const r = spawnSync('tasklist', ['/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true });
    return (r.stdout || '')
      .split(/\r?\n/)
      .map((l) => l.split('","').map((c) => c.replace(/^"|"$/g, '')))
      .filter((c) => c[0] && /vikunja/i.test(c[0]))
      .map((c) => ({ image: c[0], pid: Number(c[1]) }));
  }
  const r = spawnSync('pgrep', ['-a', 'vikunja'], { encoding: 'utf8' });
  return (r.stdout || '').split('\n').filter(Boolean).map((l) => ({ image: l.split(' ')[1], pid: Number(l.split(' ')[0]) }));
}

/** The evidence that the real server is off: nothing on its port and no Vikunja process. */
export async function serverOffProof() {
  const portOpen = await isPortOpen(VIKUNJA.host, VIKUNJA.port);
  const procs = vikunjaProcesses();
  return { checkedAt: new Date().toISOString(), port: VIKUNJA.port, portOpen, vikunjaProcesses: procs, off: !portOpen && procs.length === 0 };
}

async function waitFor(fn, timeoutMs, what) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (await fn()) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${what}`);
}

export async function healthy() {
  try {
    const r = await fetch(`http://${VIKUNJA.host}:${VIKUNJA.port}/api/v1/info`);
    return r.ok;
  } catch {
    return false;
  }
}

/** Start Vikunja in the background on 127.0.0.1:3456 with its data in .amber/vikunja-data. */
export async function start() {
  ensureBinary();
  if (await healthy()) return { alreadyRunning: true };
  if (await isPortOpen(VIKUNJA.host, VIKUNJA.port)) throw new Error(`Port ${VIKUNJA.port} is busy but Vikunja is not answering on it`);
  fs.mkdirSync(path.join(VIKUNJA.dataDir, 'files'), { recursive: true });
  const log = fs.openSync(LOG_FILE, 'a');
  const child = spawn(VIKUNJA.bin, [], {
    cwd: VIKUNJA.dataDir,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
    env: {
      ...process.env,
      VIKUNJA_SERVICE_INTERFACE: `${VIKUNJA.host}:${VIKUNJA.port}`,
      VIKUNJA_SERVICE_ROOTPATH: VIKUNJA.dataDir,
      VIKUNJA_SERVICE_PUBLICURL: `${APP.origin}/`,
      VIKUNJA_SERVICE_JWTSECRET: jwtSecret(),
      VIKUNJA_SERVICE_TIMEZONE: 'GMT',
      VIKUNJA_DATABASE_TYPE: 'sqlite',
      VIKUNJA_DATABASE_PATH: VIKUNJA.db,
      VIKUNJA_FILES_BASEPATH: path.join(VIKUNJA.dataDir, 'files'),
    },
  });
  child.unref();
  fs.writeFileSync(PID_FILE, String(child.pid));
  await waitFor(healthy, 30_000, 'Vikunja to answer /api/v1/info');
  return { pid: child.pid };
}

/** Stop every Vikunja process and wait until the port is closed. */
export async function stop() {
  const procs = vikunjaProcesses();
  for (const p of procs) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(p.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    else {
      try {
        process.kill(p.pid, 'SIGKILL');
      } catch {
        /* gone */
      }
    }
  }
  fs.rmSync(PID_FILE, { force: true });
  await waitFor(async () => !(await isPortOpen(VIKUNJA.host, VIKUNJA.port)) && vikunjaProcesses().length === 0, 15_000, 'Vikunja to stop');
  return { stopped: procs.length };
}

function removeDbSidecars(db) {
  for (const ext of ['-wal', '-shm', '-journal']) fs.rmSync(db + ext, { force: true });
}

const SIDECARS = ['-wal', '-shm'];

/**
 * Save the current database as the pristine seed. Vikunja is killed, not shut down, so recent
 * writes may still sit in the WAL file: the database and its sidecars are copied as one set.
 */
export async function snapshotPristine() {
  await stop();
  fs.copyFileSync(VIKUNJA.db, VIKUNJA.pristineDb);
  for (const ext of SIDECARS) {
    fs.rmSync(VIKUNJA.pristineDb + ext, { force: true });
    if (fs.existsSync(VIKUNJA.db + ext)) fs.copyFileSync(VIKUNJA.db + ext, VIKUNJA.pristineDb + ext);
  }
  return { pristine: VIKUNJA.pristineDb, bytes: fs.statSync(VIKUNJA.pristineDb).size };
}

/** Stop, restore the pristine database, start. Every journey begins from the same data. */
export async function resetToPristine() {
  if (!fs.existsSync(VIKUNJA.pristineDb)) throw new Error('No pristine database yet. Run: node bin/amber.mjs setup');
  await stop();
  removeDbSidecars(VIKUNJA.db);
  fs.copyFileSync(VIKUNJA.pristineDb, VIKUNJA.db);
  for (const ext of SIDECARS) if (fs.existsSync(VIKUNJA.pristineDb + ext)) fs.copyFileSync(VIKUNJA.pristineDb + ext, VIKUNJA.db + ext);
  return start();
}

/** Delete the database so setup can create a fresh account. */
export async function wipe() {
  await stop();
  removeDbSidecars(VIKUNJA.db);
  fs.rmSync(VIKUNJA.db, { force: true });
  fs.rmSync(path.join(VIKUNJA.dataDir, 'files'), { recursive: true, force: true });
}
