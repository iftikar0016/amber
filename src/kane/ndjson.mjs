// @ts-check
// Ported from Bad Day (github.com/iftikar0016/badday, MIT, same author).
// Tolerant NDJSON classification for kane-cli --agent output.

/**
 * @param {string} line
 * @returns {null | {kind:'terminal'|'typed'|'step', [k:string]:any}}
 */
export function classify(line) {
  const text = line.replace(/^﻿/, '').trim();
  if (!text.startsWith('{')) return null;
  let e;
  try {
    e = JSON.parse(text);
  } catch {
    return null;
  }
  if (!e || typeof e !== 'object') return null;
  if (e.type === 'run_end' || e.type === 'test_md_done') return { ...e, kind: 'terminal' };
  if (typeof e.type === 'string') return { ...e, kind: 'typed' };
  if ('step' in e && 'status' in e) return { ...e, kind: 'step' };
  return null;
}

/** Steps actually taken: count done/failed progress lines, never trust indices. */
export function stepsTaken(events) {
  return events.filter((e) => e.kind === 'step' && (e.status === 'done' || e.status === 'failed')).length;
}
