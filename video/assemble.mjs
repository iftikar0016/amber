// Assembles the demo video: each scene's visual (a recorded clip or a still) under its ElevenLabs narration,
// with burned-in captions timed from the narration's character alignment.
//   node video/assemble.mjs   -> .amber/video/amber-demo.mp4
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/config.mjs';
import { duration, run } from './lib/media.mjs';

const V = path.join(ROOT, '.amber', 'video');
const LEAD = 0.35; // silence before the narration in each scene
const TAIL = 0.65; // after it
const FPS = 30;
const script = JSON.parse(fs.readFileSync(path.join(ROOT, 'video', 'script.json'), 'utf8'));

/** Caption lines for one scene, from ElevenLabs' character timings. */
function captionLines(meta) {
  const words = [];
  let cur = null;
  for (let i = 0; i < meta.chars.length; i++) {
    const ch = meta.chars[i];
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      continue;
    }
    if (!cur) cur = { text: '', start: meta.starts[i], end: meta.ends[i] };
    cur.text += ch;
    cur.end = meta.ends[i];
  }
  if (cur) words.push(cur);
  // What is spoken as words is shown as written.
  for (let i = 0; i + 3 < words.length; i++) {
    if (words.slice(i, i + 4).map((w) => w.text.toLowerCase()).join(' ').startsWith('node bin slash demo')) {
      const tail = words[i + 3].text.replace(/^demo/i, '');
      words.splice(i, 4, { text: `node bin/demo.mjs${tail}`, start: words[i].start, end: words[i + 3].end });
    }
  }
  const lines = [];
  let line = [];
  const flush = () => {
    if (line.length) lines.push({ text: line.map((w) => w.text).join(' '), start: line[0].start, end: line.at(-1).end });
    line = [];
  };
  for (const w of words) {
    const len = line.map((x) => x.text).join(' ').length;
    if (line.length && len + 1 + w.text.length > 46) flush();
    line.push(w);
    const n = line.map((x) => x.text).join(' ').length;
    if (/[.!?]$/.test(w.text) || (/[,:;]$/.test(w.text) && n > 26)) flush();
  }
  flush();
  return lines;
}

const ts = (s) => {
  const cs = Math.max(0, Math.round(s * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const sec = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
};

const segDir = path.join(V, 'segments');
fs.rmSync(segDir, { recursive: true, force: true });
fs.mkdirSync(segDir, { recursive: true });
const ass = [
  '[Script Info]',
  'ScriptType: v4.00+',
  'PlayResX: 1920',
  'PlayResY: 1080',
  'WrapStyle: 2',
  '',
  '[V4+ Styles]',
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  'Style: Cap,Segoe UI Semibold,46,&H00F3EEE6,&H00FFFFFF,&HB0060403,&HB0060403,0,0,0,0,100,100,0,0,3,14,0,2,120,120,30,1',
  '',
  '[Events]',
  'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
];

let t0 = 0;
const list = [];
for (const [i, s] of script.scenes.entries()) {
  const audio = path.join(V, 'audio', `${s.id}.mp3`);
  const meta = JSON.parse(fs.readFileSync(path.join(V, 'audio', `${s.id}.json`), 'utf8'));
  const A = duration(audio);
  const D = LEAD + A + TAIL + (i === script.scenes.length - 1 ? 2.5 : 0);
  const [kind, name] = s.visual.split(':');
  const out = path.join(segDir, `${String(i).padStart(2, '0')}-${s.id}.mp4`);
  const fade = `fade=t=in:st=0:d=0.25,fade=t=out:st=${(D - 0.3).toFixed(3)}:d=0.3`;
  const audioChain = `[1:a]adelay=${Math.round(LEAD * 1000)}:all=1,apad,atrim=0:${D.toFixed(3)},afade=t=out:st=${(D - 0.25).toFixed(3)}:d=0.25[a]`;
  if (kind === 'clip') {
    const src = path.join(V, `clip-${name}.mp4`);
    const L = duration(src);
    // Fit the clip to the scene: speed it up (at most 4x) or hold its last frame.
    const k = Math.min(4, Math.max(1, L / D));
    const vf = `setpts=PTS/${k.toFixed(4)},tpad=stop_mode=clone:stop_duration=${D.toFixed(3)},trim=0:${D.toFixed(3)},setpts=PTS-STARTPTS,fps=${FPS},${fade},format=yuv420p`;
    run('ffmpeg', ['-y', '-v', 'error', '-i', src, '-i', audio, '-filter_complex', `[0:v]${vf}[v];${audioChain}`, '-map', '[v]', '-map', '[a]', '-t', D.toFixed(3), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', out]);
  } else {
    const img = path.join(V, `slide-${name}.png`);
    const frames = Math.round(D * FPS);
    // A slow push-in on the still: from 100% to 104%.
    const vf = `scale=3840:2160,zoompan=z='1+0.04*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=${FPS},${fade},format=yuv420p`;
    run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', String(FPS), '-i', img, '-i', audio, '-filter_complex', `[0:v]${vf}[v];${audioChain}`, '-map', '[v]', '-map', '[a]', '-t', D.toFixed(3), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', out]);
  }
  for (const l of captionLines(meta)) {
    ass.push(`Dialogue: 0,${ts(t0 + LEAD + l.start)},${ts(t0 + LEAD + l.end + 0.15)},Cap,,0,0,0,,${l.text.replace(/[{}]/g, '')}`);
  }
  list.push(`file '${out.split(path.sep).join('/')}'`);
  console.log(`${s.id}: ${D.toFixed(1)} s (${kind} ${name})`);
  t0 += D;
}

fs.writeFileSync(path.join(V, 'captions.ass'), ass.join('\n') + '\n');
fs.writeFileSync(path.join(V, 'segments.txt'), list.join('\n') + '\n');
const joined = path.join(V, 'amber-demo-nocaptions.mp4');
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(V, 'segments.txt'), '-c', 'copy', joined]);
// Burn in the captions (the subtitles filter takes a path relative to the working directory, avoiding drive-colon escaping).
const prev = process.cwd();
process.chdir(V);
try {
  run('ffmpeg', ['-y', '-v', 'error', '-i', 'amber-demo-nocaptions.mp4', '-vf', 'subtitles=captions.ass', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-c:a', 'copy', '-movflags', '+faststart', 'amber-demo.mp4']);
} finally {
  process.chdir(prev);
}
console.log(`amber-demo.mp4: ${t0.toFixed(1)} s`);
