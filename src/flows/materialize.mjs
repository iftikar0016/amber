// @ts-check
// Kane writes the run's variable values into a saved flow's frontmatter (the test password and the run's tag among
// them), and frontmatter values win over every other source when the flow is replayed. So:
//   - the committed, frozen flow keeps the variable declarations but has every value blanked (no password in git);
//   - each replay runs a copy in .amber/ with this run's values filled in: the account from .amber/kane-vars.json and a
//     fresh {{amber_tag}}. Only frontmatter values differ from the frozen file; its steps are the frozen steps.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { FLOWS_DIR, KANE_CWD, KANE_VARS, STATE } from '../config.mjs';

/** The TestMu account a recording belongs to. Kane refuses to replay a recording from another org, so the IDs are
 * needed at run time, but they identify the account, so they are kept here (gitignored) and blanked in the repo. */
const ACCOUNT = path.join(STATE, 'kane-account.json');
const ACCOUNT_FIELDS = ['org_id', 'user_id'];
const RECORDING_FILES = ['meta.json', 'execution.json'];

/** Split a _test.md into its YAML frontmatter text and the rest. */
function splitFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) throw new Error('Saved flow has no frontmatter');
  return { yaml: m[1], body: text.slice(m[0].length) };
}

/** Set every variable's value in the frontmatter (a function of its name, e.g. "global.amber_tag"). */
function withValues(text, valueFor) {
  const { yaml, body } = splitFrontmatter(text);
  const doc = YAML.parseDocument(yaml);
  const vars = doc.get('variables');
  if (vars && YAML.isMap(vars)) {
    for (const item of vars.items) {
      const name = String(/** @type {any} */ (item.key).value ?? item.key);
      const entry = /** @type {any} */ (item.value);
      if (entry && YAML.isMap(entry)) entry.set('value', valueFor(name));
    }
  }
  return `---\n${doc.toString().trimEnd()}\n---\n${body.startsWith('\n') ? '' : '\n'}${body}`;
}

/** The short variable name inside a Kane namespace: "secrets.user.amber_password" -> "amber_password". */
const shortName = (name) => name.split('.').pop();

/** The committed form of a flow Kane saved: variable values blanked. */
export function sanitizeSavedFlow(text) {
  return withValues(text, () => '');
}

/** Blank the account IDs in a saved recording (output-<id>/.internal), keeping them in .amber/kane-account.json. */
export function sanitizeRecording(outputDir) {
  const account = fs.existsSync(ACCOUNT) ? JSON.parse(fs.readFileSync(ACCOUNT, 'utf8')) : {};
  for (const n of RECORDING_FILES) {
    const p = path.join(outputDir, '.internal', n);
    if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const k of ACCOUNT_FIELDS) {
      if (j[k]) {
        if (account[k] && account[k] !== j[k]) throw new Error(`Recording ${p} belongs to a different TestMu account (${k})`);
        account[k] = j[k];
        j[k] = '';
      }
    }
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  }
  fs.mkdirSync(STATE, { recursive: true });
  fs.writeFileSync(ACCOUNT, JSON.stringify(account, null, 2));
}

function restoreAccount(outputDir) {
  if (!fs.existsSync(ACCOUNT)) throw new Error('No .amber/kane-account.json: the saved recordings cannot be tied to your Kane account (re-capture the flows with your account)');
  const account = JSON.parse(fs.readFileSync(ACCOUNT, 'utf8'));
  for (const n of RECORDING_FILES) {
    const p = path.join(outputDir, '.internal', n);
    if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const k of ACCOUNT_FIELDS) if (k in j) j[k] = account[k] ?? '';
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  }
}

/** The frozen file's body (steps), which a run copy must match exactly. */
export function stepsOf(text) {
  return splitFrontmatter(text).body.trim();
}

/**
 * Copy a frozen flow and its recording into .amber/kane/runs/<id>/ with this run's values, ready for testmd run.
 * @returns {string} the path of the run copy's _test.md
 */
export function materialize(id, tag) {
  const vars = JSON.parse(fs.readFileSync(KANE_VARS, 'utf8'));
  const values = { amber_user: vars.amber_user.value, amber_password: vars.amber_password.value, amber_tag: tag };
  const src = path.join(FLOWS_DIR, `${id}_test.md`);
  const frozen = fs.readFileSync(src, 'utf8');
  const copy = withValues(frozen, (name) => {
    const v = values[shortName(name)];
    if (v === undefined) throw new Error(`Flow ${id} uses a variable AMBER does not supply: ${name}`);
    return v;
  });
  if (stepsOf(copy) !== stepsOf(frozen)) throw new Error(`Run copy of ${id} differs from the frozen flow outside its variable values`);
  const dir = path.join(KANE_CWD, 'runs', id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, `${id}_test.md`);
  fs.writeFileSync(dest, copy);
  const out = path.join(FLOWS_DIR, `output-${id}`);
  if (fs.existsSync(out)) {
    fs.cpSync(out, path.join(dir, `output-${id}`), { recursive: true });
    restoreAccount(path.join(dir, `output-${id}`));
  }
  return dest;
}
