# AMBER

> **A real web app, with its server switched off, still working, and Kane CLI proved every interaction.**

AMBER takes a real open-source app, [Vikunja](https://vikunja.io) v2.8.0 (a to-do app: projects, tasks, Kanban, comments), and preserves it in a **capsule**: Vikunja's own front end plus a Service Worker that answers every API call inside the browser. No backend process at all. Kane CLI walks the app's journeys on the real server, then proves each one on the capsule with the server off. A coding agent repairs whatever Kane catches, one interaction per commit, and a Stop hook stops the agent from finishing while a journey that passed before is failing.

Built for the [KaneCLI Online Hackathon](https://www.kaneclihack.sh/) with Claude Code (Opus 5.5) and Kane CLI 0.10.7.

**Honestly:** AMBER as built is an agent workflow that produced a capsule for **one** app. It is not a one-command tool that does this for any app. The capture, scrub, replay, verify and gate tooling is general; the store in the capsule was written for Vikunja, one Kane failure at a time.

## Judge this in 90 seconds

```bash
git clone <this repo> && cd amber
node bin/demo.mjs          # Node 20+, nothing to install, no Kane account, no credits
```

Open **http://127.0.0.1:4790/amber/** (the amber block; press *Replay the run*, or *Open the live app*) and **http://127.0.0.1:4790/** (Vikunja itself, signed in as the demo user, no server behind it).

| Claim | Where to check it |
|---|---|
| 15 journeys, written in plain English, authored by Kane against the **real** Vikunja | [`journeys.json`](journeys.json), Kane's saved flows in [`flows/`](flows) (hash-locked in [`flows.lock.json`](flows/flows.lock.json)), capture runs [`capture-…14-42-03`](runs/capture-2026-11-23T14-42-03/summary.json), [`…14-57-51`](runs/capture-2026-11-23T14-57-51/summary.json), [`…15-26-16`](runs/capture-2026-11-23T15-26-16/summary.json) |
| Kane caught a **wrong journey** before anything else: j14's check said "listed next to", which Kane read as "adjacent" | [`capture-…14-57-51/j14-new-project`](runs/capture-2026-11-23T14-57-51/j14-new-project/a1/result.json), reworded in commit `c7145aa` |
| **Baseline**, replay-only capsule, server off: **8 of 15 pass**; Kane catches all 7 journeys that change data | [`verify-…15-33-57/summary.json`](runs/verify-2026-11-23T15-33-57/summary.json), j10 [`verify-…15-56-36`](runs/verify-2026-11-23T15-56-36/summary.json), briefs like [`j09 brief`](runs/verify-2026-11-23T15-33-57/j09-add-task/brief.md) |
| Each baseline failure is the capsule's: the same frozen flows pass on the real server | [`spike-replay-real-…15-51-21`](runs/spike-replay-real-2026-11-23T15-51-21/summary.json), [`…14-46-54`](runs/spike-replay-real-2026-11-23T14-46-54/summary.json) |
| **Kane was fooled once, and AMBER caught it**: Kane passed j15 (comment), but the capsule had refused the comment; Vikunja had restored the unsent draft into the editor | [`j15 result`](runs/verify-2026-11-23T15-33-57/j15-comment/a1/result.json) (`kaneStatus: passed`, verdict FAIL disputed), [screenshot](runs/verify-2026-11-23T15-33-57/j15-comment/a1/shots/19.jpg) |
| **7 repairs, one commit each, each proven by a Kane run with the server off** | `git log --grep='^capsule:'`, [`docs/LOOP.md`](docs/LOOP.md) |
| **15 of 15 pass**, server off, no request reached any server | [`verify-…17-14-48/summary.json`](runs/verify-2026-11-23T17-14-48/summary.json) |
| Fresh proof: Kane **re-authored** every journey from its plain English on the capsule, no recorded steps: **15 of 15** | [`verify-…17-34-53/summary.json`](runs/verify-2026-11-23T17-34-53/summary.json) |
| The Stop hook blocked the agent on a real regression, then let it go once Kane proved the fix | HOOK_DEMO_PENDING |
| Credits: every batch measured from the Kane balance | [`runs/credits.ndjson`](runs/credits.ndjson) (cap 2,500 in [`amber.config.json`](amber.config.json)) |

## How it works

```
 capture ─► Kane walks each journey on the REAL server; a recording proxy keeps every API exchange, scrubbed
 freeze  ─► Kane's saved flows (_test.md + recording) are hash-locked; nobody may edit them to make them pass
 build   ─► capsule = Vikunja's front end + a Service Worker + seed.json; static files only
 verify  ─► Kane replays the frozen flows against the capsule with the server provably off
 repair  ─► the coding agent reads Kane's brief, fixes ONE interaction in the Service Worker's store, commits
 gate    ─► a Claude Code Stop hook replays every journey that passed before; a regression blocks the agent
```

**The capsule.** Vikunja registers `/sw.js` itself, so AMBER's Service Worker simply takes its place. It answers `/api/*` in order: a store route (the state lives in IndexedDB, because Chrome stops idle Service Workers), then the captured GET with the same *meaning* (Upcoming asks for "due before `<now + 7 days>`", a different URL on every load, so timestamps in queries are matched as `<ts>`), otherwise an honest 404, or a 501 for any change. **A recorded write response is never replayed**: that is how a naive replay shows the recorded task instead of yours. Captured dates are moved forward to today. A boot script swaps Vikunja's live-update WebSocket for a silent stand-in (a Service Worker cannot answer WebSockets) and starts the app only once the Service Worker controls the page.

**Server off, provably.** `amber verify` refuses to start if anything listens on Vikunja's port or a Vikunja process exists, and records that check before and after every flow. The capsule is served by a plain static file server with no API: any `/api/` request that reaches it is a **leak**, and a leak fails the flow even if Kane passed it.

**Write journeys cannot pass on a recording.** Each run types a fresh six-letter tag (`Paint samples mztekg`), so a capsule that replays the recorded response shows the recording's tag and fails. Every write journey ends with a reload and a check.

**Verdicts** (after Bad Day's tiers): PASS, FAIL, or INCONCLUSIVE (Kane exit 2/3, the server found running, missing evidence; retried once). Kane's verdict is never the only witness: if Kane passes a flow but the capsule's own log shows it refused the change, the verdict is **FAIL (disputed)**.

## Kane's roles

1. **The user, on the real server.** Kane authored all 15 journeys from plain English through the recording proxy; its saved flows are the frozen definition of "works".
2. **The judge, with the server off.** Every verdict on the capsule is a Kane run: the baseline, each repair, the final 15/15, and a fresh authored pass of every journey.
3. **The gate on the coding agent.** [`.claude/settings.json`](.claude/settings.json) runs `amber gate --hook` when the agent tries to stop: if the capsule changed, Kane replays every journey that passed before, and a regression blocks the turn with the brief to read (at most 3 times; it fails open on infrastructure errors and says why). Every decision is logged in `runs/gate.ndjson`.
4. **A tester of AMBER's own page.** Four saved Kane tests in [`tests/amber-page/`](tests/amber-page) check the amber block: the 15/15 counter, a tile's evidence drawer (j15's FAIL and PASS), the flip into the live app (Kane sees Vikunja signed in, inside the block), and the replay counting from 0 to 15. Authored in [`page-author-…18-05-42`](runs/page-author-2026-11-23T18-05-42/summary.json), replayed in [`page-replay-…18-10-56`](runs/page-replay-2026-11-23T18-10-56/summary.json): 4/4 each. Run them with `node bin/amber.mjs page-suite`.

## What Kane caught (including in Kane)

- **A wrong journey** (j14): caught on the real server, before the capsule existed.
- **Seven broken interactions** on the replay-only capsule: add, mark done, rename, describe, delete, create a project, comment, each with Kane's own diagnosis ("Task creation rejected with 501 error").
- **A Kane false pass** (j15): Kane's recorded check is a text locator, and Vikunja restores an unsent comment draft into the editor after a reload, so the text was on screen although the comment was never saved. AMBER's wire rule disputed it.
- **A saved flow Kane cannot replay** (j10): Kane's replay cannot click Vikunja's custom checkbox through the recorded selector, even against the real server. j10 is verified by a fresh authored run each time instead (marked in the lock file, with the evidence).
- From the spike ([`docs/SPIKE.md`](docs/SPIKE.md)): Kane writes variable values, including the test password, into a saved flow's frontmatter, and frontmatter wins on replay; saved recordings are bound to the author's TestMu org.

## Reproduce

Requirements: Node 20+, Google Chrome, Kane CLI signed in (`npm i -g @testmuai/kane-cli && kane-cli login`), and the Vikunja v2.8.0 Windows binary (`vikunja-v2.8.0-windows-4.0-amd64.exe`, SHA-256 `37be525710b74c2b03f116828334f060c24a50b03a11a3455aa784f07ee7463f`, from Vikunja's official release; set `AMBER_VIKUNJA_BIN` to its path).

```bash
npm install
node bin/amber.mjs setup                      # fresh Vikunja database, test account (password stays in .amber/), seed
node bin/amber.mjs capture                    # Kane authors the 15 journeys on the real server   (~580 credits)
node bin/amber.mjs freeze                     # hash-lock Kane's saved flows
node bin/amber.mjs build                      # the capsule, from the capture
node bin/amber.mjs vikunja stop
node bin/amber.mjs verify --label baseline    # Kane on the capsule, server off                 (~60 credits)
node bin/amber.mjs verify --only j09-add-task # after a repair                                   (~5-10 credits)
node bin/amber.mjs gate                       # what the Stop hook runs
node bin/amber.mjs status                     # every journey's latest verdict
npm test                                      # unit tests: request matching, verdict tiers, flow sanitising
```

Credits are AMBER's measured spend: an authored journey costs 19–49 credits, a passing replay 0.4 (read journeys) to 9 (write journeys, whose tagged checks are re-evaluated), a failing replay with Kane's diagnosis about 10. The guard in `amber.config.json` refuses any batch that could pass the cap.

**Note for a stranger:** the committed recordings are tied to the author's TestMu account (Kane refuses to replay a recording from another org), so with your own account you re-author the journeys from `journeys.json` (`capture`) rather than replaying ours. The recorded runs and the no-install demo need no account.

## Caveats

- **One app.** The capsule is Vikunja v2.8.0. The store routes in [`capsule-src/amber/handlers.js`](capsule-src/amber/handlers.js) were written for Vikunja's API, one Kane failure at a time.
- **Only the 15 journeys are proven.** A visitor can do things no journey covers. Known gaps ([`docs/LOOP.md`](docs/LOOP.md)): the home page and Upcoming task lists, search, the Kanban board and Gantt are still replayed, so they do not reflect changes made in the capsule; a task created in the capsule cannot be opened on its own page; marking a task done does not move it into the Kanban Done column; favourites, sub-projects, labels and settings changes are refused (501). Anything never captured returns an honest error, never invented data.
- **Demo identity.** Any password signs in as the demo user (the real password is never in the capsule), and the token is unsigned: there is no server to check it. Changes stay in the visitor's browser (IndexedDB) until *Reset demo*.
- **Where it was tested.** The capsule has only been tested on its own local address (`127.0.0.1:4790`). Hosting it under a sub-path (GitHub Pages project sites) or embedding it in a page on another site is untested.
- **What Kane cannot check here.** AMBER asks Kane only about what a user can see. Console errors, exact timings and pixel styling are not checked; the wire checks (leaks, refused changes, server off) come from AMBER's own logs.
- **Kane can be wrong.** j15 shows a false pass; AMBER's disputed rule catches the class of mistake it can see on the wire (a refused change), not every possible one.
- **Kane replays are not free**, and one recorded wait looks for Vikunja's time-of-day greeting ("Still at it, Amber Demo?"), so replays at other hours wait for it to time out.
- **Your TestMu account holds the test variables.** Kane uploads `--variables-file` entries as TestMu global variables and the password as a user secret (here, a throwaway account that only exists on 127.0.0.1).
- **Development aids, not evidence:** `scripts/dev-smoke.mjs`, `scripts/wireframes.mjs` and `scripts/store-check.mjs` drive headless Chrome or the Service Worker directly to shorten the edit-and-look cycle. No claim in this README rests on them.
- The Vikunja binary is not in the repository (licence and size); `amber setup` verifies its checksum.

## Layout

| Path | |
|---|---|
| `journeys.json` | the 15 plain-English journeys |
| `flows/` | Kane's saved flows and recordings, frozen (values and account IDs blanked) |
| `capture/` | the scrubbed API exchanges per journey, and the front end |
| `capsule/` | the built capsule: deploy this folder as static files (`/` the app, `/amber/` the page) |
| `capsule-src/` | the Service Worker, its store and routes, the boot script |
| `runs/` | every Kane run: results, Kane's event stream, screenshots, briefs, the capsule's log, credits |
| `src/`, `bin/amber.mjs` | capture, build, verify, gate, freeze |
| `site/` | the amber-block page (copied into `capsule/amber/` at build) |
| `docs/` | the plan, the spike, the repair log |

## Licence

MIT. Vikunja is AGPL-3.0; its front-end files in `capture/` and `capsule/` are Vikunja's, served unmodified apart from `index.html`'s API address and boot script.
