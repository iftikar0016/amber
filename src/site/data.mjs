// @ts-check
// Builds the data AMBER's page plays: every Kane verdict on the capsule (and the capture against the real server),
// in time order, with the fix commits between them. Read from the committed runs/ folders and git history only.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RUNS_DIR } from '../config.mjs';
import { loadJourneys } from '../capture/capture.mjs';

const readNdjson = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

/** Commits whose subject starts with "capsule:" are repairs made in the loop. */
function fixCommits() {
  const r = spawnSync('git', ['log', '--reverse', '--format=%h%x09%ct%x09%s', '--grep=^capsule:'], { cwd: ROOT, encoding: 'utf8' });
  return (r.stdout || '')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [sha, ct, subject] = l.split('\t');
      return { sha, t: Number(ct) * 1000, subject };
    });
}

/**
 * @param {{copyShot?: (src:string, flow:string, runId:string)=>string|null}} [o]  copies a screenshot next to the page, returns its URL
 */
export function siteData(o = {}) {
  const spec = loadJourneys();
  const events = [];
  const runs = fs.existsSync(RUNS_DIR) ? fs.readdirSync(RUNS_DIR).filter((d) => /^(capture|verify)-/.test(d)).sort() : [];
  for (const runId of runs) {
    const summaryFile = path.join(RUNS_DIR, runId, 'summary.json');
    if (!fs.existsSync(summaryFile)) continue;
    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    const timeline = readNdjson(path.join(RUNS_DIR, runId, 'timeline.ndjson'));
    const start = timeline.find((e) => e.type === 'run_start');
    events.push({ t: start?.t ?? 0, kind: 'run', runId, target: summary.kind === 'capture' ? 'real server' : 'capsule, server off', mode: summary.mode ?? 'author', label: summary.label ?? null, commit: summary.commit ?? null });
    for (const d of timeline.filter((e) => e.type === 'flow_done' && e.verdict !== 'INCONCLUSIVE')) {
      const rec = path.join(RUNS_DIR, runId, d.flow, `a${d.attempt}`, 'result.json');
      const r = fs.existsSync(rec) ? JSON.parse(fs.readFileSync(rec, 'utf8')) : {};
      const shotSrc = r.evidence?.finalShot ? path.join(RUNS_DIR, runId, d.flow, `a${d.attempt}`, r.evidence.finalShot) : null;
      events.push({
        t: d.t,
        kind: 'verdict',
        runId,
        target: summary.kind === 'capture' ? 'real server' : 'capsule',
        flow: d.flow,
        verdict: d.verdict,
        oneLiner: r.oneLiner ?? null,
        bug: r.bug?.title ?? null,
        tag: r.tag ?? null,
        record: path.relative(ROOT, path.dirname(rec)).split(path.sep).join('/'),
        shot: shotSrc && fs.existsSync(shotSrc) && o.copyShot ? o.copyShot(shotSrc, d.flow, runId) : null,
      });
    }
  }
  for (const c of fixCommits()) events.push({ t: c.t, kind: 'fix', sha: c.sha, subject: c.subject });
  events.sort((a, b) => a.t - b.t);
  return {
    app: spec.app,
    generatedAt: new Date().toISOString(),
    journeys: spec.journeys.map((j) => ({ id: j.id, title: j.title, kind: j.kind, outcome: j.outcome, screen: screenOf(j.id) })),
    events,
  };
}

/** Which wireframe screen a journey ends on. */
function screenOf(id) {
  return (
    {
      'j01-sign-in': 'home',
      'j02-projects': 'projects',
      'j03-list-view': 'list',
      'j04-task-detail': 'task',
      'j05-table-view': 'table',
      'j06-kanban': 'kanban',
      'j07-upcoming': 'upcoming',
      'j08-search': 'task',
      'j09-add-task': 'list',
      'j10-mark-done': 'list',
      'j11-rename': 'list',
      'j12-description': 'task',
      'j13-delete': 'list',
      'j14-new-project': 'projects',
      'j15-comment': 'task',
    }[id] ?? 'home'
  );
}
