// @ts-check
// Ported from Bad Day (github.com/iftikar0016/badday, MIT, same author).
// Locates a Kane evidence pack and extracts a whitelist of artifacts.
// Never copies the raw pack or result.yaml: they carry account identity.
import fs from 'node:fs';
import path from 'node:path';
import { unzipSync } from 'fflate';
import YAML from 'yaml';

/** Find the pack under <session_dir>/evidence: a zip file, or an unsealed directory. */
export function locatePack(sessionDir) {
  if (!sessionDir) return null;
  const dir = path.join(sessionDir, 'evidence');
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((n) => n.endsWith('.evidence'));
  return hit ? path.join(dir, hit) : null;
}

/** Read a pack into a map of relative path → Buffer. */
export function readPack(packPath) {
  /** @type {Map<string, Buffer>} */
  const files = new Map();
  if (fs.statSync(packPath).isDirectory()) {
    for (const rel of /** @type {string[]} */ (fs.readdirSync(packPath, { recursive: true }))) {
      const abs = path.join(packPath, rel);
      if (fs.statSync(abs).isFile()) files.set(rel.split(path.sep).join('/'), fs.readFileSync(abs));
    }
  } else {
    const wanted = /(steps\/[^/]+\/(screenshot\.(jpg|png)|annotated\.png|step\.json|failure\.yaml)|logs\/\d+-(network\.har|console\.ndjson|actions\.ndjson)|result\.yaml)$/;
    const zipped = unzipSync(fs.readFileSync(packPath), { filter: (f) => wanted.test(f.name) });
    for (const [name, data] of Object.entries(zipped)) files.set(name, Buffer.from(data));
  }
  return files;
}

/**
 * Extract the artifacts AMBER keeps into outDir.
 * @param {string} packPath
 * @param {string} outDir
 * @param {(rel:string)=>string} urlFor  maps a path relative to outDir to a dashboard URL
 */
export function extractPack(packPath, outDir, urlFor) {
  const files = readPack(packPath);
  fs.mkdirSync(path.join(outDir, 'shots'), { recursive: true });

  const stepDirs = new Map();
  for (const name of files.keys()) {
    const m = /tests\/([^/]+)\/steps\/(\d+)-([^/]+)\/([^/]+)$/.exec(name);
    if (!m) continue;
    const key = `${m[1]}/${m[2]}`;
    if (!stepDirs.has(key)) stepDirs.set(key, { test: m[1], ordinal: Number(m[2]), id: m[3], files: {} });
    stepDirs.get(key).files[m[4]] = name;
  }

  const steps = [];
  const failures = [];
  for (const s of [...stepDirs.values()].sort((a, b) => a.ordinal - b.ordinal)) {
    let meta = {};
    if (s.files['step.json']) {
      try { meta = JSON.parse(files.get(s.files['step.json']).toString('utf8')); } catch { /* skip */ }
    }
    const shotName = s.files['screenshot.jpg'] ?? s.files['screenshot.png'];
    let shot = null;
    let annotated = null;
    if (shotName) {
      const rel = `shots/${s.ordinal}${path.extname(shotName)}`;
      fs.writeFileSync(path.join(outDir, rel), files.get(shotName));
      shot = urlFor(rel);
    }
    if (s.files['annotated.png']) {
      const rel = `shots/${s.ordinal}.annotated.png`;
      fs.writeFileSync(path.join(outDir, rel), files.get(s.files['annotated.png']));
      annotated = urlFor(rel);
    }
    if (s.files['failure.yaml']) {
      try {
        const f = YAML.parse(files.get(s.files['failure.yaml']).toString('utf8')) ?? {};
        failures.push({
          ordinal: s.ordinal,
          message: f.error?.message ?? null,
          url: f.page_state?.url ?? null,
          rootCause: f.triage?.rca?.root_cause ?? null,
          suggestedFix: f.triage?.suggested_fix?.summary ?? null,
        });
      } catch { /* skip */ }
    }
    steps.push({
      ordinal: s.ordinal,
      id: meta.id ?? s.id,
      kind: meta.kind ?? null,
      status: meta.status ?? null,
      summary: meta.summary ?? null,
      url: meta.url ?? null,
      durationMs: meta.duration_ms ?? null,
      shot,
      annotated,
    });
  }

  const har = [];
  const consoleLines = [];
  /** Kane's own record of what it did: the intent text survives even when the step summary says just "click". */
  const actions = [];
  for (const [name, buf] of files) {
    if (/logs\/\d+-actions\.ndjson$/.test(name)) {
      for (const line of buf.toString('utf8').split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const a = JSON.parse(line);
          actions.push({ step: a.step ?? null, type: a.action_type ?? null, intent: String(a.intent ?? '').slice(0, 300), instruction: a.action_instruction ?? null });
        } catch { /* skip */ }
      }
    }
    if (/logs\/\d+-network\.har$/.test(name)) {
      try {
        for (const e of JSON.parse(buf.toString('utf8')).log?.entries ?? []) {
          const u = new URL(e.request.url);
          if (u.pathname.startsWith('/__amber/')) continue;
          har.push({
            step: e._step ?? null,
            method: e.request.method,
            path: u.pathname,
            status: e.response?.status ?? null,
            resourceType: e._resource_type ?? null,
            failed: Boolean(e._failed),
            fault: (e.response?.headers ?? []).find((h) => h.name.toLowerCase() === 'x-amber-fault')?.value ?? null,
          });
        }
      } catch { /* skip */ }
    }
    if (/logs\/\d+-console\.ndjson$/.test(name)) {
      for (const line of buf.toString('utf8').split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const c = JSON.parse(line);
          if (c.marker) continue;
          if (String(c.url ?? '').includes('/__amber/')) continue;
          consoleLines.push({ level: c.level, text: c.text, step: c.step ?? null });
        } catch { /* skip */ }
      }
    }
  }

  const finalShot = [...steps].reverse().find((s) => s.shot)?.shot ?? null;
  return { steps, failures, har, console: consoleLines, actions, finalShot };
}

/** Screenshots that already exist in a live (unsealed) session, newest last. */
export function liveShots(sessionDir) {
  if (!sessionDir || !fs.existsSync(sessionDir)) return [];
  const out = [];
  let names = [];
  try {
    names = /** @type {string[]} */ (fs.readdirSync(sessionDir, { recursive: true }));
  } catch {
    return out;
  }
  for (const rel of names) {
    const m = /steps[\\/](\d+)-[^\\/]+[\\/]screenshot\.(jpg|png)$/.exec(rel);
    if (m) out.push({ ordinal: Number(m[1]), file: path.join(sessionDir, rel) });
  }
  return out.sort((a, b) => a.ordinal - b.ordinal);
}
