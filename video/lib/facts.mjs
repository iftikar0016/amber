// Everything the demo video shows, read from committed files: the runs, the lock, the capture, git history,
// the gate log and the page suite. Plus the scene timeline, from the narration's own timings.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../src/config.mjs';
import { duration } from './media.mjs';

export const LEAD = 0.35; // silence before each scene's narration
export const TAIL = 0.65; // after it

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const ndjson = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
const lastSentence = (s) => s.split(/(?<=\.)\s+/).filter(Boolean).at(-1);

/** Scene start times and every spoken word's time, from the ElevenLabs alignment. */
export function timeline() {
  const script = readJson('video/script.json');
  const scenes = [];
  let t = 0;
  for (const s of script.scenes) {
    const audio = path.join(ROOT, '.amber', 'video', 'audio', `${s.id}.mp3`);
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, '.amber', 'video', 'audio', `${s.id}.json`), 'utf8'));
    if (meta.text !== s.narration) throw new Error(`${s.id}: narration changed since it was rendered; run node video/narrate.mjs`);
    const A = duration(audio);
    const dur = LEAD + A + TAIL + (s.hold ?? 0);
    const words = [];
    let cur = null;
    meta.chars.forEach((ch, i) => {
      if (/\s/.test(ch)) {
        if (cur) words.push(cur);
        cur = null;
        return;
      }
      if (!cur) cur = { w: '', s: +(t + LEAD + meta.starts[i]).toFixed(3) };
      cur.w += ch;
      cur.e = +(t + LEAD + meta.ends[i]).toFixed(3);
    });
    if (cur) words.push(cur);
    scenes.push({ id: s.id, start: +t.toFixed(3), dur: +dur.toFixed(3), audio, words });
    t += dur;
  }
  return { scenes, total: +t.toFixed(3) };
}

export function facts() {
  const spec = readJson('journeys.json');
  const lock = readJson('flows/flows.lock.json');
  const journeys = spec.journeys.map((j) => ({ id: j.id, short: j.id.slice(0, 3), title: j.title }));

  const capture = spec.journeys.map((j) => {
    const rec = lock.flows[j.id].record; // the capture run in which Kane passed this journey on the real server
    const r = readJson(`${rec}/result.json`);
    return { id: j.id, short: j.id.slice(0, 3), title: j.title, shot: `/__video/${rec}/${r.evidence.finalShot}`, tag: r.tag };
  });

  // A few of the recorded API exchanges, as the recording proxy kept them (bodies already scrubbed).
  const exchanges = [];
  for (const f of ['j01-sign-in', 'j02-projects', 'j06-kanban', 'j09-add-task', 'j15-comment']) {
    for (const e of ndjson(`capture/journeys/${f}.ndjson`)) {
      const note = e.reqBody && typeof e.reqBody === 'object' && 'password' in e.reqBody ? `password: ${e.reqBody.password}` : e.resBody && typeof e.resBody === 'object' && 'token' in e.resBody ? 'token: replaced with a demo token' : '';
      exchanges.push({ m: e.method, p: e.path + (e.query ? '?…' : ''), s: e.status, note });
    }
  }
  const lockRows = spec.journeys.map((j) => {
    const file = `flows/${j.id}_test.md`;
    return { file: `${j.id}_test.md`, sha: lock.flows[j.id].files[file].slice(0, 16) };
  });

  // j14: the wording Kane caught, before and after.
  const oldSpec = JSON.parse(git('show', 'c7145aa^:journeys.json'));
  const j14 = {
    before: lastSentence(oldSpec.journeys.find((j) => j.id === 'j14-new-project').steps),
    after: lastSentence(spec.journeys.find((j) => j.id === 'j14-new-project').steps),
    commit: 'c7145aa',
    why: git('log', '-1', '--format=%s', 'c7145aa'),
    shot: capture.find((c) => c.id === 'j14-new-project').shot,
  };

  const base = 'runs/verify-2026-11-23T15-33-57';
  const log = ndjson(`${base}/capsule-log/capsule-log.ndjson`);
  const wire = (flow) => {
    const e = log.find((x) => x.flow === flow && x.outcome === 'unanswered-write');
    return `${e.method} ${e.url} → ${e.status}, refused`;
  };
  const r09 = readJson(`${base}/j09-add-task/a1/result.json`);
  const r15 = readJson(`${base}/j15-comment/a1/result.json`);
  const off = r09.serverOff;

  // the repairs that fixed a journey, by round (round 1 fixed j01-j15, round 2 j16-j21)
  const repairs = git('log', '--reverse', '--format=%h%x09%s', '--grep=^capsule:')
    .split('\n')
    .map((l) => {
      const [sha, subject] = l.split('\t');
      return { sha, what: subject.replace(/^capsule:\s*/, '').replace(/\s*\(fixes.*$/, ''), flow: /fixes (j\d\d)/.exec(subject)?.[1] ?? '' };
    })
    .filter((c) => c.flow);
  const commits = repairs.filter((c) => Number(c.flow.slice(1)) <= 15);
  const commits2 = repairs.filter((c) => Number(c.flow.slice(1)) > 15);

  const hookCommand = readJson('.claude/settings.json').hooks.Stop[0].hooks[0].command.replace('"${CLAUDE_PROJECT_DIR}/', '').replace('"', '');
  const gate = ndjson('runs/gate.ndjson')
    .filter((e) => e.via === 'hook' && e.checked)
    .map((e) => ({ at: e.at.slice(11, 16) + ' UTC', outcome: e.outcome, runId: e.checked.runId, regressions: e.regressions, lines: (e.message || '').split('\n').slice(0, 2) }));

  const suite = readJson('runs/page-replay-2026-11-23T18-10-56/summary.json').results.map((r) => ({ id: r.id, verdict: r.verdict }));

  // Where each part of the recorded run starts, in the page's own event list.
  const events = readJson('capsule/amber/run-data.json').events;
  const idx = (pred, from = 0) => events.findIndex((e, i) => i >= from && pred(e));
  const firstCapsuleRun = idx((e) => e.kind === 'run' && e.target !== 'real server');
  const firstFix = idx((e) => e.kind === 'fix');
  const finalProof = idx((e) => e.kind === 'run' && /^final proof/.test(e.label || ''));
  const hookBlocked = idx((e) => e.kind === 'run' && e.label === 'stop-hook regression check', finalProof);
  const hookFix = idx((e) => e.kind === 'run', hookBlocked + 1);
  const hookAllowed = idx((e) => e.kind === 'run', hookFix + 1);
  // round 1 ends with the verdicts of the Stop hook's allowed run; everything after it is round 2
  const after = idx((e) => !(e.kind === 'verdict' && e.runId === events[hookAllowed].runId), hookAllowed + 1);
  const round1End = after < 0 ? events.length : after;
  const marks = { firstCapsuleRun, firstFix, finalProof, hookBlocked, hookFix, hookAllowed, round1End, end: events.length };

  const credits = ndjson('runs/credits.ndjson').reduce((a, e) => a + (e.spent || 0), 0);
  const runs = fs.readdirSync(path.join(ROOT, 'runs')).filter((d) => fs.statSync(path.join(ROOT, 'runs', d)).isDirectory()).length;

  return {
    journeys,
    capture,
    exchanges,
    lockRows,
    j14,
    serverOff: { port: off.before.port, portOpen: off.before.portOpen || off.after.portOpen, processes: off.before.vikunjaProcesses.length + off.after.vikunjaProcesses.length },
    j09: {
      run: 'verify-2026-11-23T15-33-57',
      tag: r09.tag,
      recordedTag: capture.find((c) => c.id === 'j09-add-task').tag,
      shot: `/__video/${base}/j09-add-task/a1/${r09.evidence.finalShot}`,
      say: r09.oneLiner,
      wire: wire('j09-add-task'),
      // in Kane's 1920x1080 screenshot: the add-task field holding the tag, and the list below it
      input: { x: 615, y: 164, w: 912, h: 38 },
      list: { x: 598, y: 148, w: 1024, h: 234 },
    },
    j15: {
      run: 'verify-2026-11-23T15-33-57',
      shot: `/__video/${base}/j15-comment/a1/${r15.evidence.finalShot}`,
      wire: wire('j15-comment'),
      draft: { x: 395, y: 784, w: 964, h: 124 }, // the comment editor holding the unsent draft
    },
    commits,
    commits2,
    finalCheck: 'verify-2026-11-25T10-17-26',
    hookCommand,
    gate,
    suite,
    marks,
    record: { credits: Math.round(credits * 100) / 100, runs, commits: Number(git('rev-list', '--count', 'HEAD')) },
  };
}
