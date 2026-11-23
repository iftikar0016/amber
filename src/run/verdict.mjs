// @ts-check
// Verdict tiers (after Bad Day): INCONCLUSIVE means the run did not test what it claims and is retried once;
// FAIL and PASS are only given when Kane reached a verdict on a run whose preconditions held.

/**
 * @param {{exitCode:number|null, killed?:boolean, terminal:any, serverOff?:{off:boolean}|null,
 *          leaks?:number, unansweredWrites?:number, summaryText?:string|null, evidence?:boolean, mode:'author'|'replay'}} r
 * @returns {{verdict:'PASS'|'FAIL'|'INCONCLUSIVE', basis:string, reasons:string[], disputed?:boolean}}
 */
export function verdict(r) {
  const reasons = [];
  const status = r.terminal?.type === 'test_md_done' ? r.terminal.overall_status : r.terminal?.status;
  if (r.serverOff && !r.serverOff.off) reasons.push('server_not_off: Vikunja was reachable during a capsule run');
  if (r.exitCode === 2) reasons.push('kane_not_started: exit 2 (auth, infrastructure or usage error)');
  if (r.exitCode === 3 || r.killed) reasons.push('kane_timeout: exit 3 or killed by the watchdog');
  if (r.exitCode === null && !r.killed) reasons.push('kane_spawn_failed');
  if (!r.terminal && r.exitCode !== 2) reasons.push('no_terminal_event');
  if (r.terminal && ((r.exitCode === 0 && status !== 'passed') || (r.exitCode === 1 && status === 'passed'))) {
    reasons.push(`exit_status_mismatch: exit ${r.exitCode} with status ${status}`);
  }
  if (reasons.length) return { verdict: 'INCONCLUSIVE', basis: 'preconditions', reasons };

  if (r.leaks && r.leaks > 0) {
    return { verdict: 'FAIL', basis: 'wire', reasons: [`leak: ${r.leaks} API request(s) got past the Service Worker to the static server${status === 'passed' ? ' (Kane said passed: disputed)' : ''}`] };
  }
  if (r.exitCode === 0 && status === 'passed' && r.unansweredWrites && r.unansweredWrites > 0) {
    // Kane saw the expected text, but the capsule refused the change the journey made, so the page only looked
    // right (for example an unsent draft restored into an editor). A change that was never stored was not kept.
    return {
      verdict: 'FAIL',
      basis: 'wire',
      disputed: true,
      reasons: [`disputed: Kane said passed, but the capsule refused ${r.unansweredWrites} change(s) during the flow, so the change cannot have been kept`],
    };
  }
  if (r.exitCode === 0 && status === 'passed') return { verdict: 'PASS', basis: 'kane', reasons: [] };
  return { verdict: 'FAIL', basis: 'kane', reasons: [String(r.summaryText || r.terminal?.one_liner || r.terminal?.reason || r.terminal?.summary || 'Kane reported the flow failed').slice(0, 300)] };
}
