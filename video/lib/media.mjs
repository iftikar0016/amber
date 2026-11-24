// Video tooling (not evidence): where ffmpeg is, and running it.
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

