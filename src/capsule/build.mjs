// @ts-check
// Stage 2: turn Kane's scrubbed capture into the capsule, a folder of static files with no backend.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CAPSULE_DIR, CAPTURE_DIR, FLOWS_DIR, ROOT } from '../config.mjs';
import { assertClean } from '../capture/scrub.mjs';
import { liftModel } from './model.mjs';
import { buildSite } from '../site/build-site.mjs';

const SRC = path.join(ROOT, 'capsule-src');
/** Requests that are part of signing in, not changes to the user's data. */
const NOT_A_WRITE = /^\/api\/v2\/(login|register|user\/token\/refresh)$/;

/** Must match key() in capsule-src/amber/store.js (test/key.test.mjs keeps them in step). */
export function requestKey(method, pathname, search) {
  const u = new URL(pathname + (search || ''), 'http://x');
  const pairs = [...u.searchParams.entries()].map(([k, v]) => [k, v.replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:\d\d)?/g, '<ts>')]);
  pairs.sort((a, b) => (a[0] + '=' + a[1] < b[0] + '=' + b[1] ? -1 : 1));
  return method + ' ' + u.pathname + (pairs.length ? '?' + pairs.map(([k, v]) => k + '=' + v).join('&') : '');
}

function readNdjson(file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

/** Journeys to build from: the frozen ones if flows are locked, else every captured journey. */
function journeyIds(captureDir) {
  const lock = path.join(FLOWS_DIR, 'flows.lock.json');
  if (fs.existsSync(lock)) return Object.keys(JSON.parse(fs.readFileSync(lock, 'utf8')).flows);
  const dir = path.join(captureDir, 'journeys');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.ndjson')).map((f) => f.replace(/\.ndjson$/, '')).sort() : [];
}

export function transformIndexHtml(html) {
  let out = html.replace(/window\.API_URL\s*=\s*'[^']*'/, "window.API_URL = ''");
  out = out.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, '<script type="amber/deferred-module" data-src="$1"></script>');
  out = out.replace('</body>', '<script src="/amber/boot.js"></script>\n</body>');
  if (!out.includes('amber/deferred-module') || !out.includes("window.API_URL = ''")) throw new Error('index.html did not have the expected shape (API_URL and module entry)');
  return out;
}

/**
 * @param {{captureDir?: string, outDir?: string, secrets?: string[]}} [o]
 */
export function build(o = {}) {
  const captureDir = o.captureDir ?? CAPTURE_DIR;
  const outDir = o.outDir ?? CAPSULE_DIR;
  const staticDir = path.join(captureDir, 'static');
  const manifest = JSON.parse(fs.readFileSync(path.join(staticDir, 'manifest.json'), 'utf8'));
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'amber', 'files'), { recursive: true });

  // 1. The front end, as captured. Every client-side route (/login, /projects/3/13 …) serves the same app shell;
  // the capsule's index.html is that shell, from / if a journey loaded it, else from any route that served it.
  let files = 0;
  const shellPath = manifest['/'] ? '/' : Object.keys(manifest).find((p) => /text\/html/.test(manifest[p].type) && !path.extname(p));
  if (!shellPath) throw new Error('The capture has no app shell (an HTML page from / or a client-side route)');
  for (const [p, f] of Object.entries(manifest)) {
    if (p === '/sw.js') continue; // replaced by AMBER's
    const body = fs.readFileSync(path.join(staticDir, 'files', f.sha));
    if (p === shellPath) {
      const html = transformIndexHtml(body.toString('utf8'));
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      fs.writeFileSync(path.join(outDir, '404.html'), html); // static hosts that serve 404.html for unknown paths
      continue;
    }
    if (/text\/html/.test(f.type) && !path.extname(p)) continue; // client-side routes: the SW serves the shell
    const dest = path.join(outDir, ...p.split('/').filter(Boolean));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, body);
    files++;
  }
  if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error('The capture has no index.html (GET /)');

  // 2. Replay entries: GETs captured before the first change in their journey, so they show the seeded state.
  /** @type {Record<string, any>} */
  const replay = {};
  const pristine = [];
  let capturedAt = 0;
  let user = null;
  const used = journeyIds(captureDir);
  for (const id of used) {
    const file = path.join(captureDir, 'journeys', `${id}.ndjson`);
    if (!fs.existsSync(file)) continue;
    let changed = false;
    for (const x of readNdjson(file)) {
      capturedAt = Math.max(capturedAt, x.t);
      if (x.method !== 'GET' && x.method !== 'HEAD' && x.method !== 'OPTIONS' && !NOT_A_WRITE.test(x.path)) changed = true;
      if (x.method !== 'GET' || changed || x.status >= 400) continue;
      if (x.path === '/api/v2/user' && !user && x.resBody?.id) user = { id: x.resBody.id, username: x.resBody.username, name: x.resBody.name };
      pristine.push(x);
      const k = requestKey('GET', x.path, x.query);
      if (replay[k]) continue;
      const entry = { url: x.path + x.query, status: x.status, headers: x.resHeaders, journey: id };
      if (x.resFile) {
        fs.copyFileSync(path.join(staticDir, 'files', x.resFile), path.join(outDir, 'amber', 'files', x.resFile));
        entry.bodyFile = x.resFile;
      } else entry.body = x.resBody;
      replay[k] = entry;
    }
  }
  if (!user) throw new Error('The capture has no GET /api/v2/user response, so the demo user is unknown');

  // 3. The store's model, lifted from the same pristine responses.
  const model = liftModel(pristine);
  const body = { replay, model };
  const seedId = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16);
  const seed = { meta: { seedId, app: 'Vikunja v2.8.0', capturedAt: new Date(capturedAt).toISOString(), user, journeys: used }, ...body };
  const seedText = JSON.stringify(seed);
  assertClean(seedText, o.secrets ?? [], 'in seed.json');
  fs.writeFileSync(path.join(outDir, 'amber', 'seed.json'), seedText);
  // Small file the boot script reads to sign a visitor in as the demo user without loading the whole seed.
  fs.writeFileSync(path.join(outDir, 'amber', 'demo-user.json'), JSON.stringify({ id: user.id, username: user.username }));

  // 4. AMBER's Service Worker, store and routes.
  fs.copyFileSync(path.join(SRC, 'sw.js'), path.join(outDir, 'sw.js'));
  for (const f of fs.readdirSync(path.join(SRC, 'amber'))) fs.copyFileSync(path.join(SRC, 'amber', f), path.join(outDir, 'amber', f));
  assertClean(fs.readFileSync(path.join(outDir, 'index.html'), 'utf8'), o.secrets ?? [], 'in index.html');

  const site = buildSite(outDir);
  const info = { site, builtAt: new Date().toISOString(), seedId, journeys: used, staticFiles: files, replayEntries: Object.keys(replay).length, modelKeys: Object.keys(model) };
  fs.writeFileSync(path.join(outDir, 'amber', 'build.json'), JSON.stringify(info, null, 2));
  return info;
}
