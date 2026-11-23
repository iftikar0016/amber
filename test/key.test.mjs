// The build (Node) and the Service Worker (browser) must agree on what a request "means".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { requestKey } from '../src/capsule/build.mjs';

function storeKey() {
  const self = { location: { origin: 'http://127.0.0.1:4790' } };
  vm.runInNewContext(fs.readFileSync(new URL('../capsule-src/amber/store.js', import.meta.url), 'utf8'), { self, URL, Date, Math, JSON, Headers: class {}, Response: class {} });
  return self.AmberStore.key;
}

const upcoming = (ts1, ts2) =>
  `/api/v2/tasks?sort_by=due_date&sort_by=id&order_by=asc&order_by=desc&filter=done%20%3D%20false%20%26%26%20due_date%20%3C%20%27${ts1}%27%20%26%26%20due_date%20%3E%20%27${ts2}%27&filter_include_nulls=false&page=1`;

test('build and Service Worker compute the same key', () => {
  const key = storeKey();
  for (const u of ['/api/v2/projects?is_archived=true&expand=permissions&page=1', '/api/v2/info', upcoming('2026-11-30T14:01:07.785Z', '2026-11-23T14:01:07.785Z'), '/api/v2/avatar/amber?size=40']) {
    const url = new URL(u, 'http://127.0.0.1:4790');
    assert.equal(key('GET', url), requestKey('GET', url.pathname, url.search), u);
  }
});

test('timestamps in query values are matched by meaning, everything else exactly', () => {
  const a = upcoming('2026-11-30T14:01:07.785Z', '2026-11-23T14:01:07.785Z');
  const b = upcoming('2027-01-09T08:00:00.000Z', '2027-01-02T08:00:00.000Z');
  assert.equal(requestKey('GET', ...split(a)), requestKey('GET', ...split(b)));
  assert.notEqual(requestKey('GET', '/api/v2/projects/2', ''), requestKey('GET', '/api/v2/projects/3', ''));
  assert.equal(requestKey('GET', '/api/v2/x', '?b=2&a=1'), requestKey('GET', '/api/v2/x', '?a=1&b=2'));
});

function split(u) {
  const i = u.indexOf('?');
  return [u.slice(0, i), u.slice(i)];
}
