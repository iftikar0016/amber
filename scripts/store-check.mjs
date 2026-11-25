// Development aid only, not evidence: a zero-credit check of the capsule's store against Kane's capture.
// Runs the built capsule's own sw.js (with store.js and handlers.js) in a Node VM, no browser, no credits.
//   node scripts/store-check.mjs pristine          every pre-change GET the store answers, compared with what the server sent
//   node scripts/store-check.mjs journey <id>      a captured journey's requests in order, through the capsule; every read
//                                                  after the first change is compared with what the real server sent then
// Timestamps of things created during the run and `updated` fields are not compared (they differ by nature).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { CAPSULE_DIR, CAPTURE_DIR } from '../src/config.mjs';
import { alignDueDates, captureDayOffsets } from '../src/capsule/build.mjs';

const ORIGIN = 'http://127.0.0.1:4790';
const NOT_A_WRITE = /^\/api\/v2\/(login|register|user\/token\/refresh)$/;
const [mode, id] = process.argv.slice(2);
// The build moves each journey's due dates to the day of the latest capture; the server's answers are compared the same way.
const journeysBuilt = JSON.parse(fs.readFileSync(path.join(CAPSULE_DIR, 'amber', 'seed.json'), 'utf8')).meta.journeys;
const { offsets } = captureDayOffsets(CAPTURE_DIR, journeysBuilt);

function capsule() {
  const ctx = {
    URL, Headers, Request, Response, Blob, TextEncoder, TextDecoder, crypto, btoa, atob, console, setTimeout, clearTimeout, Date, Math, JSON, Promise,
  };
  const log = [];
  let onFetch = null;
  ctx.self = ctx;
  ctx.location = new URL(ORIGIN);
  ctx.clients = { matchAll: async () => [{ postMessage: (m) => m.type === 'amber-log' && log.push(m.entry) }], claim: async () => {} };
  ctx.skipWaiting = () => {};
  ctx.addEventListener = (type, fn) => {
    if (type === 'fetch') onFetch = fn;
  };
  ctx.fetch = async (u) => {
    const p = new URL(u, ORIGIN).pathname;
    if (p.startsWith('/amber/')) return new Response(fs.readFileSync(path.join(CAPSULE_DIR, ...p.split('/').filter(Boolean))));
    return new Response('', { status: 404 });
  };
  ctx.importScripts = (...files) => {
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(CAPSULE_DIR, ...f.split('/').filter(Boolean)), 'utf8'), ctx, { filename: f });
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(CAPSULE_DIR, 'sw.js'), 'utf8'), ctx, { filename: 'sw.js' });
  async function request(method, url, body) {
    const init = { method, headers: { 'content-type': 'application/json' } };
    if (body != null && method !== 'GET') init.body = typeof body === 'string' ? body : JSON.stringify(body);
    let p = null;
    onFetch({ request: new Request(new URL(url, ORIGIN), init), respondWith: (x) => (p = x) });
    const res = await p;
    const text = await res.text();
    await new Promise((r) => setTimeout(r, 0));
    let parsed = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    return { status: res.status, body: parsed, entry: log[log.length - 1] };
  }
  return { request, store: () => ctx.AmberStore };
}

const read = (j) => fs.readFileSync(path.join(CAPTURE_DIR, 'journeys', j + '.ndjson'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const isWrite = (x) => x.method !== 'GET' && !NOT_A_WRITE.test(x.path);
const TS = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:\d\d)$/;

/** Differences between what the capsule sent (a) and what the server sent (b), as readable lines. */
function diff(a, b, at = '', out = [], loose = new Set()) {
  if (out.length > 12) return out;
  const key = at.split('.').pop();
  if (key === 'updated' || key === '$schema') return out;
  if (typeof a === 'string' && typeof b === 'string' && TS.test(a) && TS.test(b) && loose.has(key)) return out;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) out.push(`${at || '.'}: ${a.length} items, server had ${b.length}` + (a[0]?.id !== undefined ? ` (ids ${a.map((x) => x.id)} vs ${b.map((x) => x.id)})` : ''));
    for (let i = 0; i < Math.min(a.length, b.length); i++) diff(a[i], b[i], `${at}[${i}]`, out, loose);
    return out;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) out.push(`${at}.${k}: missing (server: ${JSON.stringify(b[k]).slice(0, 80)})`);
      else if (!(k in b)) out.push(`${at}.${k}: extra (${JSON.stringify(a[k]).slice(0, 80)})`);
      else diff(a[k], b[k], `${at}.${k}`, out, loose);
    }
    return out;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${at || '.'}: ${JSON.stringify(a).slice(0, 100)} != server ${JSON.stringify(b).slice(0, 100)}`);
  return out;
}

async function pristine() {
  const c = capsule();
  await c.request('GET', '/api/v2/info');
  const seen = new Set();
  let answered = 0;
  let bad = 0;
  for (const j of JSON.parse(fs.readFileSync(path.join(CAPSULE_DIR, 'amber', 'seed.json'), 'utf8')).meta.journeys) {
    for (const x of read(j)) {
      if (isWrite(x)) break;
      if (x.method !== 'GET' || !x.path.startsWith('/api/') || x.status >= 400) continue;
      const k = j + ' ' + x.path + x.query;
      if (seen.has(x.path + x.query)) continue;
      seen.add(x.path + x.query);
      const r = await c.request('GET', x.path + x.query);
      if (r.entry?.outcome !== 'store') continue;
      answered++;
      const expected = c.store().shiftDates(alignDueDates(x.resBody, offsets[j] || 0), c.store().state.shiftMs);
      const d = r.status !== x.status ? [`status ${r.status} != ${x.status}`] : diff(r.body, expected);
      if (d.length) bad++;
      console.log(`${d.length ? 'DIFF' : 'same'}  ${k}  (${r.entry.handler})` + (d.length ? '\n      ' + d.join('\n      ') : ''));
    }
  }
  console.log(`\n${answered} pristine reads answered by the store, ${bad} differ from the server.`);
  process.exitCode = bad ? 1 : 0;
}

async function journey(j) {
  const c = capsule();
  let changed = false;
  let bad = 0;
  const loose = new Set(['created', 'updated', 'done_at']);
  for (const x of read(j)) {
    if (!x.path.startsWith('/api/')) continue;
    if (isWrite(x)) changed = true;
    const r = await c.request(x.method, x.path + x.query, x.reqBody);
    const outcome = r.entry?.outcome;
    if (!changed && x.method === 'GET') continue;
    const tag = `${x.method} ${x.path}${x.query.slice(0, 70)}`;
    if (x.method !== 'GET' && NOT_A_WRITE.test(x.path)) continue;
    let d = r.status !== x.status ? [`status ${r.status}, server ${x.status}`] : [];
    if (!d.length && x.resBody && typeof x.resBody === 'object') d = diff(r.body, c.store().shiftDates(alignDueDates(x.resBody, offsets[j] || 0), c.store().state.shiftMs), '', [], loose);
    if (d.length && (outcome === 'store' || isWrite(x) || outcome === 'unanswered')) bad++;
    console.log(`${d.length ? 'DIFF' : 'same'}  [${outcome}${r.entry?.handler ? ':' + r.entry.handler : ''}] ${tag}` + (d.length ? '\n      ' + d.join('\n      ') : ''));
  }
  console.log(`\n${bad} change or store-answered read(s) differ from the server (replayed reads after a change are listed but not counted).`);
  process.exitCode = bad ? 1 : 0;
}

if (mode === 'pristine') await pristine();
else if (mode === 'journey' && id) await journey(id);
else {
  console.error('usage: node scripts/store-check.mjs pristine | journey <id>');
  process.exitCode = 2;
}
