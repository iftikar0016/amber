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

  function fail(message) {
    document.getElementById('app').innerHTML =
      '<p style="font:16px system-ui;max-width:32em;margin:4em auto;color:#333">' + message + '</p>';
  }

  if (!('serviceWorker' in navigator)) {
    fail('This capsule runs the app without a server, using a Service Worker. This browser (or a private window) does not allow one.');
    return;
  }
  if (navigator.serviceWorker.controller) startApp();
  else navigator.serviceWorker.addEventListener('controllerchange', startApp, { once: true });
  navigator.serviceWorker.register('/sw.js').catch((e) => fail('The capsule could not start its Service Worker: ' + e.message));

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
