// @ts-check
// Complete the captured front end. Kane's journeys load only the code-split chunks of the screens they visit; a visitor
// to the capsule may open any screen. So after the journeys, every front-end file the app's own bundle refers to
// (JS chunks, CSS, fonts, images) and that is still missing is fetched from the real server through the recorder.
// This is static app code only: API data in the capsule still comes only from Kane's journeys.
import fs from 'node:fs';
import path from 'node:path';
import { APP, CAPTURE_DIR } from '../config.mjs';

const REF = /(?:["'`(]|\b)(\/?(?:assets|images|workbox-v[\d.]+)\/[A-Za-z0-9_.@~\/-]+\.(?:js|mjs|css|woff2?|ttf|svg|png|jpe?g|webp|ico|json))/g;

/** Every front-end path referenced by the captured HTML, JS and CSS that is not captured yet. */
export function missingFrontendFiles() {
  const staticDir = path.join(CAPTURE_DIR, 'static');
  const manifest = JSON.parse(fs.readFileSync(path.join(staticDir, 'manifest.json'), 'utf8'));
  const missing = new Set();
  for (const [p, f] of Object.entries(manifest)) {
    if (!/html|javascript|css/.test(f.type)) continue;
    const text = fs.readFileSync(path.join(staticDir, 'files', f.sha), 'utf8');
    for (const m of text.matchAll(REF)) {
      let ref = m[1];
      if (!ref.startsWith('/')) ref = /\.css$/.test(p) && !ref.startsWith('assets/') ? path.posix.join(path.posix.dirname(p), ref) : '/' + ref;
      if (!manifest[ref]) missing.add(ref);
    }
  }
  return [...missing].sort();
}

/** Fetch missing files through the running recorder until nothing referenced is missing. */
export async function completeFrontend(log = () => {}) {
  const fetched = [];
  const failed = [];
  for (let round = 0; round < 5; round++) {
    const todo = missingFrontendFiles().filter((p) => !failed.includes(p));
    if (!todo.length) break;
    for (const p of todo) {
      const r = await fetch(APP.origin + p);
      await r.arrayBuffer();
      if (r.ok && !/text\/html/.test(r.headers.get('content-type') ?? '')) fetched.push(p);
      else failed.push(p);
    }
    log(`front end: fetched ${fetched.length} referenced files so far`);
  }
  return { fetched: fetched.length, failed };
}
