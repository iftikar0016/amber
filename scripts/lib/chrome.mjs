// Development tooling only (not evidence): a minimal headless-Chrome driver over the DevTools protocol,
// with no dependencies. Used by the smoke script and the wireframe generator.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ port = 9333, width = 1280, height = 900 } = {}) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'amber-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
  let ws;
  let id = 0;
  const pending = new Map();
  const events = [];
  for (let i = 0; i < 50 && !ws; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r) => ws.addEventListener('open', r, { once: true }));
      }
    } catch {
      /* not up yet */
    }
    if (!ws) await sleep(200);
  }
  if (!ws) throw new Error('Chrome did not start');
  /** @type {Map<string, Set<(params:any)=>void>>} */
  const listeners = new Map();
  ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method) {
      if (msg.method !== 'Page.screencastFrame') events.push(msg);
      for (const cb of listeners.get(msg.method) ?? []) cb(msg.params);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id;
      pending.set(i, resolve);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await send('Runtime.enable');
  await send('Page.enable');
  return {
    send,
    evaluate,
    events,
    sleep,
    /** Listen for a DevTools event; returns a function that stops listening. */
    on(method, cb) {
      if (!listeners.has(method)) listeners.set(method, new Set());
      listeners.get(method).add(cb);
      return () => listeners.get(method).delete(cb);
    },
    async goto(url, settleMs = 3000) {
      await send('Page.navigate', { url });
      await sleep(settleMs);
    },
    async close() {
      ws.close();
      chrome.kill();
      await sleep(500);
      fs.rmSync(profile, { recursive: true, force: true });
    },
  };
}
