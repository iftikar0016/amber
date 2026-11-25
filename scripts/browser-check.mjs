// Development aid, not evidence: does the capsule work for a visitor in a given Chromium-family browser
// (Chrome, Edge) at a given origin? It is not a Kane run and no claim about the journeys rests on it.
//   node scripts/browser-check.mjs [--origin http://127.0.0.1:4790] [--browser chrome|edge]
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d);
const ORIGIN = opt('origin', 'http://127.0.0.1:4790').replace(/\/$/, '');
const BROWSER = opt('browser', 'chrome');
const PATHS = { chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe', edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' };
process.env.CHROME_PATH = PATHS[BROWSER] ?? BROWSER;
const { launch } = await import('./lib/chrome.mjs');

const c = await launch({ width: 1280, height: 900, port: 9341 });
const text = () => c.evaluate('document.body ? document.body.innerText : ""');
async function waitFor(cond, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await c.evaluate(`(() => { try { return !!(${cond}); } catch { return false; } })()`)) return true;
    await c.sleep(200);
  }
  return false;
}
const results = [];
const check = async (name, fn) => {
  const t = Date.now();
  let ok = false;
  try {
    ok = await fn();
  } catch {
    ok = false;
  }
  results.push({ name, ok, ms: Date.now() - t });
  console.log(`${ok ? '✓' : '✗'} ${name} (${((Date.now() - t) / 1000).toFixed(1)} s)${ok ? '' : `\n    page shows: ${(await text()).slice(0, 200).replace(/\s+/g, ' ')}`}`);
};
const task = `Browser check ${Math.random().toString(36).slice(2, 8)}`;
try {
  const version = (await c.send('Browser.getVersion')).result?.product;
  console.log(`${version} · ${ORIGIN}`);
  await check('a visitor lands signed in, the app running with no server', async () => {
    await c.goto(`${ORIGIN}/`, 500);
    return waitFor('document.body.innerText.includes("Kitchen renovation")');
  });
  await check('a deep link opens a project', async () => {
    await c.goto(`${ORIGIN}/projects/3`, 500);
    return waitFor('document.body.innerText.includes("Choose worktop")');
  });
  await check('an added task is still there after a reload', async () => {
    const typed = await c.evaluate(`(() => {
      const el = [...document.querySelectorAll('textarea, input')].find((e) => /add a task/i.test(e.placeholder || ''));
      el.focus(); el.value = ${JSON.stringify(task)}; el.dispatchEvent(new Event('input', { bubbles: true }));
      return true; })()`);
    await c.sleep(600);
    const clicked = await c.evaluate(`(() => {
      const el = [...document.querySelectorAll('textarea, input')].find((e) => /add a task/i.test(e.placeholder || ''));
      const f = el.getBoundingClientRect();
      const b = [...document.querySelectorAll('button')].filter((b) => /\\badd\\b/i.test(b.textContent) && b.offsetParent)
        .sort((a, z) => Math.abs(a.getBoundingClientRect().top - f.top) - Math.abs(z.getBoundingClientRect().top - f.top))[0];
      b.click(); return b.textContent.trim(); })()`);
    if (!typed || !clicked || !(await waitFor(`document.body.innerText.includes(${JSON.stringify(task)})`))) return false;
    await c.send('Page.reload', {});
    await c.sleep(500);
    return waitFor(`document.body.innerText.includes(${JSON.stringify(task)})`);
  });
  await check('a hard reload (bypassing the Service Worker) recovers', async () => {
    await c.send('Page.reload', { ignoreCache: true });
    await c.sleep(500);
    return waitFor(`document.body.innerText.includes(${JSON.stringify(task)})`, 30000);
  });
  await check("AMBER's page shows 15 of 15", async () => {
    await c.goto(`${ORIGIN}/amber/`, 500);
    return waitFor('document.getElementById("proven") && document.getElementById("proven").textContent === "15"');
  });
} finally {
  await c.close();
}
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `${failed} of ${results.length} checks failed` : `all ${results.length} checks passed`);
process.exitCode = failed ? 1 : 0;
