// @ts-check
// Paths and ports, in one place. Everything under .amber/ is local working state and is gitignored.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const STATE = path.join(ROOT, '.amber');

export const VIKUNJA = {
  version: 'v2.8.0',
  asset: 'vikunja-v2.8.0-windows-4.0-amd64.exe',
  sha256: '37be525710b74c2b03f116828334f060c24a50b03a11a3455aa784f07ee7463f',
  bin: path.join(STATE, 'vikunja', 'vikunja.exe'),
  dataDir: path.join(STATE, 'vikunja-data'),
  db: path.join(STATE, 'vikunja-data', 'vikunja.db'),
  pristineDb: path.join(STATE, 'vikunja-pristine.db'),
  jwtSecretFile: path.join(STATE, 'vikunja-jwt-secret'),
  host: '127.0.0.1',
  port: 3456,
};

/** The one origin the app is ever seen on: the recording proxy during capture, the static capsule afterwards. */
export const APP = {
  host: '127.0.0.1',
  port: Number(process.env.AMBER_PORT || 4790),
  get origin() {
    return `http://${this.host}:${this.port}`;
  },
};

export const CREDENTIALS = path.join(STATE, 'credentials.json');
export const KANE_VARS = path.join(STATE, 'kane-vars.json');
export const KANE_CWD = path.join(STATE, 'kane');

export const FLOWS_DIR = path.join(ROOT, 'flows');
export const CAPTURE_DIR = path.join(ROOT, 'capture');
export const RAW_CAPTURE_DIR = path.join(STATE, 'capture-raw');
export const RUNS_DIR = path.join(ROOT, 'runs');
export const CAPSULE_DIR = path.join(ROOT, 'capsule');
