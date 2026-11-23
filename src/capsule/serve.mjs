// @ts-check
// A plain static file server for the capsule, on the same origin the journeys were recorded on.
// It has no API. Any /api/ request that reaches it got past the Service Worker: that is logged as a leak.
// The capsule's own call log (POST /__amber/log, sent by the Service Worker) is written next to it.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { APP, CAPSULE_DIR } from '../config.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * @param {{dir?: string, logDir?: string, port?: number, host?: string}} [o]
 */
export function createCapsuleServer(o = {}) {
  const dir = path.resolve(o.dir ?? CAPSULE_DIR);
  let flow = 'manual';
  let logDir = o.logDir ?? null;
  const counts = { leaks: 0, answered: 0, replayed: 0, unanswered: 0, errors: 0 };
  const perFlow = /** @type {Record<string, {leaks:number, unanswered:number}>} */ ({});
  const bump = (k) => ((perFlow[flow] ??= { leaks: 0, unanswered: 0 })[k]++);
  const append = (name, o2) => {
    if (!logDir) return;
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, name), JSON.stringify({ t: Date.now(), flow, ...o2 }) + '\n');
  };

  const server = http.createServer((req, res) => {
    const u = new URL(req.url ?? '/', APP.origin);
    if (u.pathname === '/__amber/log' && req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try {
          const e = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (e.outcome === 'store') counts.answered++;
          else if (e.outcome === 'replay') counts.replayed++;
          else if (e.outcome === 'error') counts.errors++;
          else {
            counts.unanswered++;
            bump('unanswered');
          }
          append('capsule-log.ndjson', e);
        } catch {
          /* ignore */
        }
        res.writeHead(204).end();
      });
      return;
    }
    if (u.pathname.startsWith('/api/')) {
      counts.leaks++;
      bump('leaks');
      append('leaks.ndjson', { method: req.method, url: u.pathname + u.search });
      res.writeHead(404, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ message: 'No backend: the capsule Service Worker should have answered this.' }));
      return;
    }
    let rel = decodeURIComponent(u.pathname);
    // A folder without its trailing slash (/amber) redirects, as static hosts do.
    const asDir = path.join(dir, ...rel.split('/').filter(Boolean));
    if (!rel.endsWith('/') && asDir.startsWith(dir) && fs.existsSync(path.join(asDir, 'index.html'))) {
      res.writeHead(301, { location: rel + '/' + u.search }).end();
      return;
    }
    if (rel.endsWith('/')) rel += 'index.html';
    let file = path.join(dir, ...rel.split('/').filter(Boolean));
    if (!file.startsWith(dir)) {
      res.writeHead(403).end();
      return;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      if (path.extname(rel)) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
        return;
      }
      file = path.join(dir, 'index.html'); // client-side route on a first visit, before the SW controls the page
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });

  server.on('upgrade', (req, sock) => {
    counts.leaks++;
    bump('leaks');
    append('leaks.ndjson', { method: 'UPGRADE', url: req.url });
    sock.destroy();
  });

  return {
    server,
    counts,
    listen: () => new Promise((resolve, reject) => server.once('error', reject).listen(o.port ?? APP.port, o.host ?? APP.host, () => resolve(`http://${o.host ?? APP.host}:${o.port ?? APP.port}`))),
    close: () => new Promise((resolve) => server.close(() => resolve(undefined))),
    setFlow(id) {
      flow = id;
    },
    setLogDir(d) {
      logDir = d;
    },
    flowCounts: (id) => perFlow[id] ?? { leaks: 0, unanswered: 0 },
  };
}
