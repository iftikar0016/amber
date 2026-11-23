// Development aid only, not evidence: a zero-credit headless-Chrome look at the capsule while building it.
// Every claim AMBER makes comes from Kane CLI runs; this just shortens the edit-and-look cycle.
//   node scripts/dev-smoke.mjs <path> [<path> ...]      e.g. /login /projects/2/1
// Signs in through the capsule's own login page, visits each path, prints the visible text and the capsule log.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORIGIN = process.env.AMBER_ORIGIN || 'http://127.0.0.1:4790';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Git Bash rewrites a leading /path into C:/Program Files/Git/path; undo that.
const paths = process.argv.slice(2).map((p) => p.replace(/^[A-Z]:\/Program Files\/Git/i, ''));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'amber-smoke-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });

let ws;
let id = 0;
const pending = new Map();
const events = [];
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r) => ws.addEventListener('open', r, { once: true }));
        ws.addEventListener('message', (m) => {
          const msg = JSON.parse(m.data);
          if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg);
            pending.delete(msg.id);
          } else if (msg.method) events.push(msg);
        });
        return;
      }
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error('Chrome did not start');
}
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
const waitText = async (re, ms = 15000) => {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const t = await evaluate('document.body ? document.body.innerText : ""');
    if (re.test(t || '')) return t;
    await sleep(300);
  }
  return evaluate('document.body ? document.body.innerText : ""');
};

try {
  await connect();
  await send('Runtime.enable');
  await send('Page.enable');
  if (process.env.AMBER_SMOKE_NO_LOGIN) {
    // Visitor mode: open the capsule's front page with no session, as a judge would.
    await send('Page.navigate', { url: ORIGIN + '/' });
    await sleep(4000);
    console.log('== visitor lands on:', await evaluate('location.pathname'));
    console.log(String(await evaluate('document.body.innerText')).slice(0, 500));
  }
  if (!process.env.AMBER_SMOKE_NO_LOGIN) {
    await send('Page.navigate', { url: ORIGIN + '/login' });
    await waitText(/Login|Username|Password/i);
    if (process.env.AMBER_SMOKE_DEBUG) console.log(await evaluate('document.querySelector("form") ? document.querySelector("form").outerHTML.slice(0, 3000) : "no form"'));
    // Sign in through the page, as a user would (any password works in the capsule).
    await evaluate(`(async () => {
      const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      set(document.querySelector('input#username, input[name=username]'), 'amber');
      set(document.querySelector('input[type=password]'), ${JSON.stringify(process.env.AMBER_SMOKE_PASSWORD || 'anything')});
      const stay = document.querySelector('#loginform input[type=checkbox]');
      if (stay && !stay.checked) stay.click();
      document.querySelector('#loginform button.is-primary').click();
    })()`);
    await sleep(2500);
    console.log('== after sign-in:', await evaluate('location.pathname'), 'token stored:', await evaluate('Boolean(localStorage.getItem("token"))'));
    if (process.env.AMBER_SMOKE_PROBE) console.log('   probe after sign-in:', await evaluate(fs.readFileSync(process.env.AMBER_SMOKE_PROBE, 'utf8')));
    console.log((await waitText(/Amber|Current tasks|Good/i)).slice(0, 600));
  }
  for (const p of paths) {
    await send('Page.navigate', { url: ORIGIN + p });
    for (let i = 0; i < (process.env.AMBER_SMOKE_DEBUG ? 35 : 7); i++) {
      await sleep(process.env.AMBER_SMOKE_DEBUG ? 100 : 500);
      if (process.env.AMBER_SMOKE_DEBUG) console.log('   at', await evaluate('location.href'));
    }
    if (process.env.AMBER_SMOKE_PROBE) console.log('   probe:', await evaluate(fs.readFileSync(process.env.AMBER_SMOKE_PROBE, 'utf8')));
    console.log(`\n== ${p} -> ${await evaluate('location.pathname')}`);
    console.log(String(await evaluate('document.body.innerText')).slice(0, 900));
  }
  const errors = events.filter((e) => e.method === 'Runtime.exceptionThrown').map((e) => e.params.exceptionDetails?.exception?.description?.slice(0, 200));
  if (errors.length) console.log('\n== page exceptions:\n' + errors.join('\n'));
  if (process.env.AMBER_SMOKE_DEBUG) {
    const lines = events
      .filter((e) => e.method === 'Runtime.consoleAPICalled' || e.method === 'Page.frameNavigated' || e.method === 'Page.navigatedWithinDocument')
      .map((e) =>
        e.method === 'Runtime.consoleAPICalled'
          ? `console.${e.params.type}: ` + e.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 220)
          : `${e.method}: ${e.params.frame?.url ?? e.params.url}`,
      );
    console.log('\n== navigation and console:\n' + lines.join('\n'));
  }
} finally {
  ws?.close();
  chrome.kill();
  await sleep(500);
  fs.rmSync(profile, { recursive: true, force: true });
}
