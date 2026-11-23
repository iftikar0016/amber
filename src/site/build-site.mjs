// @ts-check
// Puts AMBER's page at /amber/ inside the capsule folder, so the page and the live app share one origin
// (the flip shows the real capsule in an iframe, and its Service Worker controls it).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.mjs';
import { siteData } from './data.mjs';

export function buildSite(capsuleDir) {
  const src = path.join(ROOT, 'site');
  const out = path.join(capsuleDir, 'amber');
  for (const f of ['index.html', 'amber.css', 'amber.js', 'wireframes.json']) {
    if (fs.existsSync(path.join(src, f))) fs.copyFileSync(path.join(src, f), path.join(out, f));
  }
  const shots = path.join(out, 'evidence');
  fs.rmSync(shots, { recursive: true, force: true });
  const data = siteData({
    copyShot: (file, flow, runId) => {
      const rel = `evidence/${runId}/${flow}.jpg`;
      fs.mkdirSync(path.join(out, 'evidence', runId), { recursive: true });
      fs.copyFileSync(file, path.join(out, rel));
      return rel;
    },
  });
  fs.writeFileSync(path.join(out, 'run-data.json'), JSON.stringify(data));
  return { events: data.events.length };
}
