// @ts-check
// Seeds the real Vikunja with a test account and a small, readable data set.
// The generated password lives only in .amber/credentials.json and .amber/kane-vars.json (both gitignored).
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CREDENTIALS, KANE_VARS, STATE, VIKUNJA } from './config.mjs';

const BASE = `http://${VIKUNJA.host}:${VIKUNJA.port}/api/v1`;
const IDS_FILE = path.join(STATE, 'seed-ids.json');

async function call(method, p, body, token) {
  const r = await fetch(BASE + p, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${text.slice(0, 200)}`);
  return json;
}

/** Noon UTC, n days from now: stays inside "this week" for the Upcoming page whatever the hour. */
const inDays = (n) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().replace('.000Z', 'Z');
};

export const PLAN = {
  'Website relaunch': [
    { title: 'Write homepage copy' },
    { title: 'Pick a colour palette' },
    { title: 'Set up analytics', description: '<p>Use a privacy-friendly tool. No cookie banner.</p>' },
    { title: 'Review pricing page', dueInDays: 4 },
    { title: 'Launch checklist', label: 'urgent' },
  ],
  'Kitchen renovation': [
    { title: 'Get three quotes', comment: 'Two quotes in so far, waiting on the third.' },
    { title: 'Choose worktop' },
    { title: 'Order tiles', dueInDays: 2 },
    { title: 'Book electrician', dueInDays: 6 },
  ],
  'Reading list': [
    { title: 'The Pragmatic Programmer' },
    { title: 'Designing Data-Intensive Applications' },
    { title: 'A Philosophy of Software Design' },
  ],
};

export function readCredentials() {
  return JSON.parse(fs.readFileSync(CREDENTIALS, 'utf8'));
}

export async function login() {
  const c = readCredentials();
  const { token } = await call('POST', '/login', { username: c.username, password: c.password });
  return token;
}

/** Register the account and create the projects, tasks, label, description and comment. */
export async function seed() {
  fs.mkdirSync(STATE, { recursive: true });
  const creds = { username: 'amber', email: 'amber@example.test', password: randomBytes(12).toString('base64url') + 'aA1!' };
  await call('POST', '/register', creds);
  fs.writeFileSync(CREDENTIALS, JSON.stringify(creds, null, 2));
  fs.writeFileSync(
    KANE_VARS,
    JSON.stringify({ amber_user: { value: creds.username, secret: false }, amber_password: { value: creds.password, secret: true } }, null, 2),
  );
  const token = await login();

  const me = await call('GET', '/user', undefined, token);
  await call('POST', '/user/settings/general', { ...me.settings, name: 'Amber Demo' }, token);

  const label = await call('PUT', '/labels', { title: 'urgent', hex_color: 'e8445a' }, token);
  const ids = { projects: {}, tasks: {}, labels: { urgent: label.id }, due: {} };
  for (const [title, tasks] of Object.entries(PLAN)) {
    const p = await call('PUT', '/projects', { title }, token);
    ids.projects[title] = p.id;
    for (const t of tasks) {
      const body = { title: t.title, ...(t.description ? { description: t.description } : {}), ...(t.dueInDays ? { due_date: inDays(t.dueInDays) } : {}) };
      const task = await call('PUT', `/projects/${p.id}/tasks`, body, token);
      ids.tasks[t.title] = task.id;
      if (t.dueInDays) ids.due[task.id] = t.dueInDays;
      if (t.label) await call('PUT', `/tasks/${task.id}/labels`, { label_id: label.id }, token);
      if (t.comment) await call('PUT', `/tasks/${task.id}/comments`, { comment: t.comment }, token);
    }
  }
  fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2));
  return { username: creds.username, projects: Object.keys(ids.projects).length, tasks: Object.keys(ids.tasks).length };
}

/**
 * Move the seeded due dates to "n days from now" (direct to Vikunja, never through the recording proxy).
 * Run after every database restore, so the Upcoming page has the same tasks whichever day a journey runs.
 */
export async function alignDueDates() {
  const ids = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8'));
  const token = await login();
  for (const [taskId, n] of Object.entries(ids.due)) {
    const task = await call('GET', `/tasks/${taskId}`, undefined, token);
    await call('POST', `/tasks/${taskId}`, { ...task, due_date: inDays(Number(n)) }, token);
  }
  return Object.keys(ids.due).length;
}
