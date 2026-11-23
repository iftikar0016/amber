// @ts-check
// Scrubbing rules for captured traffic. The capture is committed and becomes the capsule's seed,
// so no password, token or JWT may survive. build checks the result again (assertClean).

export const TOKEN_PLACEHOLDER = 'amber-demo-token';
const SECRET_KEYS = /^(password|old_password|new_password|totp_passcode|passcode|token|refresh_token|access_token|secret|jwt)$/i;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

/** Request and response headers worth keeping. Authorization, cookies and server internals are dropped. */
const KEEP_HEADERS = new Set(['content-type', 'cache-control', 'x-pagination-total-pages', 'x-pagination-result-count', 'x-max-permission', 'etag', 'last-modified', 'location']);

export function keepHeaders(h = {}) {
  /** @type {Record<string,string>} */
  const o = {};
  for (const [k, v] of Object.entries(h)) if (KEEP_HEADERS.has(k.toLowerCase())) o[k.toLowerCase()] = String(v);
  return o;
}

/** Deep-copy a parsed JSON value with secret-looking keys and JWTs replaced. */
export function scrubJson(v) {
  if (Array.isArray(v)) return v.map(scrubJson);
  if (v && typeof v === 'object') {
    /** @type {Record<string,any>} */
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      if (SECRET_KEYS.test(k) && typeof x === 'string' && x !== '') o[k] = /token|jwt/i.test(k) ? TOKEN_PLACEHOLDER : '[scrubbed]';
      else o[k] = scrubJson(x);
    }
    return o;
  }
  if (typeof v === 'string') return v.replace(JWT, TOKEN_PLACEHOLDER);
  return v;
}

/** Scrub a text body: JSON is scrubbed structurally, anything else has JWTs and known secrets removed. */
export function scrubText(text, secrets = []) {
  let out;
  try {
    out = JSON.stringify(scrubJson(JSON.parse(text)));
  } catch {
    out = text.replace(JWT, TOKEN_PLACEHOLDER);
  }
  for (const s of secrets) if (s && s.length >= 6) out = out.split(s).join('[scrubbed]');
  return out;
}

/** Throw if any secret or JWT is present in the given text. */
export function assertClean(text, secrets = [], where = '') {
  JWT.lastIndex = 0;
  if (JWT.test(text)) throw new Error(`A JWT survived scrubbing ${where}`);
  for (const s of secrets) if (s && s.length >= 6 && text.includes(s)) throw new Error(`A secret survived scrubbing ${where}`);
}
