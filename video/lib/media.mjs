// Video tooling (not evidence): ffmpeg location, running it, and recording a headless-Chrome tab as a clip.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function ffmpegPath(tool = 'ffmpeg') {
  if (tool === 'ffmpeg' && process.env.FFMPEG) return process.env.FFMPEG;
  const base = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(base)) {
    for (const pkg of fs.readdirSync(base).filter((d) => d.startsWith('Gyan.FFmpeg'))) {
      for (const sub of fs.readdirSync(path.join(base, pkg))) {
        const exe = path.join(base, pkg, sub, 'bin', `${tool}.exe`);
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  return tool; // on PATH
}

export function run(tool, args) {
  const r = spawnSync(ffmpegPath(tool), args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  if (r.status !== 0) throw new Error(`${tool} failed: ${(r.stderr || '').split('\n').slice(-12).join('\n')}`);
  return r.stdout;
}

/** Duration of a media file in seconds. */
export function duration(file) {
  return Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).trim());
}

/**
 * Record what a Chrome tab shows while `act` runs, as a 30 fps H.264 clip.
 * Screencast frames arrive only when the page changes; each is held until the next one, by its timestamp.
 */
export async function recordTab(chrome, outFile, act) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'amber-frames-'));
  const frames = [];
  const stop = chrome.on('Page.screencastFrame', (p) => {
    const file = path.join(dir, `${String(frames.length).padStart(6, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(p.data, 'base64'));
    frames.push({ file, t: p.metadata.timestamp });
    chrome.send('Page.screencastFrameAck', { sessionId: p.sessionId });
  });
  await chrome.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  const started = Date.now() / 1000;
  await act();
  const ended = Date.now() / 1000;
  await chrome.send('Page.stopScreencast');
  stop();
  if (!frames.length) throw new Error('No frames captured');
  // concat list: each frame lasts until the next; the last until the end of the act
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const until = i + 1 < frames.length ? frames[i + 1].t : Math.max(ended, frames[i].t + 0.04);
    lines.push(`file '${frames[i].file.split(path.sep).join('/')}'`, `duration ${Math.max(0.001, until - frames[i].t).toFixed(4)}`);
  }
  lines.push(`file '${frames.at(-1).file.split(path.sep).join('/')}'`);
  const list = path.join(dir, 'list.txt');
  fs.writeFileSync(list, lines.join('\n'));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0a0806,fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', outFile]);
  fs.rmSync(dir, { recursive: true, force: true });
  return { frames: frames.length, seconds: ended - started };
}
