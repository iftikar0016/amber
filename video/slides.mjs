// Renders the video's still scenes (video/slides/index.html) to 1920x1080 PNGs, with every fact read from the
// committed runs, the lock file and git history.   node video/slides.mjs  -> .amber/video/slide-<name>.png
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ROOT } from '../src/config.mjs';
import { launch } from '../scripts/lib/chrome.mjs';

const OUT = path.join(ROOT, '.amber', 'video');
const PORT = 4797;
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const ndjson = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' }).stdout.trim();

function data() {
  const spec = readJson('journeys.json');
  const lock = readJson('flows/flows.lock.json');
  const capture = spec.journeys.map((j) => {
    const rec = lock.flows[j.id].record; // the capture run in which Kane passed this journey on the real server
    const r = readJson(`${rec}/result.json`);
    return { id: j.id.slice(0, 3), title: j.title, shot: `/${rec}/${r.evidence.finalShot}` };
  });
  const base = 'runs/verify-2026-11-23T15-33-57';
  const log = ndjson(`${base}/capsule-log/capsule-log.ndjson`);
  const wire = (flow) => {
    const e = log.find((x) => x.flow === flow && x.outcome === 'unanswered-write');
    return `${e.method} ${e.url} → ${e.status}, refused`;
  };
  const r09 = readJson(`${base}/j09-add-task/a1/result.json`);
  const r15 = readJson(`${base}/j15-comment/a1/result.json`);
  const commits = git('log', '--reverse', '--format=%h%x09%s', '--grep=^capsule:')
    .split('\n')
    .map((l) => {
      const [sha, subject] = l.split('\t');
      return { sha, what: subject.replace(/^capsule:\s*/, '').replace(/\s*\(fixes.*$/, ''), flow: /fixes (j\d\d)/.exec(subject)?.[1] ?? '' };
    });
  const hook = ndjson('runs/gate.ndjson')
    .filter((e) => e.via === 'hook')
    .map((e) => ({ at: e.at.slice(11, 16) + ' UTC', message: (e.message || '').split('\n').slice(0, 2).join('\n') }));
  const credits = ndjson('runs/credits.ndjson').reduce((a, e) => a + (e.spent || 0), 0);
  const runs = fs.readdirSync(path.join(ROOT, 'runs')).filter((d) => fs.statSync(path.join(ROOT, 'runs', d)).isDirectory()).length;
  return {
    capture,
    j09: { run: 'verify-2026-11-23T15-33-57', tag: r09.tag, shot: `/${base}/j09-add-task/a1/${r09.evidence.finalShot}`, say: r09.oneLiner, wire: wire('j09-add-task') },
    j15: {
      run: 'verify-2026-11-23T15-33-57',
      shot: `/${base}/j15-comment/a1/${r15.evidence.finalShot}`,
      wire: wire('j15-comment'),
      // the comment editor holding the unsent draft, in Kane's 1920x1080 screenshot
      highlight: { left: '20.6%', top: '72.6%', width: '50.2%', height: '11.5%' },
    },
    commits,
    hook,
    record: [`Kane credits spent: ${credits.toLocaleString('en-US', { maximumFractionDigits: 2 })} (every batch logged)`, `Kane runs committed: ${runs}`, `Commits: ${git('rev-list', '--count', 'HEAD')}, the first on ${git('log', '--reverse', '--format=%ad', '--date=short').split('\n')[0]}`],
  };
}

fs.writeFileSync(path.join(ROOT, 'video', 'slides', 'data.json'), JSON.stringify(data(), null, 2));

// Serve the repository read-only (the slide page, and Kane's screenshots under runs/).
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.js': 'text/javascript' };
const srv = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(ROOT, ...rel.split('/').filter(Boolean));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => srv.listen(PORT, '127.0.0.1', r));
const c = await launch({ width: 1920, height: 1080, port: 9336 });
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 810, deviceScaleFactor: 4 / 3, mobile: false });
try {
  fs.mkdirSync(OUT, { recursive: true });
  for (const s of ['idea', 'capture', 'j09', 'j15', 'loop', 'hook', 'try']) {
    await c.goto(`http://127.0.0.1:${PORT}/video/slides/index.html?s=${s}`, 2500);
    await c.evaluate('document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))))');
    const shot = await c.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, `slide-${s}.png`), Buffer.from(shot.result.data, 'base64'));
    console.log(`slide-${s}.png`);
  }
} finally {
  await c.close();
  srv.close();
}
