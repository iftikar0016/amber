// The demo video's stage. Everything on screen is a function of the time t (in seconds), and the renderer steps t
// frame by frame on a virtual clock (video/render.mjs): nothing is screen-recorded, so no frame is dropped or late.
// The amber block is AMBER's real page in a frame, stepped through its recorded events; its CSS animations are
// driven by the same clock. The app window is the real capsule (Vikunja with no server), used as a visitor would.
// Every fact shown comes from /__video/stage-data.json, which video/lib/facts.mjs reads from committed files.

const DATA = await (await fetch('/__video/stage-data.json')).json();
const F = DATA.facts;
const SCENES = DATA.scenes;
const TOTAL = DATA.total;
const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---- time helpers ------------------------------------------------------------------------------------------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, x) => a + (b - a) * x;
const E = {
  lin: (x) => x,
  out: (x) => 1 - (1 - x) ** 3,
  in: (x) => x * x * x,
  expo: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  back: (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
};
/** Progress from 0 to 1 between t0 and t0 + d. */
const P = (t, t0, d, e = E.out) => (d <= 0 ? (t >= t0 ? 1 : 0) : e(clamp((t - t0) / d)));
/** A bump: rises at t0 over d, holds, falls at t1 over d2. */
const bump = (t, t0, t1, d = 0.3, d2 = d) => P(t, t0, d) * (1 - P(t, t1, d2, E.inOut));
const DEF = { x: 960, y: 540, z: 0, s: 1, r: 0, rx: 0, ry: 0, o: 1, b: 0 };
/** Keyframes [[time, {x,y,s,...}, ease], ...]: the value at t. */
function K(t, frames) {
  if (t <= frames[0][0]) return { ...DEF, ...frames[0][1] };
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1, e = E.inOut] = frames[i];
    const [t0, v0] = frames[i - 1];
    if (t <= t1) {
      const x = e(clamp((t - t0) / (t1 - t0 || 1)));
      const o = {};
      for (const k of Object.keys(DEF)) o[k] = mix(v0[k] ?? DEF[k], v1[k] ?? v0[k] ?? DEF[k], x);
      return o;
    }
  }
  const last = {};
  for (const f of frames) Object.assign(last, f[1]);
  return { ...DEF, ...last };
}
/** Fill each keyframe with the values of the one before it, so a frame only names what changes. */
function chain(frames) {
  let acc = {};
  return frames.map(([t, v, e]) => {
    acc = { ...acc, ...v };
    return [t, { ...acc }, e];
  });
}

// ---- elements ----------------------------------------------------------------------------------------------
function mk(parent, cls, html, { c = true, tag = 'div' } = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  e._c = c;
  e.style.position = 'absolute';
  e.style.left = '0';
  e.style.top = '0';
  e.style.transformOrigin = '0 0';
  parent.appendChild(e);
  return e;
}
/** Place an element: x, y (its centre, or its top-left if made with c:false), scale, rotations, opacity, blur. */
function put(el, o) {
  const op = clamp(o.o ?? 1);
  el.style.opacity = op.toFixed(3);
  el.style.visibility = op < 0.003 ? 'hidden' : 'visible';
  if (op < 0.003) return;
  let tr = `translate3d(${(o.x ?? 0).toFixed(2)}px, ${(o.y ?? 0).toFixed(2)}px, 0px)`;
  if (o.rx || o.ry || o.z) tr += ` perspective(2200px) translateZ(${(o.z ?? 0).toFixed(1)}px)`;
  if (o.rx) tr += ` rotateX(${o.rx.toFixed(3)}deg)`;
  if (o.ry) tr += ` rotateY(${o.ry.toFixed(3)}deg)`;
  if (o.r) tr += ` rotate(${o.r.toFixed(3)}deg)`;
  tr += ` scale(${(o.s ?? 1).toFixed(4)})`;
  if (el._c) tr += ' translate(-50%, -50%)';
  el.style.transform = tr;
  const b = o.b ?? 0;
  el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : '';
}
const hide = (el) => put(el, { o: 0 });

/** Words that rise into place one by one. *word* is gold italic, ~word~ is crimson. */
function words(el, text) {
  el.innerHTML = text
    .split(' ')
    .map((w) => {
      let cls = '';
      const m = /^([*~])(.+)\1([.,:;!?]*)$/.exec(w);
      if (m) {
        cls = m[1] === '*' ? ' em' : ' bad';
        w = m[2] + m[3];
      }
      return `<span class="w"><span class="wi${cls}">${esc(w)}</span></span>`;
    })
    .join(' ');
  const ws = [...el.querySelectorAll('.wi')];
  return (t, t0, { st = 0.055, d = 0.8, out = Infinity, times = null } = {}) => {
    ws.forEach((w, i) => {
      const p = P(t, times ? times[Math.min(i, times.length - 1)] : t0 + i * st, d, E.expo);
      const q = P(t, out + i * 0.02, 0.45, E.inOut);
      w.style.transform = `translateY(${((1 - p) * 108 - q * 108).toFixed(2)}%)`;
      w.style.opacity = (Math.min(1, p * 1.6) * (1 - q)).toFixed(3);
    });
  };
}
/** Typed text: segments [[cls, text], ...], n characters shown, with a caret. */
function typed(segs, n, caret = true) {
  let out = '';
  let left = n;
  for (const [cls, s] of segs) {
    if (left <= 0) break;
    const part = s.slice(0, left);
    left -= part.length;
    out += cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part);
  }
  return out + (caret ? '<span class="caret">▍</span>' : '');
}
const segLen = (segs) => segs.reduce((a, [, s]) => a + s.length, 0);
function svgEl(parent, tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent.appendChild(e);
  return e;
}
/** Draw a path or line on: p from 0 to 1. */
function draw(path, p) {
  if (!path._len) path._len = path.getTotalLength();
  path.style.strokeDasharray = `${path._len}`;
  path.style.strokeDashoffset = `${(path._len * (1 - clamp(p))).toFixed(2)}`;
  path.style.opacity = p > 0.001 ? '1' : '0';
}
function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let x = Math.imul(h ^ (h >>> 15), h | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- narration cues ----------------------------------------------------------------------------------------
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
function cueIn(sceneId, phrase, nth = 0, end = false) {
  const sc = SCENES.find((s) => s.id === sceneId);
  const ws = sc.words.map((w) => norm(w.w));
  const ps = phrase.split(/\s+/).map(norm);
  for (let i = 0; i <= ws.length - ps.length; i++) {
    if (ps.every((p, j) => ws[i + j] === p) && nth-- === 0) return end ? sc.words[i + ps.length - 1].e : sc.words[i].s;
  }
  throw new Error(`no cue "${phrase}" in ${sceneId}`);
}

// ---- the two live pages ------------------------------------------------------------------------------------
const pending = []; // promises the renderer waits for before it captures a frame
const done = new Set();
/** Run fn once, the first frame at or after time at. */
const once = (key, t, at, fn) => {
  if (t >= at && !done.has(key)) {
    done.add(key);
    const r = fn();
    if (r && r.then) pending.push(r);
  }
};
const until = async (cond, ms = 30000) => {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    try {
      if (cond()) return true;
    } catch {
      /* not ready */
    }
    await new Promise((r) => setTimeout(r, 60));
  }
  throw new Error(`timed out waiting for ${cond}`);
};
const loaded = (frame) => new Promise((r) => frame.addEventListener('load', r, { once: true }));

const amberFrame = $('amber');
const appFrame = $('app');
amberFrame.src = '/amber/?t=start';
appFrame.src = '/projects/3';
await Promise.all([loaded(amberFrame), loaded(appFrame)]);
const AW = amberFrame.contentWindow;
const AD = amberFrame.contentDocument;
await until(() => AW.amberPlayback && AD.querySelectorAll('.tile').length === F.journeys.length);
{
  const st = AD.createElement('style');
  st.textContent = `html, body { background: transparent !important; }
    .controls, .caption, .counter { display: none !important; }
    #live { color-scheme: light; }
    .__fx { fill: rgba(255, 226, 150, 0); stroke: #ffd36b; stroke-width: 2.4; opacity: 0; filter: url(#glowGold); }
    .__fx.red { stroke: #ff1f3d; filter: url(#glowRed); fill: rgba(255, 40, 60, 0); }`;
  AD.head.appendChild(st);
}
await AD.fonts.ready;
const blockEl = AD.getElementById('block');
const br = blockEl.getBoundingClientRect();
const BL = { cx: br.left + br.width / 2, cy: br.top + br.height / 2, w: br.width, h: br.height };
amberFrame.style.left = `${-BL.cx}px`;
amberFrame.style.top = `${-BL.cy}px`;
// tile outlines AMBER's page does not have: a flash on the tile whenever Kane delivers a verdict on it
const FX = {};
const TILE = {};
for (const g of AD.querySelectorAll('.tile')) {
  const fr = g.querySelector('.frame');
  const r = AD.createElementNS(NS, 'rect');
  for (const a of ['x', 'y', 'width', 'height', 'rx']) r.setAttribute(a, fr.getAttribute(a));
  r.setAttribute('class', '__fx');
  g.appendChild(r);
  FX[g.dataset.flow] = r;
  const tr = g.getBoundingClientRect();
  TILE[g.dataset.flow] = { dx: tr.left + tr.width / 2 - BL.cx, dy: tr.top + tr.height / 2 - BL.cy, w: tr.width, h: tr.height };
}
const EV = AW.amberPlayback.events;

const AppW = appFrame.contentWindow;
const appDoc = () => appFrame.contentDocument;
const TASK = 'Paint samples for the hallway';
await until(() => appDoc().body.innerText.includes('Choose worktop'), 60000);
const appInput = () => [...appDoc().querySelectorAll('textarea, input')].find((e) => /add a task/i.test(e.placeholder || ''));
const appAdd = () => {
  const f = appInput().getBoundingClientRect();
  const bs = [...appDoc().querySelectorAll('button')].filter((b) => /\badd\b/i.test(b.textContent) && b.offsetParent);
  const d = (b) => Math.abs(b.getBoundingClientRect().top - f.top) + Math.abs(b.getBoundingClientRect().left - f.right);
  return bs.sort((a, b) => d(a) - d(b))[0];
};
const rectIn = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
};
const AIN = rectIn(appInput());
const AADD = rectIn(appAdd());

// images and fonts first, so no frame shows something half-loaded
const IMGS = [...F.capture.map((c) => c.shot), F.j09.shot, F.j15.shot, F.j14.shot];
await Promise.all(
  IMGS.map(
    (src) =>
      new Promise((r) => {
        const i = new Image();
        i.onload = i.onerror = r;
        i.src = src;
      }),
  ),
);
await Promise.all(['300 76px Fraunces', 'italic 300 76px Fraunces', '400 34px Fraunces', '400 20px "JetBrains Mono"', '500 20px "JetBrains Mono"', '700 20px "JetBrains Mono"', '400 20px Inter', '500 20px Inter', '600 20px Inter', '700 20px Inter'].map((f) => document.fonts.load(f)));
await document.fonts.ready;

// ---- background ------------------------------------------------------------------------------------------
const motes = [];
{
  const r = rng('dust');
  for (let i = 0; i < 64; i++) {
    const d = 0.25 + r() * 0.75;
    const el = mk($('dust'), 'mote', null, { c: true });
    const size = 3 + d * 9;
    el.style.width = el.style.height = `${size}px`;
    motes.push({ el, d, x0: r() * 1920, y0: r() * 1180, sp: 8 + d * 22, sw: 10 + r() * 30, f: 0.1 + r() * 0.25, ph: r() * 6.28, tw: 0.4 + r() * 1.2 });
  }
}
const S = { red: 0, gold: 0 };
function background(t) {
  put($('g1'), { x: 960 + 300 * Math.sin(t * 0.11) - 750, y: 470 + 150 * Math.sin(t * 0.083 + 1) - 550, s: 1 + 0.08 * Math.sin(t * 0.19) + S.gold * 0.25, o: 0.85 + S.gold * 0.4, c: false });
  put($('g2'), { x: 960 + 420 * Math.cos(t * 0.07 + 2) - 550, y: 520 + 200 * Math.sin(t * 0.13) - 450, s: 1, o: 1 });
  put($('g3'), { x: 960 + 380 * Math.sin(t * 0.09 + 4) - 650, y: 600 + 160 * Math.cos(t * 0.1) - 500, s: 1 + S.red * 0.3, o: 0.55 + S.red * 0.9 });
  for (const m of motes) {
    const y = ((((m.y0 - t * m.sp) % 1180) + 1180) % 1180) - 50;
    const x = m.x0 + Math.sin(t * m.f + m.ph) * m.sw;
    const tw = 0.6 + 0.4 * Math.sin(t * m.tw + m.ph);
    put(m.el, { x, y, s: 1, o: (0.15 + 0.55 * m.d) * tw });
  }
}

// ---- the amber block: keyframes, and which recorded event it shows when ----------------------------------
const blockCam = $('blockCam');
const BK = []; // block placement keyframes, global time
const BSEG = []; // [t0, t1, i0, i1, ease]: the page shows the first i events
const FLIPS = []; // [time, button id]: when to press the page's own "Open the live app" / "Back to the block"
let shownIdx = -1;
let lastT = -1;
const flash = {};
const anims = new WeakMap();
function blockIndexAt(t) {
  let idx = F.marks.firstCapsuleRun;
  for (const [t0, t1, i0, i1, e = E.lin] of BSEG) {
    if (t < t0) break;
    idx = t >= t1 ? i1 : Math.floor(mix(i0, i1, e(clamp((t - t0) / (t1 - t0)))) + 1e-6);
  }
  return idx;
}
function provenAt(idx) {
  const last = {};
  for (const e of EV.slice(0, idx)) if (e.kind === 'verdict' && e.target === 'capsule') last[e.flow] = e.verdict;
  return Object.values(last).filter((v) => v === 'PASS').length;
}
let counterVal = 0;
let counterAt = -9;
function blockUpdate(t) {
  const idx = blockIndexAt(t);
  if (idx !== shownIdx) {
    const forward = idx > shownIdx && t >= lastT && t - lastT < 0.5;
    if (forward) for (const e of EV.slice(Math.max(0, shownIdx), idx)) if (e.kind === 'verdict' && e.target === 'capsule') flash[e.flow] = { t, pass: e.verdict === 'PASS' };
    AW.amberPlayback.show(idx, forward);
    shownIdx = idx;
  }
  lastT = t;
  for (const [flow, r] of Object.entries(FX)) {
    const f = flash[flow];
    const a = f ? clamp(1 - (t - f.t) / 0.75) : 0;
    r.style.opacity = a.toFixed(3);
    if (f) r.setAttribute('class', f.pass ? '__fx' : '__fx red');
    r.style.fill = f ? (f.pass ? `rgba(255,226,150,${(a * 0.3).toFixed(3)})` : `rgba(255,40,60,${(a * 0.28).toFixed(3)})`) : '';
  }
  const k = K(t, BK);
  put(blockCam, { ...k, c: false });
  for (const [at, id] of FLIPS) once(`${id}@${at}`, t, at, () => AD.getElementById(id).click());
  // the counter reads the page's own number; the round-1 story counts its 15 journeys, the rest counts all of them
  const round1 = t >= scn('s04-baseline').start - 0.6 && t < scn('s09b-round2').start + 0.2;
  $('counterTotal').textContent = round1 ? '15' : String(F.journeys.length);
  const n = Number(AD.getElementById('proven').textContent);
  if (n !== counterVal) {
    counterVal = n;
    counterAt = t;
    $('counterN').textContent = String(n);
  }
  const ck = K(t, CK);
  const pulse = 1 + 0.16 * (1 - P(t, counterAt, 0.45, E.out)) * (t - counterAt < 0.45 ? 1 : 0);
  put($('counter'), { ...ck, s: ck.s * pulse });
}
const CK = []; // counter placement keyframes
/** Drive the page's CSS animations and transitions from the virtual clock. */
function driveAnimations(doc, T) {
  for (const a of doc.getAnimations()) {
    let st = anims.get(a);
    if (st === undefined) {
      st = T - (a.currentTime ?? 0);
      anims.set(a, st);
      a.pause();
    }
    a.currentTime = Math.max(0, T - st);
  }
}
/** Where the block puts a tile, for a camera that zooms into it. */
const tileAt = (flow, k) => ({ x: k.x + TILE[flow].dx * k.s, y: k.y + TILE[flow].dy * k.s });

// ---- the app window ---------------------------------------------------------------------------------------
const appCam = $('appCam');
const appWin = $('appWin');
appWin.style.width = '1440px';
$('appBody').style.width = '1440px';
$('appBody').style.height = '900px';
appWin.style.transform = 'translate(-720px, -476px)';
const AK = [];
const CURK = []; // cursor keyframes in the app's own pixels
function appUpdate(t) {
  put(appCam, { ...K(t, AK), c: false });
  const ck = K(t, CURK);
  put($('cursor'), { x: ck.x, y: ck.y, s: ck.s, o: ck.o, c: false });
}

// ---- scenes ------------------------------------------------------------------------------------------------
const scenes = [];
function scene(id, build, { noIn = false, noOut = false } = {}) {
  const sc = SCENES.find((s) => s.id === id);
  const under = mk($('under'), 'layer', null, { c: false });
  const over = mk($('over'), 'layer', null, { c: false });
  for (const l of [under, over]) {
    l.style.inset = '0';
    l.style.transformOrigin = '50% 50%';
  }
  const c = (p, n = 0) => cueIn(id, p, n);
  const ce = (p, n = 0) => cueIn(id, p, n, true);
  const end = sc.start + sc.dur;
  const update = build({ under, over, c, ce, start: sc.start, end, sc });
  scenes.push({ id, under, over, start: sc.start, end, update, noIn, noOut });
}
function layerFx(s, t) {
  const pin = s.noIn ? 1 : P(t, s.start - 0.3, 0.7, E.out);
  const pout = s.noOut ? 0 : P(t, s.end - 0.3, 0.6, E.inOut);
  const o = pin * (1 - pout);
  for (const l of [s.under, s.over]) {
    l.style.opacity = o.toFixed(3);
    const sc = (1 + 0.035 * (1 - pin)) * (1 - 0.035 * pout);
    l.style.transform = `scale(${sc.toFixed(4)})`;
    const b = 7 * (1 - pin) + 9 * pout;
    l.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : '';
  }
}

const SC1 = SCENES[0];
const scn = (id) => SCENES.find((s) => s.id === id);

// == s01: Vikunja, server off -> flips into the amber block, which replays the whole run -> AMBER ==============
scene('s01-open', ({ over, c, start, end }) => {
  const kick = mk(over, 'kicker', null);
  const kw = words(kick, 'Vikunja v2.8.0 · a real open-source to-do app');
  const off = mk(over, 'pill off', '<b></b>its server: switched off · port ' + F.serverOff.port + ' closed');
  off.style.fontSize = '22px';
  off.style.height = '46px';
  off.style.padding = '0 24px';
  const mark = mk(over, 'wordmark', 'AMBER'.split('').map((l) => `<span class="letter">${l}</span>`).join(''));
  const letters = [...mark.querySelectorAll('.letter')];
  const sub = mk(over, 'kicker', null);
  const sw = words(sub, 'Vikunja with its server off · every journey proven by Kane CLI');
  const tFlip = c('every journey') - 0.15;
  const tAmber = c('this is amber');
  // the app window: rises in, drifts, then turns away as the block turns in
  AK.push(
    ...chain([
      [start - 0.01, { x: 960, y: 640, s: 0.6, rx: 24, ry: -16, o: 0 }],
      [start + 1.3, { y: 500, s: 0.68, rx: 7, ry: -7, o: 1 }, E.expo],
      [tFlip, { s: 0.71, rx: 3, ry: 5 }, E.sine],
      [tFlip + 0.42, { s: 0.68, ry: 90, o: 1 }, E.in],
      [tFlip + 0.43, { o: 0 }, E.lin],
    ]),
  );
  BK.push(
    ...chain([
      [tFlip + 0.42, { x: 960, y: 528, s: 1.04, ry: -90, rx: 0, o: 0 }],
      [tFlip + 0.43, { o: 1 }, E.lin],
      [tFlip + 1.25, { ry: 0, s: 1.1 }, E.out],
      [tAmber - 0.2, { s: 1.16, rx: 2 }, E.sine],
      [tAmber + 0.7, { y: 430, s: 0.92, rx: 0, o: 0.42, b: 6 }, E.inOut],
      [end + 0.2, { s: 0.88, o: 0, b: 9 }, E.inOut],
    ]),
  );
  BSEG.push([tFlip + 0.9, c('each one') + 0.35, F.marks.firstCapsuleRun, F.marks.end, E.sine]);
  CK.push(
    ...chain([
      [tFlip + 0.7, { x: 960, y: 118, s: 0.9, o: 0 }],
      [tFlip + 1.2, { y: 96, s: 1, o: 1 }, E.out],
      [tAmber, { o: 1 }],
      [tAmber + 0.6, { y: 80, o: 0 }, E.inOut],
    ]),
  );
  return (t) => {
    kw(t, c('real') - 0.2, { st: 0.05, out: tFlip - 0.3 });
    put(kick, { x: 960, y: 908, o: 1 });
    const po = P(t, c('switched off'), 0.5, E.back);
    put(off, { x: 960, y: 100, s: 0.6 + 0.4 * po, o: P(t, c('switched off'), 0.25) * (1 - P(t, tFlip + 0.5, 0.5, E.inOut)) });
    S.red += 0.6 * bump(t, c('switched off'), c('switched off') + 0.8, 0.2, 1.2);
    letters.forEach((l, i) => {
      const p = P(t, tAmber + 0.05 + i * 0.08, 1.1, E.expo);
      l.style.transform = `translateY(${((1 - p) * 70).toFixed(2)}px)`;
      l.style.opacity = p.toFixed(3);
      l.style.filter = p < 0.99 ? `blur(${((1 - p) * 14).toFixed(2)}px)` : '';
    });
    put(mark, { x: 960, y: 470, s: 1 + 0.03 * P(t, tAmber, 3, E.out), o: 1 });
    sw(t, tAmber + 0.55, { st: 0.04 });
    put(sub, { x: 960, y: 640, o: 1 });
    S.gold += 0.7 * bump(t, tAmber, end, 0.6, 0.8);
  };
});

// == s02: the idea: front end + Service Worker, no backend. A naive replay lies. =============================
scene('s02-idea', ({ under, over, c, start, end }) => {
  const title = mk(over, 'title', null);
  const tw = words(title, 'A *capsule,* not a recording');
  const svg = svgEl(over, 'svg', { class: 'over', width: 1920, height: 1080, viewBox: '0 0 1920 1080' });
  // the browser (front end + Service Worker) on the left, the API server on the right
  const browser = svgEl(svg, 'rect', { x: 90, y: 330, width: 1150, height: 430, rx: 28, fill: 'rgba(40,26,12,0)', stroke: 'rgba(255,196,110,0.55)', 'stroke-width': 2.5 });
  const bLabel = mk(over, 'kicker', 'In the browser', { c: false });
  const fe = mk(over, 'node', '<div class="nt">Vikunja\'s front end</div><div class="ns">its own, unchanged</div>');
  fe.style.width = '420px';
  fe.style.height = '230px';
  const sw = mk(over, 'node', '<div class="nt">Service Worker</div><div class="ns">answers every API call</div>');
  sw.style.width = '360px';
  sw.style.height = '230px';
  sw.style.borderColor = 'rgba(255,211,107,0.9)';
  sw.style.boxShadow = '0 0 60px rgba(255,190,80,0.25)';
  const server = mk(over, 'node server', '<div class="nt">Vikunja API server</div><div class="ns">Go binary + database</div><div class="off">OFF</div>');
  server.style.width = '380px';
  server.style.height = '230px';
  const serverOff = server.querySelector('.off');
  const linkFar = svgEl(svg, 'line', { x1: 1240, y1: 560, x2: 1460, y2: 560, stroke: 'rgba(255,196,110,0.6)', 'stroke-width': 3, 'stroke-dasharray': '10 10' });
  const strike = svgEl(svg, 'path', { d: 'M1470 450 L1840 680', stroke: '#ff2d46', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' });
  const paths = ['GET /api/v2/projects', 'GET /api/v2/tasks/13', 'GET /api/v2/user', 'PUT /api/v2/projects/3/tasks', 'GET /api/v2/notifications', 'GET /api/v2/labels'];
  const packets = Array.from({ length: 8 }, () => mk(over, 'pdot', null));
  const ticker = mk(over, 'mono', null);
  Object.assign(ticker.style, { fontSize: '23px', color: '#b9a68a', whiteSpace: 'nowrap' });
  const tFE = c('real web app') - 0.2;
  const tSW = c('service worker') - 0.2;
  const tAns = c('answers');
  const tNo = c('no backend');
  const tCatch = c('the catch');
  // a naive replay, with the tags from the real runs: the field holds this run's tag, the list shows the recording's
  const mini = mk(over, 'mini', `<div class="in"><span class="tx"></span><span class="caret" style="color:#3b82f6">▍</span></div>
    <div class="row new"><i></i><span>Paint samples ${esc(F.j09.recordedTag)}</span></div>
    <div class="row"><i></i>Book electrician</div><div class="row"><i></i>Order tiles</div><div class="row"><i></i>Choose worktop</div>`);
  const miniTx = mini.querySelector('.tx');
  const newRow = mini.querySelector('.row.new');
  const mTitle = mk(over, 'title', null);
  const mtw = words(mTitle, 'A naive replay *lies.*');
  const note1 = mk(over, 'chip red', '← from the recording');
  const note2 = mk(over, 'chip', `you typed: Paint samples ${esc(F.j09.tag)}`);
  const law1 = mk(over, 'title', null);
  const l1 = words(law1, 'A recording never *proves* a change.');
  const law2 = mk(over, 'huge', null);
  const l2 = words(law2, '*Kane* *CLI* *does.*');
  const uline = svgEl(svg, 'path', { d: 'M700 690 Q 960 712 1220 688', stroke: '#ffd36b', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' });
  const tAdd = c('add a task');
  const tShow = c('shows you');
  const tRec = c('from the recording');
  const tNot = c('not yours');
  const tSo = c('so amber never');
  const tKane = c('kane has to');
  return (t) => {
    const outD = P(t, tCatch, 0.8, E.inOut); // the diagram leaves
    tw(t, start + 0.15, { out: tCatch - 0.1 });
    put(title, { x: 960, y: 150, o: 1 });
    const dy = -60 * outD;
    const dO = 1 - outD;
    // the browser frame draws itself
    const bp = P(t, c('preserve') - 0.3, 1.4, E.inOut);
    draw(browser, bp);
    browser.setAttribute('fill', `rgba(40,26,12,${(0.35 * bp).toFixed(3)})`);
    browser.style.opacity = String(dO);
    put(bLabel, { x: 124, y: 352 + dy, o: P(t, c('preserve') + 0.6, 0.5) * dO });
    put(fe, { x: 380, y: 560 + dy + 30 * (1 - P(t, tFE, 0.7, E.expo)), o: P(t, tFE, 0.5) * dO, s: 0.9 + 0.1 * P(t, tFE, 0.7, E.back) });
    put(sw, { x: 950, y: 560 + dy, o: P(t, tSW, 0.4) * dO, s: 0.6 + 0.4 * P(t, tSW, 0.7, E.back) });
    const serverIn = P(t, c('preserve'), 0.8, E.expo);
    const dead = P(t, tNo, 0.6, E.out);
    put(server, { x: 1650, y: 560 + dy + 50 * dead, o: serverIn * (1 - 0.6 * dead) * dO, s: 0.92 + 0.08 * serverIn });
    server.style.filter = dead > 0.01 ? `grayscale(${dead}) blur(${(dead * 1.5 * dO).toFixed(2)}px)` : '';
    put(serverOff, { x: 0, y: 0, s: 0.4 + 0.6 * P(t, tNo, 0.4, E.back), o: P(t, tNo, 0.2), c: false });
    serverOff.style.position = 'absolute';
    serverOff.style.left = 'auto';
    serverOff.style.top = '-22px';
    serverOff.style.right = '-22px';
    linkFar.style.opacity = String(serverIn * (1 - dead) * dO * 0.9);
    linkFar.style.strokeDashoffset = String(-t * 40);
    draw(strike, P(t, tNo + 0.1, 0.35, E.out) * dO);
    if (P(t, tNo + 0.1, 0.35) <= 0 || dO <= 0) strike.style.opacity = '0';
    S.red += 0.5 * bump(t, tNo, tNo + 0.6, 0.2, 1);
    // API calls: to the server and back, until the Service Worker answers them in the browser
    packets.forEach((el, i) => {
      const period = 1.8;
      const ph = (((t - start) / period + i / packets.length) % 1 + 1) % 1;
      const launched = t - ph * period;
      const viaSW = launched >= tAns - 0.3;
      const farX = viaSW ? 770 : 1460;
      const go = clamp(ph / 0.46);
      const back = clamp((ph - 0.54) / 0.46);
      const x = ph < 0.5 ? mix(590, farX, E.inOut(go)) : mix(farX, 590, E.inOut(back));
      const y = 560 + dy + (ph < 0.5 ? -26 : 26);
      const vis = t >= tFE + 0.4 && (viaSW || launched < tNo - 0.6) ? 1 : 0;
      el.className = ph < 0.5 ? 'pdot' : 'pdot back';
      put(el, { x, y, s: 1, o: vis * dO * clamp(Math.min(ph, 1 - ph) * 14) });
    });
    // one call at a time, and who answered it
    const k = Math.floor((t - start) / 0.9);
    const viaSW = t >= tAns - 0.1;
    ticker.innerHTML = `<span style="color:#9fc3ff">${esc(paths[((k % paths.length) + paths.length) % paths.length])}</span>  →  200 · answered by ${viaSW ? '<span style="color:#ffd36b">the Service Worker, in the browser</span>' : 'the server'}`;
    put(ticker, { x: 665, y: 810 + dy, o: P(t, tFE + 0.4, 0.5) * dO });
    // the naive replay
    const mIn = P(t, tCatch + 0.3, 0.9, E.expo);
    const mOut = P(t, tSo - 0.2, 0.6, E.inOut);
    mtw(t, tCatch + 0.15, { out: tSo - 0.3 });
    put(mTitle, { x: 960, y: 190, o: 1 });
    put(mini, { x: 960, y: 590 + 80 * (1 - mIn) - 40 * mOut, s: 1.12 + 0.06 * mIn, rx: 18 * (1 - mIn), o: mIn * (1 - mOut) });
    const typedTag = `Paint samples ${F.j09.tag}`;
    const tn = Math.round(clamp((t - (tCatch + 1.3)) / (tAdd + 0.3 - (tCatch + 1.3))) * typedTag.length);
    miniTx.textContent = t < tShow ? typedTag.slice(0, tn) : '';
    const rowIn = P(t, tShow, 0.5, E.expo);
    newRow.style.maxHeight = `${(rowIn * 56).toFixed(1)}px`;
    newRow.style.overflow = 'hidden';
    newRow.style.opacity = String(rowIn);
    newRow.style.background = `rgba(255,45,70,${(0.14 * P(t, tRec, 0.3)).toFixed(3)})`;
    put(note1, { x: 1600, y: 545, o: P(t, tRec, 0.3) * (1 - mOut), s: 0.8 + 0.2 * P(t, tRec, 0.45, E.back) });
    put(note2, { x: 960, y: 900 - 10 * P(t, tNot, 0.4), o: P(t, tNot, 0.3) * (1 - mOut) });
    // the rule
    l1(t, tSo + 0.05, { st: 0.07, out: end + 1 });
    put(law1, { x: 960, y: 420, o: 1 });
    l2(t, tKane - 0.05, { st: 0.12 });
    put(law2, { x: 960, y: 600, o: 1 });
    draw(uline, P(t, tKane + 0.4, 0.7, E.inOut));
    S.gold += 0.5 * bump(t, tKane, end, 0.4, 0.6);
  };
});

// == s03: capture: Kane walks 15 journeys on the real server; the proxy keeps the API; tests frozen by hash ====
scene('s03-capture', ({ over, c, start, end }) => {
  const kick = mk(over, 'kicker', 'Stage 1 · <b>Kane CLI</b> on the real server');
  const title = mk(over, 'title', null);
  const tw = words(title, '15 plain-English journeys, *walked* *by* *Kane*');
  const grid = mk(over, 'layer', null, { c: false });
  grid.style.inset = '0';
  const cards = F.capture.slice(0, 15).map((cap, i) => {
    const el = mk(grid, 'shot', `<img src="${cap.shot}"><div class="cap"><b>${cap.short}</b> · ${esc(cap.title)}</div><div class="ring"></div>`);
    return { el, ring: el.querySelector('.ring'), col: i % 5, row: Math.floor(i / 5) };
  });
  const pops = [
    ['sign in', [0]],
    ['browse', [1, 2, 3, 6]],
    ['kanban', [4, 5]],
    ['search', [7]],
    ['add', [8, 13]],
    ['rename', [10, 9]],
    ['describe', [11]],
    ['delete', [12]],
    ['comment', [14]],
  ].map(([w, ids]) => [c(w), ids]);
  // the recording proxy's log, scrolling
  const log = mk(over, 'log', '<div class="head"><b></b>recording proxy · every API exchange · scrubbed</div><div class="rows"></div>');
  log.style.width = '860px';
  const rowsEl = log.querySelector('.rows');
  const rows = F.exchanges.map((x) => {
    const el = mk(rowsEl, 'lrow', `<span class="m">${x.m}</span><span>${esc(x.p)}</span><span class="s">${x.s}</span>${x.note ? `<span class="note">${esc(x.note)}</span>` : ''}`, { c: false });
    el.style.left = '26px';
    return { el, note: el.querySelector('.note') };
  });
  const kLogin = F.exchanges.findIndex((x, i) => i > 12 && x.note.startsWith('password'));
  // the lock file
  const lockP = mk(over, 'log', '<div class="head"><b style="background:#ffd36b;box-shadow:0 0 14px #ffd36b"></b>flows/flows.lock.json · frozen by SHA-256</div><div class="rows"></div>');
  lockP.style.width = '860px';
  const lockRows = F.lockRows.slice(0, 15).map((r, i) => {
    const el = mk(lockP.querySelector('.rows'), 'lock', `<span class="pad"><svg width="22" height="26" viewBox="0 0 22 26"><path class="sh" d="M6 12 V8 a5 5 0 0 1 10 0 V12" fill="none" stroke="#ffd36b" stroke-width="2.6"/><rect x="2" y="12" width="18" height="13" rx="3" fill="#ffd36b"/></svg></span><span>${esc(r.file)}</span><span class="sha">${r.sha}…</span>`, { c: false });
    return { el, sh: el.querySelector('.sh'), sha: el.querySelector('.sha'), real: r.sha };
  });
  const veto = mk(over, 'chip red', '✕ amber freeze --check: a frozen flow changed');
  // j14: the wording Kane caught
  const j14img = mk(over, 'shot', `<img src="${F.j14.shot}"><div class="cap"><b>j14</b> · Create a project</div>`);
  const j14card = mk(over, 'card', `<div class="label">j14 · as first written</div><div class="quote" style="font-size:30px">${esc(F.j14.before).replace('listed next to', '<span class="hit" style="position:relative;display:inline-block">listed next to</span>')}</div>
    <div class="label" style="margin-top:26px">Kane read it as</div><div class="mono" style="font-size:24px;color:#ff6b7d">“listed next to” = “directly adjacent”</div>
    <div class="label" style="margin-top:26px">Reworded · ${F.j14.commit} · before anything else</div><div class="quote" style="font-size:30px;color:#ffd36b">${esc(F.j14.after)}</div>`);
  j14card.style.width = '880px';
  j14card.style.background = 'rgba(30,20,11,0.92)';
  const kids = [...j14card.children];
  const [oldQ, newLabel, newQ] = [kids[1], kids[4], kids[5]];
  const strikeEl = mk(j14card.querySelector('.hit'), 'strike', null, { c: false });
  strikeEl.style.top = '54%';
  const tRec = c('a recording proxy');
  const tSave = c('kane saves');
  const tFreeze = c('freezes');
  const tNobody = c('so nobody');
  const tMistake = c('kane even caught');
  const tWrong = c('worded wrongly');
  const tFixed = c('so it was fixed');
  return (t) => {
    put(kick, { x: 960, y: 70, o: P(t, start, 0.6) * (1 - P(t, tMistake - 0.3, 0.5)) });
    tw(t, start + 0.1, { st: 0.06, out: tMistake - 0.4 });
    put(title, { x: 960, y: 150, o: 1 });
    // the grid: flies in from depth, then makes room for the proxy log
    const side = P(t, tRec - 0.5, 0.9, E.inOut);
    const gone = P(t, tMistake - 0.4, 0.7, E.inOut);
    grid.style.opacity = String(1 - gone);
    grid.style.transformOrigin = '960px 560px';
    grid.style.transform = `translate(${mix(0, -460, side).toFixed(2)}px, ${mix(0, 40, side).toFixed(2)}px) scale(${mix(1, 0.5, side).toFixed(4)})`;
    for (const [i, cd] of cards.entries()) {
      const tIn = start + 0.25 + (cd.col + cd.row) * 0.08;
      const p = P(t, tIn, 1.1, E.expo);
      let lift = 0;
      for (const [tc, ids] of pops) if (ids.includes(i)) lift = Math.max(lift, bump(t, tc - 0.05, tc + 0.75, 0.22, 0.5));
      const listing = bump(t, pops[0][0] - 0.2, pops.at(-1)[0] + 0.9, 0.3, 0.5);
      const x = 960 + (cd.col - 2) * 344;
      const y = 380 + cd.row * 206;
      put(cd.el, { x, y: y - 14 * lift, z: -900 * (1 - p) + 80 * lift, rx: 40 * (1 - p), s: 1 + 0.1 * lift, o: p * (1 - 0.35 * listing * (1 - lift)) });
      cd.ring.style.opacity = lift.toFixed(3);
    }
    // the proxy log scrolls; a scrubbed exchange lights up as it passes the middle
    const logIn = P(t, tRec + 0.25, 0.8, E.expo);
    const logOut = P(t, tSave - 0.3, 0.6, E.inOut);
    put(log, { x: 1430, y: 560, s: 0.94 + 0.06 * logIn, ry: -14 * (1 - logIn), o: logIn * (1 - logOut) });
    const offset = 46 * kLogin - 270 + (t - c('scrubbed')) * 62;
    for (const [k, r] of rows.entries()) {
      const y = 14 + k * 46 - offset;
      r.el.style.top = `${y.toFixed(1)}px`;
      r.el.style.visibility = y < -50 || y > 640 ? 'hidden' : 'visible';
      if (r.note) {
        const mid = clamp(1 - Math.abs(y - 270) / 140);
        r.note.style.boxShadow = `0 0 ${(30 * mid).toFixed(1)}px rgba(255,200,80,${(0.8 * mid).toFixed(2)})`;
        r.note.style.background = `rgba(255,211,107,${(0.12 + 0.3 * mid).toFixed(3)})`;
      }
    }
    // the lock file: each test is frozen, a padlock snaps shut
    const lockIn = P(t, tSave - 0.2, 0.8, E.expo);
    put(lockP, { x: 1430, y: 560, s: 0.94 + 0.06 * lockIn, ry: 14 * (1 - lockIn), o: lockIn * (1 - gone) });
    const shake = bump(t, tNobody + 0.3, ce('make it pass'), 0.1, 0.3);
    lockRows.forEach((r, i) => {
      const p = P(t, tSave + i * 0.05, 0.5, E.out);
      const shut = P(t, tFreeze + i * 0.055, 0.3, E.back);
      r.sh.setAttribute('transform', `translate(0 ${(-5 * (1 - shut)).toFixed(2)})`);
      const tampered = i === 14 ? shake : 0;
      r.sha.textContent = tampered > 0.5 ? '9f31c07ab2d4e815…' : `${r.real}…`;
      r.sha.style.color = tampered > 0.5 ? '#ff5d72' : shut > 0.99 && t - (tFreeze + i * 0.055) < 0.6 ? '#ffd36b' : '';
      put(r.el, { x: 30 + 6 * Math.sin(t * 40) * tampered, y: 14 + i * 37 - 14 + 14 * p, o: p, c: false });
    });
    put(veto, { x: 1430, y: 905, o: shake, s: 0.9 + 0.1 * shake });
    S.red += 0.35 * shake;
    // j14
    const jIn = P(t, tMistake - 0.1, 1.0, E.expo);
    put(j14img, { x: 430, y: 520, s: mix(0.6, 1.95, jIn), rx: 0, ry: 12 * (1 - jIn), o: jIn });
    put(j14card, { x: 1390, y: 520, s: 0.96 + 0.04 * jIn, o: P(t, tMistake + 0.3, 0.7) });
    strikeEl.style.width = '100%';
    strikeEl.style.transform = `scaleX(${P(t, tWrong, 0.5, E.inOut).toFixed(3)})`;
    oldQ.style.opacity = String(1 - 0.45 * P(t, tWrong + 0.5, 0.4));
    kids[2].style.opacity = kids[3].style.opacity = String(P(t, tWrong + 0.2, 0.4));
    newLabel.style.opacity = newQ.style.opacity = String(P(t, tFixed, 0.5));
    newQ.style.transform = `translateY(${(14 * (1 - P(t, tFixed, 0.6, E.expo))).toFixed(1)}px)`;
  };

  function ce(p) {
    return cueIn('s03-capture', p, 0, true);
  }
});

// == s04: the server goes off; the replay-only capsule: 8 reads pass, 7 writes fail ==========================
scene('s04-baseline', ({ over, under, c, start, end }) => {
  const title = mk(over, 'title', null);
  const tw = words(title, 'Then the server goes *off.*');
  const ring = mk(over, 'power', `<svg width="220" height="220" viewBox="0 0 220 220"><circle cx="110" cy="110" r="96" fill="rgba(30,20,10,0.8)" stroke-width="6" class="pr"/><path d="M110 58 V110" stroke-width="12" stroke-linecap="round" class="pp"/><path d="M78 76 A50 50 0 1 0 142 76" fill="none" stroke-width="12" stroke-linecap="round" class="pp"/></svg>`);
  const ringC = ring.querySelector('.pr');
  const pps = [...ring.querySelectorAll('.pp')];
  const label = mk(over, 'kicker', 'Vikunja API server');
  const state = mk(over, 'pill off', '<b></b>off');
  state.style.fontSize = '24px';
  state.style.height = '48px';
  const ck1 = mk(over, 'check', `<span class="tick">✓</span><span>port ${F.serverOff.port}</span><span class="k">· ${F.serverOff.portOpen ? 'open' : 'closed'}</span>`, { c: false });
  const ck2 = mk(over, 'check', `<span class="tick">✓</span><span>vikunja process</span><span class="k">· ${F.serverOff.processes ? 'running' : 'none'}</span>`, { c: false });
  const ck3 = mk(over, 'check', '<span class="k">checked</span><span class="pill" style="background:rgba(255,211,107,.12);color:#ffd36b;border:1px solid rgba(255,211,107,.5)">before ✓</span><span class="pill" style="background:rgba(255,211,107,.12);color:#ffd36b;border:1px solid rgba(255,211,107,.5)">after ✓</span><span class="k">every Kane run</span>', { c: false });
  const passN = mk(over, 'card', '<div class="big-n" style="color:#ffd36b">0</div><div class="label" style="margin:10px 0 0">read journeys pass</div>');
  const failN = mk(over, 'card', '<div class="big-n" style="color:#ff4d63">0</div><div class="label" style="margin:10px 0 0">write journeys fail</div>');
  for (const el of [passN, failN]) {
    el.style.width = '300px';
    el.style.textAlign = 'center';
  }
  const tOff = c('goes off') + 0.15;
  const tAgainst = c('against a capsule');
  const tPass = c('kane passes');
  const tFail = c('fails');
  const k0 = { x: 790, y: 545, s: 0.98 };
  BK.push(
    ...chain([
      [tAgainst - 0.3, { x: 790, y: 1350, s: 0.9, rx: 35, ry: 0, o: 0, b: 0 }],
      [tAgainst - 0.29, { o: 1 }, E.lin],
      [tAgainst + 0.8, { y: 545, s: 0.98, rx: 0 }, E.expo],
      [end - 1.0, { s: 1.0 }, E.sine],
      // the camera dives into j09's tile, which becomes Kane's screenshot of it
      [end + 0.35, { ...diveInto('j09-add-task', 7.5), b: 3 }, E.in],
      [end + 0.36, { o: 0 }, E.lin],
    ]),
  );
  function diveInto(flow, s) {
    const tl = TILE[flow];
    return { x: 960 - tl.dx * s, y: 500 - tl.dy * s, s };
  }
  CK.push(
    ...chain([
      [tAgainst + 0.2, { x: 790, y: 118, s: 0.9, o: 0 }],
      [tAgainst + 0.8, { y: 108, s: 1, o: 1 }, E.out],
      [end - 0.6, { o: 1 }],
      [end - 0.2, { o: 0 }],
    ]),
  );
  BSEG.push([start - 0.5, start - 0.5, F.marks.firstCapsuleRun, F.marks.firstCapsuleRun]);
  const passEnd = F.marks.firstCapsuleRun + 1 + 8;
  BSEG.push([tPass, ce('read journeys') + 0.3, F.marks.firstCapsuleRun, passEnd, E.lin]);
  BSEG.push([tFail, ce('change data') + 0.1, passEnd, F.marks.firstFix, E.lin]);
  const counts = (t) => {
    const idx = blockIndexAt(t);
    let pass = 0;
    let fail = 0;
    const last = {};
    for (const e of EV.slice(F.marks.firstCapsuleRun, idx)) if (e.kind === 'verdict') last[e.flow] = e.verdict;
    for (const v of Object.values(last)) v === 'PASS' ? pass++ : fail++;
    return { pass, fail };
  };
  let lastFail = 0;
  let failAt = -9;
  function ce(p) {
    return cueIn('s04-baseline', p, 0, true);
  }
  return (t) => {
    const top = P(t, tAgainst - 0.4, 0.8, E.inOut); // the power panel leaves for the block
    tw(t, start + 0.1, { out: tAgainst - 0.5 });
    put(title, { x: 960, y: 150, o: 1 });
    const on = 1 - P(t, tOff, 0.35, E.out);
    const col = on > 0.5 ? '#ffd36b' : '#ff2d46';
    ringC.setAttribute('stroke', col);
    for (const p of pps) p.setAttribute('stroke', col);
    ring.style.filter = `drop-shadow(0 0 ${(10 + 40 * on).toFixed(1)}px ${on > 0.5 ? 'rgba(255,200,80,.8)' : 'rgba(255,45,70,.6)'})`;
    put(ring, { x: 560, y: 520 - 60 * top, s: (1 + 0.08 * bump(t, tOff, tOff + 0.2, 0.1, 0.4)) * (1 - 0.3 * top), o: P(t, start + 0.1, 0.6) * (1 - top) });
    put(label, { x: 560, y: 680 - 60 * top, o: P(t, start + 0.3, 0.5) * (1 - top) });
    put(state, { x: 560, y: 740 - 60 * top, s: 0.6 + 0.4 * P(t, tOff, 0.45, E.back), o: P(t, tOff, 0.2) * (1 - top) });
    S.red += 0.7 * bump(t, tOff, tOff + 0.5, 0.15, 1.2);
    put(ck1, { x: 820 + 30 * (1 - P(t, c('port'), 0.6, E.expo)), y: 400 - 60 * top, o: P(t, c('port'), 0.4) * (1 - top), c: false });
    put(ck2, { x: 820 + 30 * (1 - P(t, c('process'), 0.6, E.expo)), y: 490 - 60 * top, o: P(t, c('process'), 0.4) * (1 - top), c: false });
    put(ck3, { x: 820 + 30 * (1 - P(t, c('before and after'), 0.6, E.expo)), y: 590 - 60 * top, o: P(t, c('before and after'), 0.4) * (1 - top), c: false });
    // tallies, from the verdicts the block has shown so far
    const n = counts(t);
    if (n.fail > lastFail) failAt = t;
    lastFail = n.fail;
    passN.querySelector('.big-n').textContent = String(n.pass);
    failN.querySelector('.big-n').textContent = String(n.fail);
    const sideIn = P(t, tPass - 0.3, 0.6, E.expo);
    const gone = P(t, end - 0.9, 0.5, E.inOut);
    put(passN, { x: 1640, y: 400, s: 0.9 + 0.1 * sideIn, o: sideIn * (1 - gone) });
    put(failN, { x: 1640, y: 690, s: (0.9 + 0.1 * P(t, tFail - 0.3, 0.6, E.expo)) * (1 + 0.06 * (1 - P(t, failAt, 0.3))), o: P(t, tFail - 0.3, 0.6) * (1 - gone) });
    S.red += 0.45 * (1 - P(t, failAt, 0.5)) * (t >= failAt ? 1 : 0);
  };
});

// == s05: a fresh tag per run; the capsule refuses to fake it; Kane's diagnosis ===============================
function shotWin(parent, { src, url, label, bw = 1280, bh = 720 }) {
  const win = mk(parent, 'win shotwin', `<div class="bar"><i></i><i></i><i></i><span class="url">${esc(url)}</span><span class="label">${esc(label)}</span></div><div class="body" style="width:${bw}px;height:${bh}px"><img src="${src}"><div class="ov" style="position:absolute;inset:0"></div></div>`);
  win.style.width = `${bw}px`;
  const img = win.querySelector('img');
  const ov = win.querySelector('.ov');
  const f = bw / 1920;
  const W = {
    win,
    ov,
    s: f,
    tx: 0,
    ty: 0,
    zoom(cx, cy, z) {
      const s = f * z;
      let tx = bw / 2 - cx * s;
      let ty = bh / 2 - cy * s;
      tx = Math.min(0, Math.max(bw - 1920 * s, tx));
      ty = Math.min(0, Math.max(bh - 1080 * s, ty));
      img.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`;
      Object.assign(W, { s, tx, ty });
    },
    /** Place a box over a region of the screenshot (in its 1920x1080 pixels). */
    box(el, r, pad = 10) {
      el.style.left = `${(W.tx + r.x * W.s - pad).toFixed(1)}px`;
      el.style.top = `${(W.ty + r.y * W.s - pad).toFixed(1)}px`;
      el.style.width = `${(r.w * W.s + 2 * pad).toFixed(1)}px`;
      el.style.height = `${(r.h * W.s + 2 * pad).toFixed(1)}px`;
    },
  };
  W.zoom(960, 540, 1);
  return W;
}

scene(
  's05-tag',
  ({ over, c, start, end }) => {
    const W = shotWin(over, { src: F.j09.shot, url: '127.0.0.1:4790/projects/3/13', label: `Kane CLI · j09 Add a task · capsule, server off` });
    const hlIn = mk(W.ov, 'hl gold', null, { c: false });
    const tagCard = mk(over, 'card', `<div class="label">this run's tag</div><div class="slots mono" style="font:700 64px var(--mono);letter-spacing:.12em;color:#ffd36b"></div><div class="label" style="margin-top:18px">a replay would answer with</div><div class="mono rec" style="font-size:26px;color:#ff6b7d;position:relative;display:inline-block">Paint samples ${esc(F.j09.recordedTag)}</div>`);
    tagCard.style.width = '440px';
    const slots = tagCard.querySelector('.slots');
    const recEl = tagCard.querySelector('.rec');
    const recLbl = tagCard.querySelectorAll('.label')[1];
    const recStrike = mk(recEl, 'strike', null, { c: false });
    recStrike.style.top = '54%';
    recStrike.style.width = '100%';
    const wire = mk(over, 'card', `<div class="label">the capsule's own log · same run</div><div class="wire" style="white-space:normal;font-size:23px">${esc(F.j09.wire)}</div>`);
    wire.style.width = '440px';
    const say = mk(over, 'card', `<div class="label">Kane's diagnosis</div><div class="quote" style="font-size:27px"></div>`);
    say.style.width = '440px';
    const sayQ = say.querySelector('.quote');
    const sw = words(sayQ, `“${F.j09.say}”`);
    const svg = svgEl(over, 'svg', { class: 'over', width: 1920, height: 1080, viewBox: '0 0 1920 1080' });
    const link = svgEl(svg, 'path', { d: '', stroke: '#ffd36b', 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '1' });
    const tTag = c('fresh random tag');
    const tNever = c('so a replayed');
    const tHere = c('here kane typed');
    const tRef = c('the capsule refused');
    const tSay = c("kane's own diagnosis");
    const tag = F.j09.tag;
    const r = rng('tag');
    const noise = Array.from({ length: 400 }, () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(r() * 26)]);
    return (t) => {
      // the window grows out of j09's tile
      const wIn = P(t, start - 0.25, 0.9, E.expo);
      const zIn = P(t, tHere - 0.2, 1.1, E.inOut) * (1 - P(t, tRef + 0.4, 1.0, E.inOut));
      put(W.win, { x: mix(960, 1210, wIn), y: 500, s: mix(0.12, 0.9, wIn) * (1 + 0.02 * P(t, start, 12, E.lin)), o: P(t, start - 0.25, 0.3) });
      W.zoom(mix(960, 1080, zIn), mix(540, 250, zIn), 1 + 1.15 * zIn);
      W.box(hlIn, F.j09.input, 8);
      hlIn.style.opacity = String(P(t, c("this run's tag"), 0.3) * (1 - P(t, tRef + 0.3, 0.4)));
      // a fresh random tag rolls in, letter by letter
      const cin = P(t, start + 0.4, 0.6, E.expo);
      put(tagCard, { x: 300, y: 270, s: 0.94 + 0.06 * cin, o: cin });
      slots.textContent = tag
        .split('')
        .map((ch, i) => (t >= tTag + 0.1 + i * 0.09 ? ch : t < tTag - 0.6 ? '·' : noise[(Math.floor(t * 24) + i * 37) % noise.length]))
        .join('');
      recEl.style.opacity = recLbl.style.opacity = String(P(t, tNever, 0.4));
      recStrike.style.transform = `scaleX(${P(t, ce('never pass') - 0.2, 0.4, E.inOut).toFixed(3)})`;
      // the link from the tag to the field Kane typed it into
      const a = [520, 230];
      const hb = hlIn.getBoundingClientRect();
      const b = [hb.left, hb.top + hb.height / 2];
      link.setAttribute('d', `M${a[0]} ${a[1]} C ${a[0] + 120} ${a[1]}, ${b[0] - 140} ${b[1]}, ${b[0]} ${b[1]}`);
      const lp = P(t, c("this run's tag"), 0.6, E.inOut) * (1 - P(t, tRef + 0.3, 0.4));
      draw(link, lp);
      link.style.opacity = String(lp > 0 ? 1 - P(t, tRef + 0.3, 0.4) : 0);
      const wi = P(t, tRef, 0.6, E.expo);
      put(wire, { x: 300 - 30 * (1 - wi), y: 560, o: wi });
      S.red += 0.4 * bump(t, tRef, tRef + 0.6, 0.15, 1);
      const si = P(t, tSay - 0.15, 0.6, E.expo);
      put(say, { x: 300, y: 800, o: si, s: 0.96 + 0.04 * si });
      sw(t, tSay, { st: 0.07, d: 0.6 });
    };
    function ce(p) {
      return cueIn('s05-tag', p, 0, true);
    }
  },
  { noIn: true },
);

// == s06: the false pass: Kane passed j15, the capsule had refused the comment; AMBER overrules ================
scene('s06-falsepass', ({ over, c, start, end }) => {
  const head = mk(over, 'title', null);
  const hw = words(head, 'One verdict was *wrong.*');
  const W = shotWin(over, { src: F.j15.shot, url: '127.0.0.1:4790/tasks/…', label: 'Kane CLI · j15 Comment on a task · capsule, server off' });
  const hl = mk(W.ov, 'hl', null, { c: false });
  const scan = mk(W.ov, 'scanbar', null, { c: false });
  const found = mk(W.ov, 'chip', '✓ Kane: text found', { c: false });
  found.style.fontSize = '20px';
  const draftChip = mk(over, 'chip red', 'the unsent draft, restored into the editor');
  const pass = mk(over, 'stamp pass', 'passed<small>Kane CLI</small>');
  const fail = mk(over, 'stamp fail', 'fail<small>disputed by AMBER</small>');
  const svg = svgEl(over, 'svg', { class: 'over', width: 1920, height: 1080, viewBox: '0 0 1920 1080' });
  const crack = svgEl(svg, 'path', { d: 'M1290 255 L1330 290 L1318 318 L1366 344 L1352 372 L1410 398 L1398 428', stroke: '#ff2d46', 'stroke-width': 6, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', filter: 'drop-shadow(0 0 8px #ff2d46)' });
  const wire = mk(over, 'card', `<div class="label">the capsule's own log · same run</div><div class="wire" style="white-space:normal;font-size:23px">${esc(F.j15.wire)}</div>`);
  wire.style.width = '440px';
  const rule = mk(over, 'huge', null);
  rule.style.fontSize = '96px';
  const rw = words(rule, 'A pass the wire contradicts');
  const rule2 = mk(over, 'huge', null);
  rule2.style.fontSize = '96px';
  const rw2 = words(rule2, '*is* *a* *fail.*');
  const tPassed = c('kane passed');
  const tBut = c('but the capsule');
  const tReload = c('after the reload');
  const tDraft = c('unsent draft');
  const tCheck = c("kane's check");
  const tLog = c("amber's own log");
  const tOver = c('overruled kane');
  const tRule = c('a pass the wire');
  return (t) => {
    const hUp = P(t, tPassed - 0.5, 0.8, E.inOut);
    hw(t, start + 0.05, { st: 0.08, out: tPassed - 0.6 });
    put(head, { x: 960, y: 500, s: 1.25, o: 1 });
    const dim = P(t, tRule - 0.2, 0.7, E.inOut);
    const wIn = P(t, tPassed - 0.45, 1.0, E.expo);
    const z = P(t, tReload, 1.0, E.inOut) * (1 - P(t, tLog - 0.1, 0.9, E.inOut));
    put(W.win, { x: 1210 + 200 * (1 - wIn), y: 500, ry: -18 * (1 - wIn), s: 0.9 * (1 - 0.06 * dim), o: wIn * (1 - 0.8 * dim), b: 5 * dim });
    const d = F.j15.draft;
    W.zoom(mix(960, d.x + d.w / 2, z), mix(540, d.y + d.h / 2 - 40, z), 1 + 0.7 * z);
    W.box(hl, d, 6);
    const hp = P(t, tDraft, 0.5, E.out);
    hl.style.opacity = String(hp * (1 - P(t, tLog, 0.5)));
    hl.style.clipPath = `inset(0 ${((1 - hp) * 100).toFixed(1)}% 0 0)`;
    // Kane's check sweeps the editor and finds the text
    const sp = P(t, tCheck, 0.9, E.inOut);
    const hb = { left: parseFloat(hl.style.left), top: parseFloat(hl.style.top), w: parseFloat(hl.style.width), h: parseFloat(hl.style.height) };
    scan.style.left = `${(hb.left + sp * hb.w).toFixed(1)}px`;
    scan.style.top = `${hb.top.toFixed(1)}px`;
    scan.style.height = `${hb.h.toFixed(1)}px`;
    scan.style.opacity = String(bump(t, tCheck, tCheck + 0.8, 0.1, 0.2));
    put(found, { x: hb.left + hb.w - 230, y: hb.top - 60, o: P(t, tCheck + 0.7, 0.3) * (1 - P(t, tLog, 0.4)), c: false });
    put(draftChip, { x: 1210, y: 950 - 940 + 90, o: P(t, tDraft + 0.2, 0.4) * (1 - P(t, tLog, 0.4)) });
    // Kane's stamp, then AMBER's
    const sp1 = P(t, tPassed + 0.25, 0.4, E.back);
    const fall = P(t, tOver + 0.25, 0.6, E.in);
    put(pass, { x: 1350, y: 340 + 120 * fall, r: -9 + 10 * fall, s: mix(2.2, 1, sp1), o: P(t, tPassed + 0.25, 0.12) * (1 - fall) * (1 - z) * (1 - dim) });
    draw(crack, P(t, tOver - 0.1, 0.35, E.out) * (1 - fall));
    if (t < tOver - 0.1 || fall >= 1) crack.style.opacity = '0';
    const sp2 = P(t, tOver + 0.45, 0.4, E.back);
    put(fail, { x: 1350, y: 340, r: -7, s: mix(2.2, 1, sp2), o: P(t, tOver + 0.45, 0.12) * (1 - dim) });
    S.red += 0.6 * bump(t, tOver + 0.45, tOver + 1.0, 0.1, 1.2);
    const wi = P(t, tBut, 0.6, E.expo);
    put(wire, { x: 300 - 30 * (1 - wi), y: 520, s: 1 + 0.05 * bump(t, tLog, tLog + 0.8, 0.2, 0.5), o: wi * (1 - dim) });
    wire.style.boxShadow = `0 0 ${(60 * bump(t, tLog, tOver + 0.6, 0.3, 0.5)).toFixed(1)}px rgba(255,45,70,0.55)`;
    rw(t, tRule, { st: 0.07 });
    put(rule, { x: 960, y: 450, o: 1 });
    rw2(t, ce('contradicts') + 0.15, { st: 0.1 });
    put(rule2, { x: 960, y: 580, o: 1 });
  };
  function ce(p) {
    return cueIn('s06-falsepass', p, 0, true);
  }
});

// == s07: the loop: Kane's failure brief -> Claude Code repairs, one commit -> Kane proves it, server off ======
scene('s07-loop', ({ over, under, c, start, end }) => {
  const kick = mk(over, 'kicker', 'The loop · <b>Claude Code</b> repairs · <b>Kane CLI</b> proves');
  const CX = 470;
  const CY = 470;
  const R = 230;
  const ang = [-90, 30, 150]; // Claude Code, Kane proves, Kane's brief
  const at = (a) => [CX + R * Math.cos((a * Math.PI) / 180), CY + R * Math.sin((a * Math.PI) / 180)];
  const svg = svgEl(under, 'svg', { class: 'over', width: 1920, height: 1080, viewBox: '0 0 1920 1080' });
  const arcs = [0, 1, 2].map((i) => {
    const a0 = ang[i] + 24;
    const a1 = ang[(i + 1) % 3] - 24 + (i === 2 ? 360 : 0);
    const [x0, y0] = at(a0);
    const [x1, y1] = at(a1);
    return svgEl(svg, 'path', { d: `M${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`, stroke: 'rgba(255,196,110,0.6)', 'stroke-width': 3, fill: 'none' });
  });
  const comet = svgEl(svg, 'circle', { r: 11, fill: '#fff4cf', filter: 'drop-shadow(0 0 10px #ffd36b) drop-shadow(0 0 22px #f2a900)' });
  const nodes = [
    ['Claude Code', 'repairs the capsule · one commit', '#9fc3ff'],
    ['Kane CLI proves it', 'replay · server off', '#ffd36b'],
    ["Kane's failure brief", 'brief.md · the next fix', '#ff6b7d'],
  ].map(([a, b, col]) => {
    const el = mk(over, 'lnode', `<div class="nt" style="color:${col}">${a}</div><div class="ns">${b}</div>`, { c: false });
    el.style.borderColor = col;
    return el;
  });
  const commits = F.commits.map((cm) => mk(over, 'commit', `<span class="sha">${cm.sha}</span><span class="what">${esc(cm.what)}</span><span class="ok">→ ${cm.flow} ✓</span>`, { c: false }));
  const tCC = c('claude code');
  const tBrief = c("kane's failure brief");
  const tProve = c('proves it');
  const tA = c('seven repairs') - 0.35;
  const tB = ce('already passed') + 0.5;
  const fixes = [];
  EV.forEach((e, i) => e.kind === 'fix' && i < F.marks.round1End && fixes.push(i));
  const slice = (tB - tA) / fixes.length;
  // each repair: the commit, then Kane proves it (a third of the way round), then the re-checks
  fixes.forEach((fi, k) => {
    const t0 = tA + k * slice;
    const next = fixes[k + 1] ?? F.marks.finalProof;
    const proof = EV.findIndex((e, i) => i > fi && e.kind === 'verdict' && e.target === 'capsule') + 1;
    BSEG.push([t0, t0 + slice / 3, fi, proof, E.lin]);
    BSEG.push([t0 + slice / 3, t0 + slice, proof, next, E.lin]);
  });
  BSEG.push([start - 0.6, start - 0.6, F.marks.firstFix, F.marks.firstFix]);
  BSEG.sort((a, b) => a[0] - b[0]);
  BK.push(
    ...chain([
      [start - 0.5, { x: 1380, y: 1300, s: 0.72, rx: 30, ry: 0, o: 0, b: 0 }],
      [start - 0.49, { o: 1 }, E.lin],
      [start + 0.7, { y: 385, rx: 0 }, E.expo],
      [end - 0.3, { s: 0.74 }, E.sine],
    ]),
  );
  CK.push(
    ...chain([
      [start + 0.2, { x: 1380, y: 1000, s: 0.75, o: 0 }],
      [start + 0.9, { y: 108, s: 0.85, o: 1 }, E.expo],
    ]),
  );
  return (t) => {
    put(kick, { x: 470, y: 120, o: P(t, start + 0.2, 0.6) });
    const nodeT = [tCC, tProve, tBrief];
    nodes.forEach((el, i) => {
      const [x, y] = at(ang[i]);
      const p = P(t, nodeT[i] - 0.1, 0.6, E.back);
      const lit = i === 0 ? hit(t, 0) : i === 1 ? hit(t, 1 / 3) : hit(t, 2 / 3);
      put(el, { x, y, s: (0.6 + 0.4 * p) * (1 + 0.07 * lit), o: P(t, nodeT[i] - 0.1, 0.3), c: false });
      el.style.boxShadow = `0 0 ${(50 * lit).toFixed(1)}px ${el.style.borderColor}`;
    });
    arcs.forEach((a, i) => draw(a, P(t, Math.max(nodeT[i], nodeT[(i + 1) % 3]) + 0.3, 0.7, E.inOut)));
    const loops = loopsAt(t);
    const th = ((-90 + 360 * loops) * Math.PI) / 180;
    comet.setAttribute('cx', (CX + R * Math.cos(th)).toFixed(2));
    comet.setAttribute('cy', (CY + R * Math.sin(th)).toFixed(2));
    comet.style.opacity = String(P(t, tProve + 0.6, 0.4));
    commits.forEach((el, k) => {
      const p = P(t, tA + k * slice, 0.45, E.expo);
      put(el, { x: 990 + 40 * (1 - p), y: 640 + k * 42, o: p, c: false });
    });
  };
  function loopsAt(t) {
    if (t < tA) return (t - tA) / 3.2;
    return Math.min(fixes.length, (t - tA) / slice) + Math.max(0, (t - tB) / 3.2);
  }
  /** 1 when the comet is at a node (at fraction f of a loop), during the repairs. */
  function hit(t, f) {
    if (t < tA - 0.2 || t > tB + 0.3) return 0;
    const l = loopsAt(t) - f;
    const d = Math.abs(l - Math.round(l));
    return clamp(1 - d / 0.12);
  }
  function ce(p) {
    return cueIn('s07-loop', p, 0, true);
  }
});

// == s08: 15 of 15; then Kane re-authors every journey from plain English: 15 of 15 again ====================
scene('s08-heal', ({ over, under, c, start, end }) => {
  const burst = mk(under, 'glow', null);
  burst.style.width = burst.style.height = '900px';
  burst.style.background = 'radial-gradient(closest-side, rgba(255,215,120,0.55), rgba(255,180,60,0.15) 60%, rgba(255,180,60,0) 100%)';
  const chip1 = mk(over, 'chip', 'final proof · re-authored from plain English · no recorded steps');
  const chip2 = mk(over, 'stamp pass', '15 / 15 again<small>Kane CLI · capsule · server off</small>');
  chip2.style.color = '#ffd36b';
  chip2.style.borderColor = '#ffd36b';
  chip2.style.background = 'rgba(60,40,5,0.55)';
  const t15 = c('fifteen of fifteen');
  const tRe = c('kane reauthored');
  const tAgain = c('fifteen of fifteen again');
  BSEG.push([tRe, tAgain - 0.15, F.marks.finalProof, F.marks.hookBlocked, E.lin]);
  BK.push(
    ...chain([
      [start - 0.3, { x: 1380, y: 385, s: 0.74, o: 1 }],
      [start + 0.6, { x: 960, y: 520, s: 1.12 }, E.inOut],
      [end - 0.4, { s: 1.16 }, E.sine],
    ]),
  );
  CK.push(
    ...chain([
      [start - 0.3, { x: 1380, y: 108, s: 0.85, o: 1 }],
      [start + 0.6, { x: 960, y: 100, s: 1.05 }, E.inOut],
    ]),
  );
  return (t) => {
    const b1 = P(t, t15 - 0.1, 1.4, E.out);
    put(burst, { x: 960, y: 520, s: 0.3 + 2.4 * b1, o: (1 - b1) * 0.9 });
    S.gold += 0.8 * bump(t, t15, t15 + 0.6, 0.2, 1.4) + 0.6 * bump(t, tAgain, end, 0.2, 0.6);
    const ci = P(t, tRe - 0.2, 0.6, E.expo);
    put(chip1, { x: 960, y: 900 - 20 * (1 - ci), o: ci * (1 - P(t, tAgain - 0.2, 0.3)) });
    const si = P(t, tAgain, 0.4, E.back);
    put(chip2, { x: 1560, y: 860, r: -6, s: mix(2, 1, si), o: P(t, tAgain, 0.12) });
  };
});

// == s09: the Stop hook: Kane gates the agent; blocked on a deliberate regression, then allowed ===============
scene('s09-hook', ({ over, c, start, end }) => {
  const kick = mk(over, 'kicker', 'Kane CLI gates the coding agent');
  const term = mk(over, 'term', `<div class="tb"><i></i><i></i><i></i><span style="margin-left:14px">claude code · amber/</span></div><div class="tx"></div>`, { c: false });
  term.style.width = '1250px';
  term.style.height = '760px';
  const tx = term.querySelector('.tx');
  tx.style.whiteSpace = 'pre-wrap';
  tx.style.fontSize = '22px';
  const dots = mk(term, 'dots', F.journeys.slice(0, 15).map((j) => `<div class="dot">${j.short.slice(1)}</div>`).join(''), { c: false });
  const dotEls = [...dots.children];
  const banner = mk(term, 'bar-banner red', 'BLOCKED <small>the agent may not stop: j15 passed before, fails now</small>', { c: false });
  const msgEl = mk(term, 'tx', null, { c: false });
  Object.assign(msgEl.style, { width: '1190px', whiteSpace: 'pre-wrap', fontSize: '21px', padding: '0' });
  const banner2 = mk(term, 'bar-banner gold', 'ALLOWED <small>15 of 15 pass. The agent may stop.</small>', { c: false });
  const record = mk(over, 'card', `<div class="label">runs/gate.ndjson · every Stop-hook decision</div>${F.gate.map((g) => `<div class="mono" style="font-size:21px;line-height:1.8"><span style="color:#7a6a54">${g.at}</span>  <span style="color:${g.outcome === 'blocked' ? '#ff6b7d' : '#ffd36b'}">${g.outcome.padEnd(8)}</span> ${esc(g.regressions.join(', ') || '—')}  <span style="color:#7a6a54">${esc(g.runId)}</span></div>`).join('')}`);
  record.style.width = '980px';
  const g0 = F.gate[0];
  const L = [
    { at: c('stop hook') - 0.2, segs: [['p', '# .claude/settings.json → hooks.Stop\n'], ['b', F.hookCommand], ['', '\n']] },
    { at: c('will not let'), segs: [['p', '# blocks the agent while a journey that passed before is failing\n\n']] },
    { at: c('broke the comment repair'), segs: [['r', '✎ a deliberate regression: the comment repair, broken on purpose\n\n']] },
    { at: c('the hook had kane'), segs: [['', 'agent stops → Stop hook → '], ['g', 'Kane replays all 15 journeys'], ['p', `  ${g0.runId}`], ['', '\n']] },
  ];
  const tBlocked = c('blocked the agent');
  const tBrief = c('the brief to read');
  const tFix = c('once kane proved');
  const tGo = c('let it go');
  const tRec = c('both decisions');
  const msg = g0.lines[1].replace(/^- /, '');
  // the hook's two runs, on the block in the corner and on the dots
  BSEG.push([c('the hook had kane'), c('kane was fooled') + 0.2, F.marks.hookBlocked, F.marks.hookFix - 1, E.lin]);
  BSEG.push([c('amber was not'), c('amber was not') + 0.3, F.marks.hookFix - 1, F.marks.hookFix, E.lin]);
  BSEG.push([tFix, tGo - 0.1, F.marks.hookFix, F.marks.round1End, E.lin]);
  BK.push(
    ...chain([
      [start - 0.3, { x: 960, y: 520, s: 1.16, o: 1, b: 0 }],
      [start + 0.8, { x: 1640, y: 230, s: 0.42 }, E.inOut],
      [tRec - 0.2, { o: 1 }],
      [tRec + 0.4, { o: 0.35 }],
      [end + 0.2, { o: 0 }],
    ]),
  );
  CK.push(
    ...chain([
      [start - 0.3, { x: 960, y: 100, s: 1.05, o: 1 }],
      [start + 0.8, { x: 1640, y: 58, s: 0.55 }, E.inOut],
      [tRec - 0.2, { o: 1 }],
      [tRec + 0.4, { o: 0 }],
    ]),
  );
  const j15i = F.journeys.findIndex((j) => j.id === 'j15-comment');
  return (t) => {
    put(kick, { x: 700, y: 80, o: P(t, start + 0.1, 0.5) });
    const ti = P(t, start + 0.2, 0.9, E.expo);
    const tOut = P(t, tRec - 0.3, 0.7, E.inOut);
    put(term, { x: 80, y: 150 + 30 * (1 - ti) - 40 * tOut, s: 1 - 0.06 * tOut, o: ti * (1 - 0.75 * tOut), b: 3 * tOut, c: false });
    let html = '';
    for (const l of L) {
      const n = Math.round(clamp((t - l.at) / 0.9) * segLen(l.segs));
      if (t >= l.at) html += typed(l.segs, n, false);
    }
    tx.innerHTML = html;
    // fifteen replays, one dot each; j15 is passed by Kane, then failed by AMBER, then fixed
    const replay1 = c('the hook had kane') + 0.3;
    const fooled = c('kane was fooled');
    const amberNot = c('amber was not');
    put(dots, { x: 32, y: 360, o: P(t, replay1 - 0.2, 0.4), c: false });
    dotEls.forEach((d, i) => {
      const t1 = mix(replay1, fooled, i / 14);
      const t2 = mix(tFix + 0.2, tGo - 0.2, i / 14);
      let st = t >= t1 ? 'pass' : 'idle';
      if (i === j15i && t >= amberNot) st = 'fail';
      if (t >= tFix + 0.1) st = t >= t2 ? 'pass' : 'idle';
      d.style.background = st === 'pass' ? 'rgba(255,211,107,0.22)' : st === 'fail' ? 'rgba(255,45,70,0.35)' : 'rgba(255,255,255,0.02)';
      d.style.borderColor = st === 'pass' ? '#ffd36b' : st === 'fail' ? '#ff2d46' : 'rgba(255,196,110,0.3)';
      d.style.color = st === 'idle' ? '' : st === 'pass' ? '#ffd36b' : '#ff6b7d';
      d.style.transform = `scale(${(1 + 0.25 * (1 - P(t, st === 'fail' ? amberNot : st === 'pass' ? (t >= tFix + 0.1 ? t2 : t1) : 1e9, 0.3))).toFixed(3)})`;
    });
    const bIn = P(t, tBlocked - 0.1, 0.5, E.expo);
    const bOut = P(t, tFix, 0.4, E.inOut);
    put(banner, { x: 32 + 60 * (1 - bIn), y: 440, o: bIn * (1 - bOut), c: false });
    S.red += 0.6 * bump(t, tBlocked, tFix, 0.2, 0.8);
    // the hook's own message, with the brief's path
    const mN = Math.round(clamp((t - tBlocked - 0.3) / 1.2) * msg.length);
    const k = msg.indexOf('Brief:');
    const shown = msg.slice(0, mN);
    const hiOn = P(t, tBrief, 0.3);
    msgEl.innerHTML = `<span class="r">${esc(shown.slice(0, k))}</span><span style="color:#ffd36b;background:rgba(255,211,107,${(0.2 * hiOn).toFixed(2)});border-radius:6px">${esc(shown.slice(k))}</span>`;
    put(msgEl, { x: 32, y: 560, o: (t >= tBlocked + 0.3 ? 1 : 0) * (1 - bOut), c: false });
    const aIn = P(t, tGo - 0.15, 0.5, E.expo);
    put(banner2, { x: 32 + 60 * (1 - aIn), y: 440, o: aIn, c: false });
    S.gold += 0.5 * bump(t, tGo, tRec, 0.2, 0.6);
    const rIn = P(t, tRec, 0.7, E.expo);
    put(record, { x: 960, y: 560 + 30 * (1 - rIn), o: rIn });
  };
});

// == s09b: round 2: a review's gaps become six more journeys; failed, repaired, proven; 21 of 21 =================
scene('s09b-round2', ({ over, c, start, end }) => {
  const kick = mk(over, 'kicker', 'Round 2 · a review, six more journeys');
  const gaps = [
    ["a new task won't open", c("a task you can't open")],
    ["search can't find it", c('a search that')],
  ].map(([s, at]) => ({ el: mk(over, 'chip red', esc(s)), at }));
  const NEW = F.journeys.slice(15);
  const sha = Object.fromEntries(F.commits2.map((cm) => [cm.flow, cm.sha]));
  const rows = NEW.map((j) => {
    const el = mk(over, 'commit', `<span class="sha" style="width:56px">${j.short}</span><span class="what" style="width:500px">${esc(j.title)}</span><span class="st"></span>`, { c: false });
    el.style.fontSize = '25px';
    el.style.height = '54px';
    return { j, el, st: el.querySelector('.st') };
  });
  // each new journey's verdicts on the capsule, in the order the page shows them
  const hist = Object.fromEntries(NEW.map((j) => [j.id, []]));
  EV.forEach((e, i) => e.kind === 'verdict' && e.target === 'capsule' && hist[e.flow] && hist[e.flow].push([i, e.verdict]));
  const stateAt = (flow, idx) => {
    let v = null;
    for (const [i, verdict] of hist[flow]) if (i < idx) v = verdict;
    return v;
  };
  const stamp = mk(over, 'stamp pass', `21 / 21<small>Kane CLI · capsule · server off · ${esc(F.finalCheck)}</small>`);
  Object.assign(stamp.style, { color: '#ffd36b', borderColor: '#ffd36b', background: 'rgba(60,40,5,0.6)' });
  stamp.querySelector('small').style.fontSize = '17px';
  const tWalk = c('so kane walked');
  const tSix = c('six more journeys');
  const tProved = cueIn('s09b-round2', 'kane proved them', 0, true);
  const t21 = c('twentyone of twentyone');
  BSEG.push([start - 0.6, start - 0.6, F.marks.round1End, F.marks.round1End]);
  BSEG.push([tSix, tProved + 0.4, F.marks.round1End, F.marks.end, E.sine]);
  BK.push(
    ...chain([
      [start + 0.25, { x: 1350, y: 1300, s: 0.66, rx: 30, ry: 0, o: 0, b: 0 }],
      [start + 0.26, { o: 1 }, E.lin],
      [start + 1.2, { y: 440, rx: 0 }, E.expo],
      [t21 - 0.3, { s: 0.68 }, E.sine],
      [t21 + 0.7, { x: 960, y: 470, s: 1.04 }, E.inOut],
      [end - 0.25, { s: 1.07 }, E.sine],
      [end + 0.3, { o: 0, b: 6 }, E.inOut],
    ]),
  );
  CK.push(
    ...chain([
      [start + 0.4, { x: 1350, y: 205, s: 0.75, o: 0 }],
      [start + 1.2, { o: 1 }, E.out],
      [t21 - 0.3, { o: 1 }],
      [t21 + 0.7, { x: 960, y: 110, s: 1 }, E.inOut],
      [end - 0.25, { o: 1 }],
      [end + 0.3, { o: 0 }],
    ]),
  );
  return (t) => {
    const leave = P(t, t21 - 0.4, 0.7, E.inOut);
    put(kick, { x: 470, y: 120, o: P(t, start + 0.3, 0.6) * (1 - leave) });
    const gOut = P(t, tWalk - 0.2, 0.6, E.inOut);
    gaps.forEach((g, i) => {
      const p = P(t, g.at - 0.05, 0.45, E.back);
      put(g.el, { x: 440, y: 330 + i * 95 - 40 * gOut, s: 0.6 + 0.4 * p, o: P(t, g.at - 0.05, 0.15) * (1 - gOut) });
    });
    S.red += 0.3 * bump(t, gaps[0].at, tWalk, 0.2, 0.6);
    const idx = blockIndexAt(t);
    rows.forEach((r, i) => {
      const p = P(t, tSix + i * 0.12, 0.5, E.expo);
      put(r.el, { x: 130 + 30 * (1 - p), y: 300 + i * 66, o: p * (1 - leave), c: false });
      const v = stateAt(r.j.id, idx);
      const want = v === 'PASS' ? `<span style="color:#ffd36b">✓ ${esc(sha[r.j.short] ?? '')}</span>` : v === 'FAIL' ? '<span style="color:#ff6b7d">✕ fails</span>' : '<span style="color:#7a6a54">on the real server ✓</span>';
      if (r.st.innerHTML !== want) r.st.innerHTML = want;
    });
    const si = P(t, t21 + 0.5, 0.45, E.back);
    put(stamp, { x: 1500, y: 860, r: -6, s: mix(2, 1, si), o: P(t, t21 + 0.5, 0.12) });
    S.gold += 0.7 * bump(t, t21 + 0.4, end, 0.25, 0.6);
  };
});

// == s10: the result: Vikunja with no server; add a task, reload, still there; flip the block; Kane tests it ==
scene('s10-live', ({ over, c, start, end }) => {
  const stillChip = mk(over, 'chip', 'still there after a reload · kept in this browser');
  const hl = mk($('appBody'), 'hl gold', null, { c: false });
  hl.style.opacity = '0';
  const tests = F.suite.map((s) => mk(over, 'chip', `✓ ${esc(s.id)}`));
  const testLbl = mk(over, 'kicker', `Kane CLI · tests/amber-page · ${F.suite.filter((s) => s.verdict === 'PASS').length} of ${F.suite.length} pass`);
  const tRun = c('running with no server');
  const tAdd = c('add a task');
  const tReload = c('reload');
  const tStill = c('still there');
  const tFlip = c('flip the amber block');
  const tTests = c('kane tests this page');
  const typeFrom = tRun - 0.2;
  const typeTo = tAdd - 0.35;
  const clickAt = tAdd + 0.1;
  /** Window placement that puts a point of the app (its own pixels) at the middle of the frame. */
  const focusOn = (ax, ay, s) => ({ x: 960 - (ax - 720) * s, y: 500 - (ay - 424) * s, s });
  AK.push(
    ...chain([
      [start - 0.5, { x: 960, y: 1450, s: 0.8, rx: 38, ry: 0, o: 0 }],
      [start - 0.49, { o: 1 }, E.lin],
      [start + 0.8, { y: 508, s: 0.85, rx: 0 }, E.expo],
      [typeFrom - 0.5, { s: 0.86 }, E.sine],
      [typeFrom + 0.4, { ...focusOn(AIN.cx + 140, AIN.cy + 70, 1.45) }, E.inOut],
      [tReload - 0.25, { ...focusOn(AIN.cx + 150, AIN.cy + 74, 1.5) }, E.sine],
      [tReload + 0.35, { x: 960, y: 508, s: 0.85 }, E.inOut],
      [tStill - 0.2, { ...focusOn(AIN.cx + 60, AIN.cy + 90, 1.25) }, E.inOut],
      [tFlip - 1.2, { ...focusOn(AIN.cx + 70, AIN.cy + 92, 1.27) }, E.sine],
      [tFlip - 0.4, { x: 960, y: 470, s: 0.7, o: 0, b: 6 }, E.inOut],
    ]),
  );
  CURK.push(
    ...chain([
      [typeFrom - 0.6, { x: 1180, y: 640, s: 1, o: 0 }],
      [typeFrom - 0.2, { o: 1 }],
      [typeFrom + 0.3, { x: AIN.x + 260, y: AIN.cy + 6 }, E.inOut],
      [typeTo, {}],
      [clickAt - 0.1, { x: AADD.cx - 6, y: AADD.cy - 4 }, E.inOut],
      [clickAt, { s: 0.85 }, E.out],
      [clickAt + 0.12, { s: 1 }, E.out],
      [tReload - 0.1, { x: AADD.cx + 120, y: AADD.cy + 160 }, E.inOut],
      [tReload + 0.3, { o: 0 }],
    ]),
  );
  BK.push(
    ...chain([
      [tFlip - 1.0, { x: 960, y: 480, s: 1.0, rx: 0, ry: -35, o: 0, b: 4 }],
      [tFlip + 0.0, { s: 1.12, ry: 0, o: 1, b: 0 }, E.out],
      [tTests - 0.2, { s: 1.14 }, E.sine],
      [tTests + 0.5, { y: 440, s: 1.02 }, E.inOut],
      [end - 0.2, { o: 1 }],
      [end + 0.4, { y: 400, s: 0.9, o: 0, b: 6 }, E.inOut],
    ]),
  );
  FLIPS.push([tFlip + 0.35, 'flip'], [end + 0.5, 'unflip']);
  return (t) => {
    // a visitor types a task, clicks Add, reloads: the capsule keeps it
    if (t >= typeFrom && t <= typeTo + 0.2) {
      const el = appInput();
      const v = TASK.slice(0, Math.round(clamp((t - typeFrom) / (typeTo - typeFrom)) * TASK.length));
      if (el && el.value !== v) {
        el.focus();
        el.value = v;
        el.dispatchEvent(new AppW.Event('input', { bubbles: true }));
      }
    }
    once('s10-add', t, clickAt, () => {
      appAdd().click();
      return until(() => appDoc().body.innerText.includes(TASK), 15000);
    });
    const rip = P(t, clickAt, 0.5, E.out);
    put($('ripple'), { x: AADD.cx, y: AADD.cy, s: 0.3 + 1.2 * rip, o: (1 - rip) * (t >= clickAt ? 1 : 0), c: false });
    once('s10-reload', t, tReload + 0.12, async () => {
      appFrame.contentDocument.__old = true;
      AppW.location.reload();
      await until(() => !appFrame.contentDocument.__old && appFrame.contentDocument.readyState === 'complete' && appFrame.contentDocument.body.innerText.includes(TASK), 30000);
      await new Promise((r) => setTimeout(r, 400));
    });
    $('appReload').style.transform = `rotate(${(360 * P(t, tReload, 0.7, E.inOut)).toFixed(1)}deg)`;
    $('appReload').style.color = bump(t, tReload, tReload + 0.7, 0.1, 0.3) > 0.5 ? '#ffd36b' : '';
    $('appFlash').style.opacity = (0.55 * bump(t, tReload + 0.08, tReload + 0.12, 0.06, 0.35)).toFixed(3);
    // after the reload: mark the task, which is still listed
    once('s10-mark', t, tStill - 0.4, () => {
      const doc = appFrame.contentDocument;
      const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) if (n.textContent.includes(TASK)) break;
      if (n) {
        const r = n.parentElement.getBoundingClientRect();
        Object.assign(hl.style, { left: `${r.left - 56}px`, top: `${r.top - 10}px`, width: `${r.width + 76}px`, height: `${r.height + 20}px` });
      }
    });
    const hp = bump(t, tStill - 0.1, tFlip - 0.9, 0.35, 0.4);
    hl.style.opacity = hp.toFixed(3);
    put(stillChip, { x: 960, y: 58 + 14 * (1 - P(t, tStill, 0.5, E.expo)), o: P(t, tStill, 0.4) * (1 - P(t, tFlip - 0.9, 0.4)) });
    // the same capsule on the back of the block: open its project page there before the flip
    once('s10-live-preload', t, tStill + 0.3, async () => {
      const live = AD.getElementById('live');
      live.src = '/projects/3';
      await until(() => live.contentDocument && live.contentDocument.body && live.contentDocument.body.innerText.includes(TASK), 30000);
    });
    S.gold += 0.4 * bump(t, tStill, tStill + 1, 0.2, 0.8);
    // Kane's four saved tests of this page
    tests.forEach((el, i) => {
      const p = P(t, tTests + 0.3 + i * 0.18, 0.5, E.back);
      put(el, { x: 960 + (i - 1.5) * 330, y: 820, s: 0.6 + 0.4 * p, o: P(t, tTests + 0.3 + i * 0.18, 0.2) });
    });
    put(testLbl, { x: 960, y: 900, o: P(t, c('four saved tests'), 0.5) });
  };
});

// == s11: try it; honest scope; Build it with an agent. Prove it with Kane. Keep it in amber. ==================
scene(
  's11-try',
  ({ over, c, start, end }) => {
    // the live link first: a browser's address bar, typed
    const LIVE = 'amber-capsule.pages.dev';
    const bar = mk(over, 'card', `<span style="color:#7ee08a;margin-right:18px">🔒</span><span class="addr"></span>`);
    Object.assign(bar.style, { font: '500 44px var(--mono)', color: '#f3e6cf', padding: '22px 40px', borderRadius: '99px', whiteSpace: 'nowrap', boxShadow: '0 0 60px rgba(255,190,80,0.25)' });
    const addr = bar.querySelector('.addr');
    const chips = ['nothing to install', 'no account', 'no credits'].map((s) => mk(over, 'chip', esc(s)));
    const term = mk(over, 'term', `<div class="tb"><i></i><i></i><i></i><span style="margin-left:14px">or locally, anywhere with Node</span></div><div class="tx"></div>`);
    term.style.width = '1300px';
    const tx = term.querySelector('.tx');
    tx.style.minHeight = '220px';
    const honest = mk(over, 'card', `<div class="label">Honestly</div><div class="quote" style="font-size:40px;line-height:1.35"></div>`);
    honest.style.width = '1240px';
    honest.style.textAlign = 'center';
    honest.style.padding = '34px 40px 40px';
    const hq = honest.querySelector('.quote');
    const lines = ['One app: Vikunja v2.8.0.', 'AMBER is the agent workflow that produced its capsule,', 'not a one-command tool for any site.', '21 journeys are proven; the README lists what is not.'];
    hq.innerHTML = lines.map((l) => `<div>${esc(l)}</div>`).join('');
    const hLines = [...hq.children];
    const beats = ['Build it with an agent.', 'Prove it with *Kane.*', 'Keep it in *amber.*'].map((s) => {
      const el = mk(over, 'title', null);
      el.style.fontSize = '96px';
      return { el, w: words(el, s) };
    });
    const mark = mk(over, 'wordmark plain', 'AMBER');
    mark.style.fontSize = '200px';
    const url = mk(over, 'kicker', `${LIVE}  ·  github.com/iftikar0016/amber`);
    url.style.fontSize = '26px';
    url.style.color = '#ffd36b';
    const T = [
      { at: c('clone the repository') - 0.1, dur: 1.2, segs: [['p', '$ '], ['', 'git clone https://github.com/iftikar0016/amber && cd amber'], ['', '\n']] },
      { at: c('run node') - 0.1, dur: 0.6, segs: [['p', '$ '], ['g', 'node bin/demo.mjs'], ['', '\n']] },
      { at: cueIn('s11-try', 'demo', 0, true) + 0.15, dur: 0.5, segs: [['', 'AMBER capsule: '], ['b', 'http://127.0.0.1:4790/'], ['p', '  (Vikunja with no server)'], ['', '\n'], ['', 'AMBER page:    '], ['b', 'http://127.0.0.1:4790/amber/'], ['p', '  (the amber block and the recorded run)']] },
    ];
    const tOpen = c('open ambercapsule');
    const chipT = [c('nothing to install'), c('no account'), c('no credits')];
    const tClone = c('or clone');
    const tHon = c('to be honest');
    const hT = [c('this is one app'), c('amber is the agent workflow'), c('not a onecommand tool'), c('twentyone journeys are proven')];
    const bT = [c('build it with an agent'), c('prove it with kane'), c('keep it in amber')];
    const tMark = cueIn('s11-try', 'keep it in amber', 0, true) + 0.35;
    BK.push(
      ...chain([
        [tMark - 0.4, { x: 960, y: 520, s: 0.7, rx: 0, ry: 0, o: 0, b: 8 }],
        [tMark + 1.4, { y: 470, s: 0.78, o: 0.42, b: 4 }, E.out],
        [end, { s: 0.8 }, E.sine],
      ]),
    );
    return (t) => {
      const tOut = P(t, tHon - 0.3, 0.7, E.inOut);
      // the address bar drops in and the live address types itself as it is said
      const bi = P(t, start - 0.1, 0.8, E.expo);
      put(bar, { x: 960, y: 200 - 30 * tOut, s: 0.92 + 0.08 * bi, o: bi * (1 - tOut), b: 6 * tOut });
      addr.textContent = LIVE.slice(0, Math.round(clamp((t - tOpen) / 1.4) * LIVE.length)) + (t < tOpen + 1.6 && Math.floor(t * 2.2) % 2 === 0 ? '▍' : '');
      bar.style.boxShadow = `0 0 ${(40 + 50 * bump(t, tOpen + 1.3, tOpen + 2.2, 0.2, 0.6)).toFixed(1)}px rgba(255,190,80,${(0.25 + 0.35 * bump(t, tOpen + 1.3, tOpen + 2.2, 0.2, 0.6)).toFixed(2)})`;
      chips.forEach((el, i) => {
        const p = P(t, chipT[i] - 0.05, 0.45, E.back);
        put(el, { x: 960 + (i - 1) * 400, y: 330 - 30 * tOut, s: 0.5 + 0.5 * p, o: P(t, chipT[i] - 0.05, 0.15) * (1 - tOut) });
      });
      // or locally
      const ti = P(t, tClone - 0.2, 0.8, E.expo);
      put(term, { x: 960, y: 640 + 40 * (1 - ti) - 40 * tOut, s: 0.96 + 0.04 * ti, o: ti * (1 - tOut), b: 6 * tOut });
      let html = '';
      for (const l of T) if (t >= l.at) html += typed(l.segs, Math.round(clamp((t - l.at) / l.dur) * segLen(l.segs)), false);
      tx.innerHTML = html + (Math.floor(t * 2.2) % 2 ? '' : '<span class="g">▍</span>');
      const hIn = P(t, tHon, 0.8, E.expo);
      const hOut = P(t, bT[0] - 0.4, 0.6, E.inOut);
      put(honest, { x: 960, y: 470, s: 0.96 + 0.04 * hIn, o: hIn * (1 - hOut) });
      hLines.forEach((el, i) => {
        const p = P(t, hT[i] - 0.1, 0.7, E.expo);
        el.style.opacity = p.toFixed(3);
        el.style.transform = `translateY(${(18 * (1 - p)).toFixed(1)}px)`;
        el.style.color = i === 3 ? '#ffd36b' : '';
      });
      const up = P(t, tMark - 0.2, 0.9, E.inOut);
      beats.forEach((b, i) => {
        b.w(t, bT[i] - 0.05, { st: 0.06 });
        put(b.el, { x: 960, y: 330 + i * 140 - 60 * up, o: 1 - up, b: 6 * up });
      });
      const mi = P(t, tMark, 1.4, E.expo);
      put(mark, { x: 960, y: 470 + 40 * (1 - mi), s: 0.94 + 0.06 * mi, o: mi, b: 12 * (1 - mi) });
      put(url, { x: 960, y: 650, o: P(t, tMark + 0.8, 0.8) });
      S.gold += 0.8 * P(t, tMark, 1.2);
    };
  },
  { noOut: true },
);

// the persistent objects need their keyframes in time order
for (const list of [BK, AK, CK, CURK]) list.sort((a, b) => a[0] - b[0]);
BSEG.sort((a, b) => a[0] - b[0]);

// ---- captions: the line being spoken, each word lit as it is said ------------------------------------------
const capLines = [];
{
  const all = SCENES.flatMap((s) => s.words.map((w) => ({ ...w })));
  // what is spoken as words is shown as written
  const WRITTEN = [
    ['node bin slash demo', 'node bin/demo.mjs'],
    ['ambercapsule dot pages dot dev', 'amber-capsule.pages.dev'],
  ];
  for (const [spoken, written] of WRITTEN) {
    const n = spoken.split(' ').length;
    for (let i = 0; i + n <= all.length; i++) {
      if (all.slice(i, i + n).map((w) => norm(w.w)).join(' ') === spoken) {
        const tail = all[i + n - 1].w.match(/[.,:;!?]*$/)[0];
        all.splice(i, n, { w: `${written}${tail}`, s: all[i].s, e: all[i + n - 1].e });
      }
    }
  }
  let line = [];
  const flush = () => {
    if (line.length) capLines.push({ words: line, s: line[0].s, e: line.at(-1).e });
    line = [];
  };
  for (const w of all) {
    const len = line.map((x) => x.w).join(' ').length;
    const limit = /[.!?]$/.test(w.w) ? 56 : 48;
    if (line.length && (len + 1 + w.w.length > limit || w.s - line.at(-1).e > 0.7)) flush();
    line.push(w);
    const n = line.map((x) => x.w).join(' ').length;
    if (/[.!?]$/.test(w.w) || (/[,:;]$/.test(w.w) && n > 24)) flush();
  }
  flush();
}
let capKey = '';
function captions(t) {
  let L = null;
  for (const l of capLines) if (t >= l.s - 0.12 && t <= l.e + 0.35) L = l;
  const box = $('capLine');
  if (!L) {
    box.style.opacity = '0';
    capKey = '';
    return;
  }
  const said = L.words.filter((w) => w.e <= t).length;
  const now = L.words.findIndex((w) => w.s <= t && t < w.e);
  const key = `${L.s}:${said}:${now}`;
  if (key !== capKey) {
    capKey = key;
    box.innerHTML = L.words.map((w, i) => `<span class="${i === now ? 'now' : i < said ? 'said' : ''}">${esc(w.w)}</span>`).join(' ');
  }
  const pin = P(t, L.s - 0.12, 0.18, E.out);
  const next = capLines[capLines.indexOf(L) + 1];
  const gap = next ? next.s - L.e : 9;
  const pout = gap > 0.45 ? P(t, L.e + 0.2, 0.15, E.inOut) : 0;
  box.style.opacity = (pin * (1 - pout)).toFixed(3);
  box.style.transform = `translateY(${(10 * (1 - pin)).toFixed(1)}px)`;
}

// ---- the frame at time t ------------------------------------------------------------------------------------
const drift = (t) => `translate(${(6 * Math.sin(t * 0.23)).toFixed(2)}px, ${(4 * Math.sin(t * 0.17 + 1)).toFixed(2)}px)`;
async function seek(t) {
  S.red = 0;
  S.gold = 0;
  pending.length = 0;
  for (const p of ['under', 'persist', 'over']) $(p).style.transform = drift(t);
  for (const s of scenes) {
    const vis = t >= s.start - 1.0 && t <= s.end + 1.0;
    s.under.style.display = s.over.style.display = vis ? '' : 'none';
    if (!vis) continue;
    layerFx(s, t);
    s.update(t);
  }
  blockUpdate(t);
  appUpdate(t);
  background(t);
  captions(t);
  $('black').style.opacity = String(Math.max(1 - P(t, 0, 0.8, E.out), P(t, TOTAL - 1.3, 1.2, E.inOut)));
  driveAnimations(AD, t * 1000);
  if (pending.length) await Promise.all(pending);
  return true;
}
window.stage = { seek, total: TOTAL, ready: true };
