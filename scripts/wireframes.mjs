// Build tooling (not evidence): line-drawing wireframes of the app's real screens for AMBER's page.
// Serves the capsule on a spare port, opens each journey's screen in headless Chrome as a visitor, reads the boxes of
// the visible text, controls and panels, and writes site/wireframes.json. The drawing is Vikunja's actual layout.
//   node scripts/wireframes.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, CAPSULE_DIR } from '../src/config.mjs';
import { createCapsuleServer } from '../src/capsule/serve.mjs';
import { launch } from './lib/chrome.mjs';

const PORT = 4795;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const W = 1280;
const H = 800;

/** Project views from the captured project list, so screen URLs use the capsule's real ids. */
function views() {
  const seed = JSON.parse(fs.readFileSync(path.join(CAPSULE_DIR, 'amber', 'seed.json'), 'utf8'));
  const list = Object.entries(seed.replay).find(([k]) => k.startsWith('GET /api/v2/projects?'))?.[1]?.body;
  const items = Array.isArray(list) ? list : list?.items ?? [];
  const byTitle = {};
  for (const p of items) byTitle[p.title] = { id: p.id, views: Object.fromEntries((p.views ?? []).map((v) => [v.view_kind, v.id])) };
  return byTitle;
}

/** Runs in the page: boxes of visible text lines, form controls, panels and icons. */
const EXTRACT = `(() => {
  const out = [];
  const vw = innerWidth, vh = innerHeight;
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const visible = (r) => r.width >= 3 && r.height >= 3 && r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh;
  const push = (kind, r) => out.push({ kind, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (!visible(r)) continue;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') { push('input', r); continue; }
    if (tag === 'button' || el.getAttribute('role') === 'button') { if (r.width * r.height < 40000) push('button', r); }
    if (tag === 'svg' && r.width <= 40 && r.height <= 40) { push('icon', r); continue; }
    const panel = (cs.backgroundColor !== bodyBg && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none';
    if (panel && r.width * r.height > 6000 && r.width < vw * 0.98) push('panel', r);
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const rr of range.getClientRects()) if (visible(rr)) push(parseFloat(cs.fontSize) >= 20 ? 'heading' : 'text', rr);
    }
  }
  return out.slice(0, 400);
})()`;

const v = views();
const kitchen = v['Kitchen renovation'];
const website = v['Website relaunch'];
const screens = {
  home: '/',
  projects: '/projects',
  list: `/projects/${website.id}/${website.views.list}`,
  task: '/tasks/3',
  table: `/projects/${kitchen.id}/${kitchen.views.table}`,
  kanban: `/projects/${kitchen.id}/${kitchen.views.kanban}`,
  upcoming: '/tasks/by/upcoming',
};

const srv = createCapsuleServer({ port: PORT });
await srv.listen();
const chrome = await launch({ width: W, height: H });
const result = { width: W, height: H, generatedAt: new Date().toISOString(), screens: {} };
try {
  await chrome.goto(ORIGIN + '/', 5000); // visitor mode signs in as the demo user
  for (const [name, p] of Object.entries(screens)) {
    await chrome.goto(ORIGIN + p, 3500);
    const boxes = await chrome.evaluate(EXTRACT);
    result.screens[name] = { path: p, landedOn: await chrome.evaluate('location.pathname'), boxes };
    console.log(name, p, '->', result.screens[name].landedOn, boxes.length, 'boxes');
  }
} finally {
  await chrome.close();
  await srv.close();
}
fs.mkdirSync(path.join(ROOT, 'site'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'site', 'wireframes.json'), JSON.stringify(result));
