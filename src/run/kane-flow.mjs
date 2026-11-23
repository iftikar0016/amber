// @ts-check
// One Kane invocation for one flow: an authored run (kane-cli run) or a replay of a frozen flow (testmd run).
// Writes a committed, scrubbed record to runs/<runId>/<flow>/a<attempt>/ and timeline events.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { KANE_CWD, KANE_VARS, ROOT, RUNS_DIR } from '../config.mjs';
import { runKane, normaliseSessionDir, sessionDirFor } from '../kane/spawn.mjs';
import { stepsTaken } from '../kane/ndjson.mjs';
import { locatePack, extractPack } from '../kane/evidence.mjs';
import { verdict } from './verdict.mjs';

export const TIMEOUT_SEC = 300;
export const MAX_STEPS = 30;

/** Pairs of [text that must never be committed, what replaces it]: the test password, and this machine's home folder. */
function replacements() {
  const home = os.homedir();
  /** @type {[string,string][]} */
  const out = [home, home.replace(/\\/g, '/'), home.replace(/\\/g, '\\\\')].map((h) => [h, '~']);
  try {
    const v = JSON.parse(fs.readFileSync(KANE_VARS, 'utf8'));
    for (const x of Object.values(v)) if (x?.secret && x.value && String(x.value).length >= 6) out.push([String(x.value), '[scrubbed]']);
  } catch {
    /* no vars yet */
  }
  return out;
}

/** Replace sensitive strings in every text file under dir. */
export function scrubTree(dir) {
  const pairs = replacements();
  for (const rel of /** @type {string[]} */ (fs.readdirSync(dir, { recursive: true }))) {
    const abs = path.join(dir, rel);
    if (!fs.statSync(abs).isFile() || /\.(jpe?g|png|webp)$/i.test(abs)) continue;
    const before = fs.readFileSync(abs, 'utf8');
    let text = before;
    for (const [s, r] of pairs) text = text.split(s).join(r);
    if (text !== before) fs.writeFileSync(abs, text);
  }
}

/**
 * Six random letters, fresh for every Kane run. Write journeys type values containing {{amber_tag}}, so a capsule that
 * replays a recorded write shows the recording's tag, not this run's, and the journey fails.
 */
export function newTag() {
  const a = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => a[b % 26]).join('');
}

/**
 * Variables for one run: the account (from .amber/kane-vars.json) plus this run's tag.
 * Authored runs read them from --variables-file; saved-flow replays (testmd has no variables flag) from the
 * variable pool in Kane's working folder, .testmuai/variables/ (gitignored).
 */
function runVariables(cwd, tag) {
  const base = JSON.parse(fs.readFileSync(KANE_VARS, 'utf8'));
  const vars = { ...base, amber_tag: { value: tag, secret: false } };
  const file = path.join(path.dirname(KANE_VARS), 'kane-vars-run.json');
  fs.writeFileSync(file, JSON.stringify(vars, null, 2));
  const poolDir = path.join(cwd, '.testmuai', 'variables');
  fs.mkdirSync(poolDir, { recursive: true });
  fs.writeFileSync(path.join(poolDir, 'amber.json'), JSON.stringify(vars, null, 2));
  return file;
}

export function timelineWriter(runId) {
  const dir = path.join(RUNS_DIR, runId);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'timeline.ndjson');
  return (e) => fs.appendFileSync(file, JSON.stringify({ t: Date.now(), ...e }) + '\n');
}

/**
 * @param {{runId:string, flow:string, attempt:number, mode:'author'|'replay',
 *          objective?:string, name?:string, file?:string, cwd?:string, extraArgs?:string[],
 *          serverOff?:()=>Promise<{off:boolean}>, leaks?:()=>number, emit?:(e:any)=>void}} o
 */
export async function runFlow(o) {
  const emit = o.emit ?? (() => {});
  const outDir = path.join(RUNS_DIR, o.runId, o.flow, `a${o.attempt}`);
  fs.mkdirSync(outDir, { recursive: true });
  const cwd = o.cwd ?? KANE_CWD;
  const tag = newTag();
  const varsFile = runVariables(cwd, tag);
  const args =
    o.mode === 'author'
      ? ['run', /** @type {string} */ (o.objective), '--agent', '--headless', '--timeout', String(TIMEOUT_SEC), '--max-steps', String(MAX_STEPS), '--variables-file', varsFile, ...(o.name ? ['--name', o.name] : [])]
      : ['testmd', 'run', /** @type {string} */ (o.file), '--agent', '--headless', '--no-adaptive-heal'];
  args.push(...(o.extraArgs ?? []));

  const serverOffBefore = o.serverOff ? await o.serverOff() : null;
  emit({ type: 'flow_start', flow: o.flow, attempt: o.attempt, mode: o.mode, tag });
  const started = Date.now();
  const res = await runKane({
    args,
    cwd,
    timeoutSec: TIMEOUT_SEC,
    onEvent: (e) => {
      if (e.kind === 'step' && (e.status === 'done' || e.status === 'failed')) emit({ type: 'flow_step', flow: o.flow, attempt: o.attempt, n: e.step, status: e.status, remark: String(e.remark ?? '').slice(0, 200) });
    },
  });
  const ms = Date.now() - started;
  const serverOffAfter = o.serverOff ? await o.serverOff() : null;
  const serverOff = serverOffBefore && serverOffAfter ? { off: serverOffBefore.off && serverOffAfter.off, before: serverOffBefore, after: serverOffAfter } : null;

  // Inner run_end events close individual steps of a testmd replay; the run's own end is test_md_done.
  const runEnds = res.events.filter((e) => e.type === 'run_end');
  const terminal = res.terminal;
  const sessionDir = normaliseSessionDir(terminal?.session_dir) ?? sessionDirFor(res.sessionId);
  let extracted = null;
  const pack = locatePack(sessionDir);
  if (pack) {
    try {
      extracted = extractPack(pack, outDir, (rel) => rel);
    } catch (e) {
      extracted = { error: String(e) };
    }
  }
  const leaks = o.leaks ? o.leaks() : 0;
  const v = verdict({ exitCode: res.exitCode, killed: res.killed, terminal, serverOff, leaks, mode: o.mode });
  const credits = terminal?.credits_consumed ?? runEnds.reduce((a, e) => a + (Number(e.credits_consumed) || 0), 0);

  const record = {
    flow: o.flow,
    attempt: o.attempt,
    mode: o.mode,
    tag,
    args: args.map((a) => (a === varsFile ? '.amber/kane-vars-run.json' : a)),
    startedAt: new Date(started).toISOString(),
    ms,
    exitCode: res.exitCode,
    killed: res.killed,
    status: terminal?.type === 'test_md_done' ? terminal.overall_status : terminal?.status ?? null,
    oneLiner: terminal?.one_liner ?? null,
    summary: terminal?.summary ?? null,
    reason: terminal?.reason ?? null,
    resultCode: terminal?.result_code ?? null,
    bug: terminal?.verdict ?? null,
    finalState: terminal?.final_state ?? null,
    credits,
    steps: stepsTaken(res.events),
    failedSteps: res.events.filter((e) => e.kind === 'step' && e.status === 'failed').map((e) => ({ n: e.step, remark: e.remark })),
    testmdSummary: res.events.find((e) => e.type === 'test_md_summary') ?? null,
    serverOff,
    leaks,
    ...v,
    evidence: extracted ? { steps: extracted.steps?.length ?? 0, finalShot: extracted.finalShot ?? null, failures: extracted.failures ?? [], error: extracted.error } : null,
  };
  fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(record, null, 2));
  // Kane's own stream, minus the account-identifying fields.
  const stream = res.events.map(({ test_url, share_url, session_dir, run_dir, context, ...rest }) => rest);
  fs.writeFileSync(path.join(outDir, 'kane-events.ndjson'), stream.map((e) => JSON.stringify(e)).join('\n') + '\n');
  if (extracted && !extracted.error) {
    fs.writeFileSync(path.join(outDir, 'steps.json'), JSON.stringify(extracted.steps, null, 2));
    fs.writeFileSync(path.join(outDir, 'failure.json'), JSON.stringify(extracted.failures, null, 2));
    fs.writeFileSync(path.join(outDir, 'actions.json'), JSON.stringify(extracted.actions, null, 2));
    fs.writeFileSync(path.join(outDir, 'network.json'), JSON.stringify(extracted.har, null, 2));
    fs.writeFileSync(path.join(outDir, 'console.json'), JSON.stringify(extracted.console, null, 2));
  }
  fs.writeFileSync(path.join(outDir, 'stderr.txt'), res.stderr.join('\n'));
  scrubTree(outDir);
  emit({ type: 'flow_done', flow: o.flow, attempt: o.attempt, mode: o.mode, verdict: record.verdict, basis: record.basis, reasons: record.reasons, credits, ms, shot: record.evidence?.finalShot ? path.relative(RUNS_DIR, path.join(outDir, record.evidence.finalShot)).split(path.sep).join('/') : null });
  return { record, outDir, sessionDir };
}

export const relToRoot = (p) => path.relative(ROOT, p).split(path.sep).join('/');
