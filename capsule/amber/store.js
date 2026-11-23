/* AMBER capsule store.
 * seed.json (built from Kane's capture) holds:
 *   meta    capture time, the demo user, app version
 *   replay  GET responses captured before any write in their journey, keyed by meaning (see key())
 *   model   entities lifted from those responses, for the routes in handlers.js to read and change
 * The mutable state lives in IndexedDB: Chrome stops an idle Service Worker, and a reload must not lose a change.
 * All captured dates are moved forward by whole days to "now", once, when the state is created.
 */
(() => {
  const DB = 'amber-capsule';
  const OS = 'kv';
  const KEY = 'state';
  const DAY = 86400000;
  const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:\d\d)$/;
  let seed = null;
  let state = null;
  let loading = null;
  let saveTimer = null;

  function idb() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(OS);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async function idbGet(k) {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const r = db.transaction(OS).objectStore(OS).get(k);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async function idbPut(k, v) {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const t = db.transaction(OS, 'readwrite');
      t.objectStore(OS).put(v, k);
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }

  /** Move every real timestamp in a JSON value by ms (Vikunja's "no date" is 0001-01-01 and stays). */
  function shiftDates(v, ms) {
    if (!ms) return v;
    if (Array.isArray(v)) return v.map((x) => shiftDates(x, ms));
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v)) o[k] = shiftDates(v[k], ms);
      return o;
    }
    if (typeof v === 'string' && ISO.test(v) && !v.startsWith('0001-')) {
      return new Date(Date.parse(v) + ms).toISOString().replace('.000Z', 'Z');
    }
    return v;
  }

  /**
   * A request's meaning: method, path and sorted query, with any timestamp inside a query value
   * replaced by <ts>. Upcoming asks for "due before <now + 7 days>", a different string on every load.
   */
  function key(method, url) {
    const u = typeof url === 'string' ? new URL(url, self.location.origin) : url;
    const pairs = [...u.searchParams.entries()].map(([k, v]) => [k, v.replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:\d\d)?/g, '<ts>')]);
    pairs.sort((a, b) => (a[0] + '=' + a[1] < b[0] + '=' + b[1] ? -1 : 1));
    return method + ' ' + u.pathname + (pairs.length ? '?' + pairs.map(([k, v]) => k + '=' + v).join('&') : '');
  }

  function fresh() {
    const shiftMs = Math.round((Date.now() - Date.parse(seed.meta.capturedAt)) / DAY) * DAY;
    return { seedId: seed.meta.seedId, createdAt: new Date().toISOString(), shiftMs, model: shiftDates(JSON.parse(JSON.stringify(seed.model || {})), shiftMs) };
  }

  async function load() {
    if (state) return;
    if (!loading) {
      loading = (async () => {
        seed = await (await fetch('/amber/seed.json', { cache: 'no-store' })).json();
        let saved = null;
        try {
          saved = await idbGet(KEY);
        } catch {
          /* private mode: memory only */
        }
        state = saved && saved.seedId === seed.meta.seedId ? saved : fresh();
      })();
    }
    await loading;
  }

  /** Persist soon (writes in one interaction are batched); returns when written. */
  function save() {
    clearTimeout(saveTimer);
    return new Promise((resolve) => {
      saveTimer = setTimeout(() => idbPut(KEY, state).then(resolve, resolve), 30);
    });
  }

  async function reset() {
    await load();
    state = fresh();
    await idbPut(KEY, state).catch(() => {});
  }

  /** The captured response for a request with the same meaning, dates moved to now. */
  async function replay(method, url) {
    const k = key(method, url);
    const hit = seed.replay[k];
    if (!hit) return null;
    const headers = new Headers(hit.headers || {});
    if (hit.bodyFile) {
      const blob = await (await fetch('/amber/files/' + hit.bodyFile)).blob();
      return { how: 'captured-file', response: new Response(blob, { status: hit.status, headers }) };
    }
    const body = typeof hit.body === 'string' ? hit.body : JSON.stringify(shiftDates(hit.body, state.shiftMs));
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    const u = typeof url === 'string' ? new URL(url, self.location.origin) : url;
    return { how: hit.url === u.pathname + u.search ? 'exact' : 'by-meaning', response: new Response(body, { status: hit.status, headers }) };
  }

  self.AmberStore = {
    load,
    save,
    reset,
    replay,
    key,
    shiftDates,
    get model() {
      return state.model;
    },
    get state() {
      return state;
    },
    get seed() {
      return seed;
    },
  };
})();
