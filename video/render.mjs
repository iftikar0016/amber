// Renders the demo video frame by frame. The stage (video/stage/) draws every frame as a function of time, so this
// steps a virtual clock: seek to t, capture the frame, hand it to ffmpeg, t += 1/fps. Nothing is screen-recorded,
// so motion is exactly even. The narration (from video/narrate.mjs) is laid under it at each scene's start.
//   node video/render.mjs                          -> .amber/video/amber-demo.mp4
//   node video/render.mjs --from s05 --to s06      -> .amber/video/preview.mp4 (those scenes only)
//   node video/render.mjs --stills 12.5,40         -> .amber/video/stills/still-<t>.jpg (for checking a frame)
//   --fps 30 (default) or 60
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/config.mjs';
import { createCapsuleServer } from '../src/capsule/serve.mjs';
import { launch } from '../scripts/lib/chrome.mjs';
import { facts, timeline, LEAD } from './lib/facts.mjs';
import { ffmpegPath, run } from './lib/media.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : dflt);
const FPS = Number(opt('fps', 30));
const PORT = 4796;
const OUT = path.join(ROOT, '.amber', 'video');
fs.mkdirSync(OUT, { recursive: true });

const tl = timeline();
const sceneAt = (v, edge) => {
  if (v == null) return null;
  const s = tl.scenes.find((x) => x.id.startsWith(v));
  if (s) return edge === 'start' ? s.start : s.start + s.dur;
  return Number(v);
};
const from = sceneAt(opt('from'), 'start') ?? 0;
const to = sceneAt(opt('to'), 'end') ?? tl.total;
const stills = opt('stills') ? opt('stills').split(',').map(Number).sort((a, b) => a - b) : null;

// ---- the narration track, once for the whole video ----
const narration = path.join(OUT, 'narration.wav');
{
  const ins = tl.scenes.flatMap((s) => ['-i', s.audio]);
  const parts = tl.scenes.map((s, i) => `[${i}:a]aresample=48000,adelay=delays=${Math.round((s.start + LEAD) * 1000)}:all=1[a${i}]`);
  const mixIn = tl.scenes.map((_, i) => `[a${i}]`).join('');
  run('ffmpeg', ['-y', '-v', 'error', ...ins, '-filter_complex', `${parts.join(';')};${mixIn}amix=inputs=${tl.scenes.length}:normalize=0,apad,atrim=0:${tl.total.toFixed(3)}[out]`, '-map', '[out]', '-ac', '2', '-ar', '48000', narration]);
}

// ---- one origin: the capsule (Vikunja, no server) plus the stage and the committed evidence under /__video/ ----
const stageData = JSON.stringify({ facts: facts(), scenes: tl.scenes.map(({ audio, ...s }) => s), total: tl.total });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const cap = createCapsuleServer({ port: PORT });
const capsuleHandler = cap.server.listeners('request')[0];
cap.server.removeAllListeners('request');
cap.server.on('request', (req, res) => {
  const u = new URL(req.url ?? '/', 'http://x');
  if (u.pathname === '/__video/stage-data.json') return res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(stageData);
  if (u.pathname.startsWith('/__video/')) {
    const file = path.join(ROOT, ...decodeURIComponent(u.pathname.slice('/__video/'.length)).split('/').filter(Boolean));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    return fs.createReadStream(file).pipe(res);
  }
  return capsuleHandler(req, res);
});
await cap.listen();

const c = await launch({ width: 1920, height: 1080, port: 9337 });
const errors = [];
c.on('Runtime.exceptionThrown', (p) => errors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text));
await c.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await c.goto(`http://127.0.0.1:${PORT}/__video/video/stage/index.html`, 0);
const t0 = Date.now();
while (!(await c.evaluate('!!(window.stage && window.stage.ready)'))) {
  if (errors.length) throw new Error(`stage failed: ${errors.join('\n')}`);
  if (Date.now() - t0 > 180000) throw new Error('stage did not get ready');
  await c.sleep(250);
}
console.log(`stage ready in ${((Date.now() - t0) / 1000).toFixed(1)} s; video ${tl.total.toFixed(2)} s`);

let last = -1;
async function seek(t) {
  const r = await c.send('Runtime.evaluate', { expression: `stage.seek(${t.toFixed(4)})`, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(`seek ${t}: ${r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text}`);
  last = t;
}
/** Step forward to t (without capturing), so stateful moments (typing, a reload) happen in order. */
async function warmTo(t) {
  const sc = tl.scenes.find((s) => t >= s.start && t < s.start + s.dur) ?? { start: 0 };
  let x = last < 0 || t < last || last < sc.start - 1 ? Math.max(0, sc.start - 1) : last;
  while (x < t - 1e-6) {
    x = Math.min(t, x + 0.1);
    await seek(x);
  }
}
const shoot = async (format = 'jpeg') => Buffer.from((await c.send('Page.captureScreenshot', { format, quality: format === 'jpeg' ? 93 : undefined, optimizeForSpeed: true })).result.data, 'base64');

try {
  if (stills) {
    const dir = path.join(OUT, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of stills) {
      await warmTo(t);
      await seek(t);
      fs.writeFileSync(path.join(dir, `still-${t.toFixed(2)}.jpg`), await shoot());
      console.log(`still ${t}`);
    }
  } else {
    const full = from === 0 && Math.abs(to - tl.total) < 1e-3;
    const outFile = opt('out') ?? path.join(OUT, full ? 'amber-demo.mp4' : 'preview.mp4');
    const ff = spawn(
      ffmpegPath('ffmpeg'),
      ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-ss', from.toFixed(3), '-t', (to - from).toFixed(3), '-i', narration, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', outFile],
      { stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true },
    );
    if (from > 0) await warmTo(from);
    const n0 = Math.round(from * FPS);
    const n1 = Math.round(to * FPS);
    const began = Date.now();
    for (let n = n0; n < n1; n++) {
      await seek(n / FPS);
      if (!ff.stdin.write(await shoot())) await once(ff.stdin, 'drain');
      if ((n - n0) % (FPS * 10) === 0 && n > n0) {
        const rate = (n - n0) / ((Date.now() - began) / 1000);
        console.log(`${(n / FPS).toFixed(1)} s · ${rate.toFixed(1)} frames/s · ${Math.round((n1 - n) / rate)} s left`);
      }
    }
    ff.stdin.end();
    const [code] = await once(ff, 'exit');
    if (code !== 0) throw new Error(`ffmpeg exited ${code}`);
    console.log(`${path.relative(ROOT, outFile)}: ${((n1 - n0) / FPS).toFixed(1)} s, ${n1 - n0} frames in ${((Date.now() - began) / 1000).toFixed(0)} s`);
  }
  if (errors.length) console.log(`page errors:\n${errors.join('\n')}`);
} finally {
  await c.close();
  await cap.close();
}
