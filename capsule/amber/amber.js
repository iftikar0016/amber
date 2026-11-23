// AMBER's page. Everything shown comes from run-data.json (built from the committed Kane runs) and
// wireframes.json (the boxes of Vikunja's real screens). No account, no credits: this only plays what happened.
const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

const [data, wires] = await Promise.all([fetch('run-data.json').then((r) => r.json()), fetch('wireframes.json').then((r) => r.json())]);
const journeys = data.journeys;
const events = data.events;
$('total').textContent = journeys.length;

// ---- layout: 5 x 3 tiles inside a 1000 x 520 block ---------------------------------------------------------
const COLS = 5;
const GX = 18;
const GY = 36;
const MX = 40;
const TW = (1000 - 2 * MX - (COLS - 1) * GX) / COLS;
const TH = TW / (wires.width / wires.height);
const MY = (520 - (3 * TH + 2 * GY)) / 2 - 4;

function rng(seedText) {
  let h = 2166136261;
  for (const c of seedText) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
};

/** A jagged crack across the tile, with one branch; the same shape for the same journey every time. */
function crackPath(id) {
  const r = rng(id);
  const fromLeft = r() < 0.5;
  let x = fromLeft ? 0 : TW * (0.15 + r() * 0.3);
  let y = fromLeft ? TH * (0.2 + r() * 0.5) : 0;
  const endX = fromLeft ? TW : TW * (0.55 + r() * 0.4);
  const endY = fromLeft ? TH * (0.25 + r() * 0.6) : TH;
  const n = 8 + Math.floor(r() * 4);
  const pts = [[x, y]];
  for (let i = 1; i < n; i++) {
    const f = i / n;
    x = pts[0][0] + (endX - pts[0][0]) * f + (r() - 0.5) * TW * 0.12;
    y = pts[0][1] + (endY - pts[0][1]) * f + (r() - 0.5) * TH * 0.16;
    pts.push([x, y]);
  }
  pts.push([endX, endY]);
  const main = 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L');
  const b = pts[Math.floor(n / 2)];
  let bx = b[0];
  let by = b[1];
  const branch = [[bx, by]];
  for (let i = 0; i < 3; i++) {
    bx += (r() * 0.5 + 0.2) * TW * 0.12;
    by += (r() - 0.65) * TH * 0.22;
    branch.push([bx, by]);
  }
  return main + ' M' + branch.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L');
}

/** A short gold proof mark for a journey that passed the first time Kane tried it on the capsule. */
function proofPath(id) {
  const r = rng(id + ':proof');
  const x = TW * (0.62 + r() * 0.2);
  const y = TH * (0.78 + r() * 0.1);
  return `M${x.toFixed(1)} ${y.toFixed(1)} l${(TW * 0.07).toFixed(1)} ${(-TH * 0.02).toFixed(1)}`;
}

function drawWire(g, screen) {
  const s = wires.screens[screen];
  if (!s) return;
  const k = TW / wires.width;
  const wire = el('g', { class: 'wire', filter: 'url(#sunk)' }, g);
  for (const b of s.boxes) {
    const x = b.x * k;
    const y = b.y * k;
    const w = b.w * k;
    const h = b.h * k;
    if (y > TH || x > TW) continue;
    if (b.kind === 'text' || b.kind === 'heading') el('line', { class: b.kind, x1: x, y1: y + h / 2, x2: x + w, y2: y + h / 2 }, wire);
    else if (b.kind === 'icon') el('circle', { cx: x + w / 2, cy: y + h / 2, r: Math.max(0.6, Math.min(w, h) / 2.4) }, wire);
    else el('rect', { class: b.kind, x, y, width: w, height: h, rx: Math.min(3, h / 3) }, wire);
  }
}

const fossil = $('fossil');
const tiles = {};
journeys.forEach((j, i) => {
  const cx = MX + (i % COLS) * (TW + GX);
  const cy = MY + Math.floor(i / COLS) * (TH + GY);
  const g = el('g', { class: 'tile', transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`, tabindex: 0, role: 'button', 'aria-label': `${j.title}: show Kane's evidence`, 'data-flow': j.id, 'data-state': 'idle' }, fossil);
  el('rect', { class: 'frame', x: 0, y: 0, width: TW, height: TH, rx: 4 }, g);
  const clip = el('clipPath', { id: `clip-${j.id}` }, g);
  el('rect', { x: 0, y: 0, width: TW, height: TH, rx: 4 }, clip);
  const inner = el('g', { 'clip-path': `url(#clip-${j.id})` }, g);
  drawWire(inner, j.screen);
  const d = crackPath(j.id);
  // A fissure: a dark core with crimson light around it; the healed seam keeps the dark core under its gold.
  el('path', { class: 'core', d }, g);
  el('path', { class: 'crack', d }, g);
  const seam = el('path', { class: 'seam', d }, g);
  const proof = el('path', { class: 'proof', d: proofPath(j.id) }, g);
  const label = el('text', { class: 'label', x: 1, y: TH + 12 }, g);
  label.textContent = `${j.id.slice(0, 3)} · ${j.title}`;
  tiles[j.id] = { g, seam, proof };
  g.addEventListener('click', () => openDrawer(j.id));
  g.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openDrawer(j.id)));
});
// measure paths once the SVG is in the document, for the drawing-in animation
for (const t of Object.values(tiles)) {
  for (const p of [t.seam, t.proof]) {
    const len = p.getTotalLength();
    p.style.setProperty('--len', len);
    p.style.strokeDasharray = `${len}`;
  }
}

// a few air bubbles caught in the resin
{
  const r = rng('bubbles');
  const front = $('front');
  for (let i = 0; i < 14; i++) {
    const b = document.createElement('span');
    const size = 2 + r() * 7;
    b.className = 'bubble';
    Object.assign(b.style, { width: `${size}px`, height: `${size}px`, left: `${r() * 96 + 2}%`, top: `${r() * 92 + 4}%`, opacity: String(0.35 + r() * 0.5) });
    front.appendChild(b);
  }
}

// ---- state at a point in the recorded run ----------------------------------------------------------------
function stateAt(index) {
  const s = Object.fromEntries(journeys.map((j) => [j.id, { capsule: [], real: [] }]));
  for (const e of events.slice(0, index)) if (e.kind === 'verdict' && s[e.flow]) s[e.flow][e.target === 'capsule' ? 'capsule' : 'real'].push(e);
  const out = {};
  for (const [id, h] of Object.entries(s)) {
    const last = h.capsule.at(-1);
    out[id] = !last ? 'idle' : last.verdict === 'FAIL' ? 'fractured' : h.capsule.some((e) => e.verdict === 'FAIL') ? 'healed' : 'proven';
  }
  return out;
}

let shown = {};
function render(index, animate) {
  const st = stateAt(index);
  let proven = 0;
  for (const [id, state] of Object.entries(st)) {
    const t = tiles[id];
    if (!t) continue;
    if (animate && shown[id] !== state) {
      t.g.classList.remove('healing', 'proving');
      void t.g.getBoundingClientRect();
      if (state === 'healed') t.g.classList.add('healing');
      if (state === 'proven') t.g.classList.add('proving');
    }
    if (!animate) t.g.classList.remove('healing', 'proving');
    t.g.dataset.state = state;
    if (state === 'healed' || state === 'proven') proven++;
  }
  shown = st;
  $('proven').textContent = proven;
  $('scrub').value = index;
}

function describe(e) {
  if (!e) return 'Vikunja v2.8.0 with its server switched off. Every gold seam is a Kane CLI run.';
  if (e.kind === 'run') return e.target === 'real server' ? `Kane walks the journeys on the real server (run ${e.runId})` : `Kane checks the capsule with the server off (run ${e.runId})`;
  if (e.kind === 'fix') return `The coding agent repairs the capsule: ${e.subject.replace(/^capsule:\s*/, '')} (${e.sha})`;
  const j = journeys.find((x) => x.id === e.flow);
  const where = e.target === 'capsule' ? 'on the capsule, server off' : 'on the real server';
  if (e.adjudicated) return `Kane said “${j?.title}” passed, but the capsule had refused the change: AMBER disputes it`;
  return e.verdict === 'PASS' ? `Kane proves “${j?.title}” ${where}` : `Kane catches “${j?.title}” failing ${where}: ${e.oneLiner ?? ''}`;
}

// ---- replay ------------------------------------------------------------------------------------------------
$('scrub').max = events.length;
let timer = null;
function stop() {
  clearTimeout(timer);
  timer = null;
  $('replay').textContent = 'Replay the run';
}
function play(from = 0) {
  stop();
  $('replay').textContent = 'Pause';
  let i = from;
  render(i, false);
  const step = () => {
    if (i >= events.length) {
      $('caption').textContent = describe(null);
      return stop();
    }
    const e = events[i++];
    render(i, true);
    $('caption').textContent = describe(e);
    const speed = Number(params.get('speed') || 1);
    timer = setTimeout(step, (e.kind === 'fix' ? 1700 : e.kind === 'run' ? 1100 : 520) / speed);
  };
  timer = setTimeout(step, 600);
}
$('replay').addEventListener('click', () => (timer ? stop() : play(Number($('scrub').value) >= events.length ? 0 : Number($('scrub').value))));
$('scrub').addEventListener('input', () => {
  stop();
  const i = Number($('scrub').value);
  render(i, false);
  $('caption').textContent = describe(events[i - 1]);
});

// ---- the live app on the back of the block ---------------------------------------------------------------
const appUrl = params.get('app') || '/';
$('flip').addEventListener('click', () => {
  const live = $('live');
  if (!live.src) live.src = appUrl;
  $('block').classList.add('flipped');
});
$('unflip').addEventListener('click', () => $('block').classList.remove('flipped'));
$('reset').addEventListener('click', () => $('live').contentWindow?.postMessage({ type: 'amber-reset' }, '*'));

// ---- evidence drawer -------------------------------------------------------------------------------------
function openDrawer(id) {
  const j = journeys.find((x) => x.id === id);
  const mine = events.filter((e) => (e.kind === 'verdict' && e.flow === id) || e.kind === 'fix');
  const lastCapsule = mine.filter((e) => e.kind === 'verdict' && e.target === 'capsule').at(-1);
  const lastWithShot = [...mine].reverse().find((e) => e.shot);
  $('drawer-id').textContent = id;
  $('drawer-title').textContent = j.title;
  $('drawer-outcome').textContent = `Expected: ${j.outcome}.`;
  const img = $('drawer-shot');
  if (lastWithShot) {
    img.src = lastWithShot.shot;
    img.alt = `Kane's last screenshot of “${j.title}” (${lastWithShot.target}, ${lastWithShot.verdict})`;
    img.hidden = false;
  } else img.hidden = true;
  $('drawer-say').textContent = lastCapsule
    ? lastCapsule.verdict === 'PASS'
      ? 'Kane proved this journey on the capsule with the server off.'
      : `Kane: ${lastCapsule.oneLiner ?? 'the journey failed on the capsule.'}`
    : 'Not yet checked on the capsule.';
  const ol = $('drawer-history');
  ol.replaceChildren();
  // fixes are shown only between this journey's own verdicts
  const firstT = mine.find((e) => e.kind === 'verdict')?.t ?? 0;
  const lastT = mine.filter((e) => e.kind === 'verdict').at(-1)?.t ?? 0;
  for (const e of mine) {
    if (e.kind === 'fix' && (e.t < firstT || e.t > lastT)) continue;
    const li = document.createElement('li');
    const chip = document.createElement('span');
    chip.className = `chip ${e.kind === 'fix' ? 'FIX' : e.verdict}`;
    chip.textContent = e.kind === 'fix' ? 'FIX' : e.verdict;
    li.append(chip, document.createTextNode(e.kind === 'fix' ? `${e.sha} ${e.subject}` : `${e.target === 'capsule' ? 'capsule, server off' : 'real server'} · run ${e.runId}`));
    if (e.adjudicated) {
      const d = document.createElement('div');
      d.textContent = `Kane said ${e.kaneStatus ?? 'passed'}; AMBER disputes it: ${(e.reasons || [])[0] ?? 'the capsule refused the change'}`;
      li.append(d);
    } else if (e.kind === 'verdict' && e.verdict === 'FAIL' && e.oneLiner) {
      const d = document.createElement('div');
      d.textContent = `Kane: ${e.oneLiner}`;
      li.append(d);
    }
    if (e.record) {
      const c = document.createElement('div');
      c.className = 'muted';
      c.textContent = e.record;
      li.append(c);
    }
    ol.append(li);
  }
  $('drawer').hidden = false;
  $('close').focus();
}
$('close').addEventListener('click', () => ($('drawer').hidden = true));
addEventListener('keydown', (e) => e.key === 'Escape' && ($('drawer').hidden = true));

// ---- start ------------------------------------------------------------------------------------------------
if (params.get('t') === 'start') render(0, false);
else render(events.length, false);
if (params.get('flow')) openDrawer(params.get('flow'));
if (params.get('play') !== null) play(0);
