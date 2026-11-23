// @ts-check
// Recording reverse proxy: APP.origin (127.0.0.1:4790) -> the real Vikunja (127.0.0.1:3456).
// Every exchange is written scrubbed: API calls to capture/journeys/<journey>.ndjson, front-end files
// (deduplicated by content hash) to capture/static/. Nothing unscrubbed is written to disk.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { APP, CAPTURE_DIR, VIKUNJA } from '../config.mjs';
import { keepHeaders, scrubJson, scrubText } from './scrub.mjs';

const UP_ORIGIN = `http://${VIKUNJA.host}:${VIKUNJA.port}`;
const isText = (ct = '') => /text|json|javascript|xml|svg|manifest/.test(ct);
const isJson = (ct = '') => /json/.test(ct);

/**
 * @param {{secrets?: string[], log?: (o:any)=>void}} [opts]
 */
export function createRecorder(opts = {}) {
  const secrets = opts.secrets ?? [];
  const staticDir = path.join(CAPTURE_DIR, 'static');
  const filesDir = path.join(staticDir, 'files');
  const journeysDir = path.join(CAPTURE_DIR, 'journeys');
  const manifestFile = path.join(staticDir, 'manifest.json');
  fs.mkdirSync(filesDir, { recursive: true });
  fs.mkdirSync(journeysDir, { recursive: true });
  /** @type {Record<string, {sha:string, type:string, status:number}>} */
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
  let journey = 'unlabelled';
  let seq = 0;
  const counts = { api: 0, static: 0, upgrades: 0 };

  function storeBody(buf, type) {
    const sha = createHash('sha256').update(buf).digest('hex').slice(0, 20);
    const file = path.join(filesDir, sha);
    if (!fs.existsSync(file)) fs.writeFileSync(file, buf);
    return sha;
  }

  function record(req, reqBody, status, resHeaders, body) {
    const u = new URL(req.url, APP.origin);
    const resType = String(resHeaders['content-type'] || '');
    if (!u.pathname.startsWith('/api/')) {
      // Front-end files: one copy per path (the latest), bodies deduplicated.
      if (req.method === 'GET' && status === 200) {
        manifest[u.pathname] = { sha: storeBody(body, resType), type: resType, status };
        fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
      }
      counts.static++;
      return;
    }
    const reqType = String(req.headers['content-type'] || '');
    let reqParsed = null;
    if (reqBody.length) {
      const t = reqBody.toString('utf8');
      try {
        reqParsed = scrubJson(JSON.parse(t));
      } catch {
        reqParsed = scrubText(t, secrets);
      }
    }
    let resParsed = null;
    let resFile = null;
    if (isJson(resType)) {
      try {
        resParsed = scrubJson(JSON.parse(body.toString('utf8')));
      } catch {
        resParsed = scrubText(body.toString('utf8'), secrets);
      }
    } else if (isText(resType)) resParsed = scrubText(body.toString('utf8'), secrets);
    else if (body.length) resFile = storeBody(body, resType);
    const line = {
      seq: ++seq,
      t: Date.now(),
      journey,
      method: req.method,
      path: u.pathname,
      query: u.search,
      reqType,
      reqBody: reqParsed,
      status,
      resHeaders: keepHeaders(resHeaders),
      resBody: resParsed,
      ...(resFile ? { resFile } : {}),
    };
    // Secrets are also checked on the serialised line, whatever field they ended up in.
    const text = scrubText(JSON.stringify(line), secrets);
    fs.appendFileSync(path.join(journeysDir, `${journey}.ndjson`), text + '\n');
    counts.api++;
    opts.log?.({ journey, m: req.method, u: u.pathname + u.search, s: status });
  }

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const reqBody = Buffer.concat(chunks);
      const headers = { ...req.headers, host: `${VIKUNJA.host}:${VIKUNJA.port}`, 'accept-encoding': 'identity' };
      if (headers.origin) headers.origin = UP_ORIGIN;
      const up = http.request({ host: VIKUNJA.host, port: VIKUNJA.port, method: req.method, path: req.url, headers }, (ur) => {
        const out = [];
        ur.on('data', (c) => out.push(c));
        ur.on('end', () => {
          let body = Buffer.concat(out);
          const ct = String(ur.headers['content-type'] || '');
          if (isText(ct)) body = Buffer.from(body.toString('utf8').split(UP_ORIGIN).join(APP.origin));
          const h = { ...ur.headers };
          delete h['content-length'];
          delete h['content-encoding'];
          if (h['access-control-allow-origin']) h['access-control-allow-origin'] = APP.origin;
          try {
            record(req, reqBody, ur.statusCode ?? 0, h, body);
          } catch (e) {
            opts.log?.({ error: String(e) });
          }
          res.writeHead(ur.statusCode ?? 502, h);
          res.end(body);
        });
      });
      up.on('error', (e) => {
        res.writeHead(502, { 'content-type': 'text/plain' });
        res.end('amber recorder: upstream error ' + e.message);
      });
      up.end(reqBody);
    });
  });

  // Pass WebSocket upgrades (/api/v2/ws) straight through so the real app behaves normally while recording.
  server.on('upgrade', (req, sock, head) => {
    counts.upgrades++;
    opts.log?.({ journey, m: 'UPGRADE', u: req.url });
    const up = net.connect(VIKUNJA.port, VIKUNJA.host, () => {
      const lines = [`${req.method} ${req.url} HTTP/1.1`];
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const k = req.rawHeaders[i];
        const v = /^host$/i.test(k) ? `${VIKUNJA.host}:${VIKUNJA.port}` : /^origin$/i.test(k) ? UP_ORIGIN : req.rawHeaders[i + 1];
        lines.push(`${k}: ${v}`);
      }
      up.write(lines.join('\r\n') + '\r\n\r\n');
      if (head?.length) up.write(head);
      up.pipe(sock);
      sock.pipe(up);
    });
    up.on('error', () => sock.destroy());
    sock.on('error', () => up.destroy());
  });

  return {
    server,
    listen: () => new Promise((resolve) => server.listen(APP.port, APP.host, () => resolve(APP.origin))),
    close: () => new Promise((resolve) => server.close(() => resolve(undefined))),
    setJourney(id) {
      journey = id;
    },
    counts,
  };
}
