/* AMBER capsule routes: the requests the capsule answers from its own state instead of the capture.
 * The coding agent adds to this file in the repair loop, one interaction per commit.
 * A route returns a Response, or null to fall through to the captured replay.
 */
(() => {
  const json = (status, body, extraHeaders) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...(extraHeaders || {}) } });

  /** Vikunja-style problem response; the front end shows `message`. */
  const problem = (status, message) =>
    new Response(JSON.stringify({ status, title: message, detail: message, message, code: status }), {
      status,
      headers: { 'content-type': 'application/problem+json' },
    });

  const preview = (body) => {
    if (body == null) return null;
    const s = typeof body === 'string' ? body : JSON.stringify(body);
    return s.replace(/"(password|token)"\s*:\s*"[^"]*"/gi, '"$1":"[scrubbed]"').slice(0, 300);
  };

  const b64url = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  /**
   * A JWT-shaped token for the demo user. Vikunja's front end reads its claims (id, username, exp, type);
   * nothing checks the signature, because there is no server. It never leaves the browser.
   */
  function demoToken() {
    const u = AmberStore.seed.meta.user;
    const now = Math.floor(Date.now() / 1000);
    const claims = { exp: now + 3600, iat: now, id: u.id, is_admin: false, jti: crypto.randomUUID(), sid: crypto.randomUUID(), type: 1, username: u.username };
    return b64url({ alg: 'HS256', typ: 'JWT' }) + '.' + b64url(claims) + '.amber-capsule-unsigned';
  }

  const routes = [
    {
      name: 'login',
      method: 'POST',
      path: /^\/api\/v2\/login$/,
      // The real password is never in the capsule, so any password signs in as the demo user.
      handle: ({ body }) => {
        const u = AmberStore.seed.meta.user;
        if (!body || String(body.username || '').toLowerCase() !== u.username.toLowerCase()) {
          return problem(412, 'Wrong username or password.');
        }
        return json(200, { token: demoToken() });
      },
    },
    {
      name: 'token-refresh',
      method: 'POST',
      path: /^\/api\/v2\/user\/token\/refresh$/,
      handle: () => json(200, { token: demoToken() }),
    },
  ];

  self.AmberHandlers = {
    routes,
    json,
    problem,
    preview,
    context: ({ method, url, body, headers }) => ({ method, url, query: url.searchParams, body, headers, store: AmberStore, json, problem }),
  };
})();
