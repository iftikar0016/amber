// Development aid, not evidence: serves capsule/ the way a plain static host does, to check the capsule
// does not depend on AMBER's own server. No API, no log endpoint, POST refused.
//   node scripts/static-host.mjs [--port 5050] [--mode spa|404] [--pretty]
//     spa: an unknown path gets index.html with 200 (Netlify's /* rewrite, Cloudflare Pages' SPA mode)
//     404: an unknown path gets 404.html with status 404 (GitHub Pages, and Cloudflare Pages when there is a 404.html)
//     --pretty: /index.html redirects to /, as Cloudflare Pages and Netlify do
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { CAPSULE_DIR } from '../src/config.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d);
const PORT = Number(opt('port', 5050));
const MODE = opt('mode', 'spa');
const PRETTY = args.includes('--pretty');
const DIR = path.resolve(CAPSULE_DIR);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8' };

http
  .createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end();
    let rel = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    // "Pretty URLs", as Cloudflare Pages and Netlify do: /index.html redirects to /, /a.html to /a
    if (PRETTY && rel.endsWith('.html') && fs.existsSync(path.join(DIR, ...rel.split('/').filter(Boolean)))) {
      return res.writeHead(308, { location: rel.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '') || '/' }).end();
    }
    if (PRETTY && !path.extname(rel) && !rel.endsWith('/') && fs.existsSync(path.join(DIR, ...rel.split('/').filter(Boolean)) + '.html')) rel += '.html';
    if (rel.endsWith('/')) rel += 'index.html';
    let file = path.join(DIR, ...rel.split('/').filter(Boolean));
    let status = 200;
    if (!file.startsWith(DIR)) return res.writeHead(403).end();
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      const asDir = path.join(file, 'index.html');
      if (fs.existsSync(asDir)) file = asDir;
      else if (MODE === 'spa' && !path.extname(rel)) file = path.join(DIR, 'index.html');
      else {
        file = path.join(DIR, '404.html');
        status = 404;
      }
    }
    res.writeHead(status, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, '127.0.0.1', () => console.log(`static host (${MODE}${PRETTY ? ', pretty URLs' : ''}) on http://localhost:${PORT}/ serving ${path.relative(process.cwd(), DIR) || DIR}`));
