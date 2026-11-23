/* AMBER capsule Service Worker.
 * Answers every /api/ request of the captured Vikunja front end in the browser, with no backend:
 *   1. a route in /amber/handlers.js (the store: login, token refresh, and every interaction repaired in the loop)
 *   2. otherwise, for a GET, the response captured for the same request, matched by meaning (/amber/store.js)
 *   3. otherwise an honest error, logged as unanswered. A recorded write response is never replayed.
 * Vikunja registers /sw.js itself, so this file takes the place of Vikunja's own service worker.
 */
importScripts('/amber/store.js', '/amber/handlers.js');

const LOG_MAX = 1000;
const log = [];
let logEndpoint = true; // POST /__amber/log exists only under `amber serve`; disabled after the first failure

function record(entry) {
  const e = { t: Date.now(), ...entry };
  log.push(e);
  if (log.length > LOG_MAX) log.shift();
  self.clients.matchAll().then((cs) => cs.forEach((c) => c.postMessage({ type: 'amber-log', entry: e })));
  if (logEndpoint) {
    fetch('/__amber/log', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(e) })
      .then((r) => {
        if (!r.ok) logEndpoint = false;
      })
      .catch(() => {
        logEndpoint = false;
      });
  }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('message', (e) => {
  const reply = (m) => e.source && e.source.postMessage(m);
  if (e.data?.type === 'amber-reset') {
    e.waitUntil(AmberStore.reset().then(() => reply({ type: 'amber-reset-done' })));
  } else if (e.data?.type === 'amber-get-log') {
    reply({ type: 'amber-log-dump', log });
  }
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(answer(e.request, url));
    return;
  }
  // Client-side routes (/projects/2/9, /tasks/3 …) get the app shell.
  if (e.request.mode === 'navigate' && !/\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.startsWith('/amber/')) {
    e.respondWith(fetch('/index.html', { cache: 'no-store' }));
  }
});

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return null;
  const text = await req.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function answer(req, url) {
  const method = req.method;
  const where = url.pathname + url.search;
  if (method === 'OPTIONS') return new Response(null, { status: 204 });
  try {
    await AmberStore.load();
    const body = await readBody(req);
    const ctx = AmberHandlers.context({ method, url, body, headers: req.headers });
    for (const route of AmberHandlers.routes) {
      if (route.method !== method) continue;
      const m = route.path.exec(url.pathname);
      if (!m) continue;
      const res = await route.handle({ ...ctx, params: m.groups || {} });
      if (res) {
        record({ method, url: where, outcome: 'store', handler: route.name, status: res.status });
        return res;
      }
    }
    if (method === 'GET') {
      const hit = await AmberStore.replay(method, url);
      if (hit) {
        record({ method, url: where, outcome: 'replay', how: hit.how, status: hit.response.status });
        return hit.response;
      }
      record({ method, url: where, outcome: 'unanswered', status: 404 });
      return AmberHandlers.problem(404, 'AMBER capsule: this request was never captured, and no store route answers it.');
    }
    record({ method, url: where, outcome: 'unanswered-write', status: 501, body: AmberHandlers.preview(body) });
    return AmberHandlers.problem(501, 'AMBER capsule: this change is not supported by the capsule yet.');
  } catch (err) {
    record({ method, url: where, outcome: 'error', status: 500, error: String(err && err.stack ? err.stack : err).slice(0, 500) });
    return AmberHandlers.problem(500, 'AMBER capsule error: ' + String(err && err.message ? err.message : err));
  }
}
