/* AMBER capsule boot. Runs before Vikunja's own scripts:
 *   - points the app at its own origin (the Service Worker answers /api/v2 there)
 *   - replaces the app's live-update WebSocket with a silent stand-in (a Service Worker cannot answer WebSockets)
 *   - waits until the Service Worker controls the page, then starts the app, so not one API call escapes
 */
(() => {
  // Vikunja keeps the API address in localStorage and ties the signed-in session to it, so it is set to
  // this page's origin (not cleared: clearing it on every load makes a reload look like a different server).
  window.API_URL = '';
  try {
    if (localStorage.getItem('API_URL') !== location.origin) localStorage.setItem('API_URL', location.origin);
  } catch {
    /* storage blocked */
  }

  const RealWebSocket = window.WebSocket;
  class StandInSocket extends EventTarget {
    constructor(url) {
      super();
      this.url = String(url);
      this.readyState = 0;
      this.protocol = '';
      this.extensions = '';
      this.bufferedAmount = 0;
      this.binaryType = 'blob';
      setTimeout(() => {
        this.readyState = 1;
        const e = new Event('open');
        this.onopen && this.onopen(e);
        this.dispatchEvent(e);
      }, 0);
    }
    send() {
      /* nothing is listening: there is no server */
    }
    close(code = 1000, reason = '') {
      if (this.readyState >= 2) return;
      this.readyState = 3;
      const e = new CloseEvent('close', { code, reason, wasClean: true });
      this.onclose && this.onclose(e);
      this.dispatchEvent(e);
    }
  }
  Object.assign(StandInSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  window.WebSocket = function (url, protocols) {
    const u = new URL(String(url), location.href);
    if (u.host === location.host && u.pathname.startsWith('/api/')) return new StandInSocket(u.href);
    return new RealWebSocket(url, protocols);
  };
  Object.assign(window.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  window.WebSocket.prototype = RealWebSocket.prototype;

  /**
   * A visitor who opens the capsule anywhere except /login starts signed in as the demo user, the way a demo should.
   * The token is JWT-shaped because Vikunja reads its claims; nothing checks a signature, because there is no server.
   * Kane's journeys start at /login and sign in through the form, so they are unaffected.
   */
  async function autoSignIn() {
    try {
      if (localStorage.getItem('token') || location.pathname.replace(/\/+$/, '') === '/login') return;
      const u = await (await fetch('/amber/demo-user.json', { cache: 'no-store' })).json();
      const b64 = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const now = Math.floor(Date.now() / 1000);
      const claims = { exp: now + 3600, iat: now, id: u.id, is_admin: false, jti: crypto.randomUUID(), sid: crypto.randomUUID(), type: 1, username: u.username };
      localStorage.setItem('token', b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64(claims) + '.amber-capsule-unsigned');
    } catch {
      /* storage blocked: the visitor signs in on the login page with any password */
    }
  }

  async function startApp() {
    if (window.__amberStarted) return;
    window.__amberStarted = true;
    await autoSignIn();
    for (const s of document.querySelectorAll('script[type="amber/deferred-module"]')) {
      const el = document.createElement('script');
      el.type = 'module';
      el.crossOrigin = '';
      el.src = s.dataset.src;
      document.body.appendChild(el);
    }
  }

  /** Instead of a blank app: what the capsule needs, and the recorded run, which needs no Service Worker. */
  function fail(reason) {
    if (window.__amberStarted) return;
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    document.title = 'AMBER: this browser could not start the capsule';
    document.getElementById('app').innerHTML =
      '<div style="min-height:100vh;box-sizing:border-box;display:grid;place-items:center;background:#0a0806;color:#f3e6cf;font:17px/1.55 system-ui,sans-serif;padding:24px 16px">' +
      '<div style="max-width:36em">' +
      '<p style="font:600 13px/1.4 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#b9a68a;margin:0 0 18px">AMBER · Vikunja with no server</p>' +
      '<h1 style="font:400 30px/1.2 Georgia,serif;margin:0 0 16px">This browser could not start the capsule.</h1>' +
      '<p>The capsule runs Vikunja without a server: a <b>Service Worker</b> in your browser answers every API call, and this browser did not let it start' +
      (reason ? ' (<span style="color:#ff8a9a">' + esc(reason) + '</span>)' : '') +
      '.</p><p>It needs a browser that allows Service Workers: a normal (not private) window of a current desktop browser, on https or localhost. Some in-app and embedded browser views do not allow them at all.</p>' +
      '<p style="margin-top:28px"><a href="/amber/" style="color:#ffd36b;font-weight:600">Watch the recorded run instead →</a><br>' +
      '<span style="color:#b9a68a;font-size:15px">The amber block replays every Kane run and shows Kane\'s evidence. It needs no Service Worker.</span></p>' +
      '</div></div>';
  }

  if (!('serviceWorker' in navigator)) {
    fail('Service Workers are not available here');
    return;
  }
  if (navigator.serviceWorker.controller) startApp();
  else navigator.serviceWorker.addEventListener('controllerchange', startApp, { once: true });
  const RELOADED = 'amber-reloaded-once';
  navigator.serviceWorker.register('/sw.js').then(
    () =>
      // A hard reload (Shift+Reload) bypasses an installed Service Worker for that one page load, and no
      // controllerchange follows, so the app would wait forever. One ordinary reload brings the worker back.
      setTimeout(() => {
        if (window.__amberStarted || navigator.serviceWorker.controller) return;
        let again = false;
        try {
          again = sessionStorage.getItem(RELOADED) === '1';
          sessionStorage.setItem(RELOADED, '1');
        } catch {
          again = true;
        }
        if (again) fail('the Service Worker is installed but does not control this page');
        else location.reload();
      }, 2500),
    (e) => fail(e.message),
  );
  navigator.serviceWorker.ready.then(() => {
    try {
      if (navigator.serviceWorker.controller) sessionStorage.removeItem(RELOADED);
    } catch {
      /* storage blocked */
    }
  });

  // A "Reset demo" hook for pages that embed the capsule: postMessage({type:'amber-reset'}) from the parent.
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'amber-reset' && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'amber-reset' });
      navigator.serviceWorker.addEventListener('message', function done(m) {
        if (m.data && m.data.type === 'amber-reset-done') {
          navigator.serviceWorker.removeEventListener('message', done);
          location.reload();
        }
      });
    }
  });
})();
