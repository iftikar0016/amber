# AMBER

> **A real web app, with its server switched off, still working, and Kane CLI proved every interaction.**

AMBER takes a real open-source app, [Vikunja](https://vikunja.io) v2.8.0 (a to-do app: projects, tasks, Kanban, comments), and preserves it in a **capsule**: Vikunja's own front end plus a Service Worker that answers every API call inside the browser. No backend process at all. Kane CLI walks the app's journeys on the real server, then proves each one on the capsule with the server off. A coding agent repairs whatever Kane catches, one interaction per commit, and a Stop hook stops the agent from finishing while a journey that passed before is failing.

Built for the [KaneCLI Online Hackathon](https://www.kaneclihack.sh/) with Claude Code (Opus 5.5) and Kane CLI 0.10.7.

**Honestly:** AMBER as built is an agent workflow that produced a capsule for **one** app. It is not a one-command tool that does this for any app. The capture, scrub, replay, verify and gate tooling is general; the store in the capsule was written for Vikunja, one Kane failure at a time.

## Judge this in 90 seconds

**Live, no install:** **[amber-capsule.pages.dev](https://amber-capsule.pages.dev/)** is Vikunja with no server behind it (static files on Cloudflare Pages), signed in as the demo user; **[amber-capsule.pages.dev/amber/](https://amber-capsule.pages.dev/amber/)** is the amber block. Your changes stay in your browser.

Or run it locally:

```bash
git clone https://github.com/iftikar0016/amber.git && cd amber
node bin/demo.mjs          # Node 20+, nothing to install, no Kane account, no credits
```

Open **http://127.0.0.1:4790/amber/** (the amber block; press *Replay the run*, or *Open the live app*) and **http://127.0.0.1:4790/** (Vikunja itself, signed in as the demo user, no server behind it).

| Claim | Where to check it |
|---|---|
| **21 journeys**, written in plain English, authored by Kane against the **real** Vikunja: 15 in round 1, and 6 in round 2, after a review listed what a visitor hits within a minute (a new task that will not open, the home page and search not showing it, done not reaching the Kanban Done column, favourites and labels refused) | [`journeys.json`](journeys.json), Kane's saved flows in [`flows/`](flows) (hash-locked in [`flows.lock.json`](flows/flows.lock.json); round 2 only added to the lock), round 1 captures [`capture-…14-42-03`](runs/capture-2026-11-23T14-42-03/summary.json), [`…14-57-51`](runs/capture-2026-11-23T14-57-51/summary.json), [`…15-26-16`](runs/capture-2026-11-23T15-26-16/summary.json), round 2 [`capture-…03-51-37`](runs/capture-2026-11-25T03-51-37/summary.json), [`…04-09-43`](runs/capture-2026-11-25T04-09-43/summary.json) |
| Kane caught **two wrong journeys** before they were frozen: j14 said "listed next to", which Kane read as "adjacent"; j20 said "the star next to it", and Kane starred a task instead of the project | [`j14`](runs/capture-2026-11-23T14-57-51/j14-new-project/a1/result.json) (reworded in `c7145aa`), [`j20`](runs/capture-2026-11-25T03-51-37/j20-favourite-project/a1/result.json) (reworded in `dd0d420`) |
| **Baselines**, server off. Round 1, a replay-only capsule: **8 of 15 pass**; Kane catches all 7 journeys that change data. Round 2: **all 6 new journeys fail**, each with Kane's diagnosis | [`verify-…15-33-57/summary.json`](runs/verify-2026-11-23T15-33-57/summary.json), j10 [`verify-…15-56-36`](runs/verify-2026-11-23T15-56-36/summary.json), briefs like [`j09 brief`](runs/verify-2026-11-23T15-33-57/j09-add-task/brief.md); round 2 [`verify-…04-15-29/summary.json`](runs/verify-2026-11-25T04-15-29/summary.json) |
| Each baseline failure is the capsule's: the same frozen flows pass on the real server | [`spike-replay-real-…15-51-21`](runs/spike-replay-real-2026-11-23T15-51-21/summary.json), [`…14-46-54`](runs/spike-replay-real-2026-11-23T14-46-54/summary.json) |
| **Kane was fooled once, and AMBER caught it**: Kane passed j15 (comment), but the capsule had refused the comment; Vikunja had restored the unsent draft into the editor | [`j15 result`](runs/verify-2026-11-23T15-33-57/j15-comment/a1/result.json) (`kaneStatus: passed`, verdict FAIL disputed), [screenshot](runs/verify-2026-11-23T15-33-57/j15-comment/a1/shots/19.jpg) |
| **13 repairs, one commit each, each proven by its own Kane run with the server off** (7 in round 1, 6 in round 2). No repair broke a journey that had passed: the only regression a change caused is the deliberate one in the Stop-hook demonstration. Every repair passed on its first proving run, except j16, whose first run failed on its recording's hard-coded tag, not on the capsule | `git log --grep='^capsule:'`, [`docs/LOOP.md`](docs/LOOP.md) (round 1, and "Round 2") |
| **21 of 21 pass**, server off, no refused change, no request reached any server | [`verify-…10-17-26/summary.json`](runs/verify-2026-11-25T10-17-26/summary.json) (round 1's 15 of 15: [`verify-…17-14-48`](runs/verify-2026-11-23T17-14-48/summary.json)) |
| Fresh proof (round 1): Kane **re-authored** every journey from its plain English on the capsule, no recorded steps: **15 of 15** | [`verify-…17-34-53/summary.json`](runs/verify-2026-11-23T17-34-53/summary.json) |
| **The Stop hook blocked the coding agent** on a deliberate regression (Kane was fooled by it; AMBER was not), then let it stop once Kane proved the fix | [`runs/gate.ndjson`](runs/gate.ndjson) (`via: "hook"`: blocked, then allowed), [`docs/LOOP.md` § Stop-hook demonstration](docs/LOOP.md#stop-hook-demonstration-deliberate-regression) |
| Credits: every batch measured from the Kane balance, 3,699.53 in all | [`runs/credits.ndjson`](runs/credits.ndjson) (cap in [`amber.config.json`](amber.config.json): 2,500, raised by the user to 3,700 and then 4,000 for round 2) |

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

1. **The user, on the real server.** Kane authored all 21 journeys from plain English through the recording proxy; its saved flows are the frozen definition of "works".
2. **The judge, with the server off.** Every verdict on the capsule is a Kane run: both baselines, each repair, the final 21/21, and (round 1) a fresh authored pass of every journey.
3. **The gate on the coding agent.** [`.claude/settings.json`](.claude/settings.json) runs `amber gate --hook` when the agent tries to stop: if the capsule changed, Kane replays every journey that passed before, and a regression blocks the turn with the brief to read (at most 3 times; it fails open on infrastructure errors and says why). Every decision is logged in `runs/gate.ndjson`.
4. **A tester of AMBER's own page.** Four saved Kane tests in [`tests/amber-page/`](tests/amber-page) check the amber block: the counter (21 of 21), a tile's evidence drawer (j15's FAIL and PASS), the flip into the live app (Kane sees Vikunja signed in, inside the block), and the replay counting from 0 to 21. Round 1: authored in [`page-author-…18-05-42`](runs/page-author-2026-11-23T18-05-42/summary.json) and replayed in [`page-replay-…18-10-56`](runs/page-replay-2026-11-23T18-10-56/summary.json), 4/4 each, when the page counted 15. Round 2: the two counter tests re-authored in [`page-author-…10-58-58`](runs/page-author-2026-11-25T10-58-58/summary.json) (2/2); their first replay [`page-replay-…11-01-56`](runs/page-replay-2026-11-25T11-01-56/summary.json) failed both, because Kane had saved the new tests under a new name and the suite copied the old ones back (a suite bug, now fixed); placed by hand from that authoring run, they pass in [`page-replay-…11-05-41`](runs/page-replay-2026-11-25T11-05-41/summary.json). The other two passed unchanged. Run them with `node bin/amber.mjs page-suite`.

## What Kane caught (including in Kane)

- **A wrong journey** (j14): caught on the real server, before the capsule existed.
- **No accidental regression.** No repair broke a journey that had passed (round 1 re-checked after every repair; round 2, by the user's choice on cost, after groups of repairs and at the end). The one regression a change caused was planted on purpose, to test the Stop hook.
- **A second wrong journey** (j20, round 2): "the star next to it" let Kane star a task instead of the project. Caught on the real server, reworded before freezing.
- **Recordings that cannot replay honestly.** Kane saved j16's and j18's checks with the capture run's own tag (`'Order grout dmkrhw'`), although the steps type a fresh one, so a replay with a new tag can never pass. And every round-1 recording checks the greeting of the evening it was captured ("Still at it, Amber Demo?"), which Vikunja picks from a hash of the date, time of day and account: on other days the outcome depends on Kane's fallback (j09 failed on the greeting alone on the capsule and passed on the real server half an hour later; j01 failed on it later). Those four, like j10, are verified by fresh authored runs from their plain English; reasons and evidence are in the lock. Replays outside that evening also wait about 46 s for the greeting and cost about 9 credits instead of about 0.5.
- **Seven broken interactions** on the replay-only capsule: add, mark done, rename, describe, delete, create a project, comment, each with Kane's own diagnosis ("Task creation rejected with 501 error").
- **A Kane false pass** (j15): Kane's recorded check is a text locator, and Vikunja restores an unsent comment draft into the editor after a reload, so the text was on screen although the comment was never saved. AMBER's wire rule disputed it. **It happened twice:** in the Stop-hook demonstration Kane passed the deliberately broken j15 again, and it was AMBER's dispute that made the hook block the agent.
- **A saved flow Kane cannot replay** (j10): Kane's replay cannot click Vikunja's custom checkbox through the recorded selector, even against the real server. j10 is verified by a fresh authored run each time instead (marked in the lock file, with the evidence).
- From the spike ([`docs/SPIKE.md`](docs/SPIKE.md)): Kane writes variable values, including the test password, into a saved flow's frontmatter, and frontmatter wins on replay; saved recordings are bound to the author's TestMu org.

## Reproduce

Requirements: Node 20+, Google Chrome, Kane CLI signed in (`npm i -g @testmuai/kane-cli && kane-cli login`), and the Vikunja v2.8.0 Windows binary (`vikunja-v2.8.0-windows-4.0-amd64.exe`, SHA-256 `37be525710b74c2b03f116828334f060c24a50b03a11a3455aa784f07ee7463f`, from Vikunja's official release; set `AMBER_VIKUNJA_BIN` to its path).

```bash
npm install
node bin/amber.mjs setup                      # fresh Vikunja database, test account (password stays in .amber/), seed
node bin/amber.mjs capture                    # Kane authors the 21 journeys on the real server   (~800 credits)
node bin/amber.mjs freeze                     # hash-lock Kane's saved flows
node bin/amber.mjs build                      # the capsule, from the capture
node bin/amber.mjs vikunja stop
node bin/amber.mjs verify --label baseline    # Kane on the capsule, server off                 (~60 credits)
node bin/amber.mjs verify --only j09-add-task # after a repair                                   (~5-10 credits)
node bin/amber.mjs gate                       # what the Stop hook runs
node bin/amber.mjs status                     # every journey's latest verdict
npm test                                      # unit tests: request matching, verdict tiers, flow sanitising
```

Credits are AMBER's measured spend: an authored journey costs 19–49 credits, a passing replay 0.4 (read journeys) to 9 (write journeys, whose tagged checks are re-evaluated), or about 9 for any replay outside the evening the recordings were captured (they wait for the recorded greeting), a failing replay with Kane's diagnosis about 10. The guard in `amber.config.json` refuses any batch that could pass the cap.

**Note for a stranger:** the committed recordings are tied to the author's TestMu account (Kane refuses to replay a recording from another org), so with your own account you re-author the journeys from `journeys.json` (`capture`) rather than replaying ours. The recorded runs and the no-install demo need no account.

## Caveats

- **One app.** The capsule is Vikunja v2.8.0. The store routes in [`capsule-src/amber/handlers.js`](capsule-src/amber/handlers.js) were written for Vikunja's API, one Kane failure at a time.
- **Only the 21 journeys are proven.** A visitor can still do things no journey covers. Known gaps ([`docs/LOOP.md`](docs/LOOP.md)): the Upcoming list and the Gantt views are still replayed, so they do not show changes made in the capsule; changes no journey makes are refused (501), for example removing a label, editing or deleting a comment, sharing, and settings. Anything never captured returns an honest error, never invented data.
- **The demo video shows round 1** (15 journeys). Round 2's journeys, repairs and final check are in the runs, the commits and [`docs/LOOP.md`](docs/LOOP.md).
- **The Stop hook stops after 30 minutes.** A pass over all 21 journeys (five of them authored runs) takes about 40, so the hook's pass after the last round-2 repair was cut off at 16 of 21 (its 231.88 credits were added to the ledger afterwards, from the live balance), and the final check ran as `amber gate` directly, which has no limit. While a check is running, the hook does not start a second one.
- **Demo identity.** Any password signs in as the demo user (the real password is never in the capsule), and the token is unsigned: there is no server to check it. Changes stay in the visitor's browser (IndexedDB) until *Reset demo*.
- **Where it was tested.** Kane's runs were all on the capsule's own local address (`127.0.0.1:4790`), in Kane's browser. The live copy on Cloudflare Pages passed the same scripted visitor check over HTTPS, and putting it there found a real bug: Cloudflare redirects `/index.html` to `/`, and a redirected response may not answer a page navigation, so every deep link failed once the Service Worker took over; the Service Worker now fetches the app shell as `/`. Beyond that, a scripted visitor check ([`scripts/browser-check.mjs`](scripts/browser-check.mjs): lands signed in, opens a deep link, adds a task and finds it after a reload, survives a hard reload, sees every journey proven on AMBER's page) passed in headless **Chrome 158 and Edge 158** on Windows, both on AMBER's own server and on a plain static host at another origin ([`scripts/static-host.mjs`](scripts/static-host.mjs), with unknown paths answered the Netlify/Cloudflare way and the GitHub Pages way, and with or without pretty-URL redirects). That check is a development aid, not a Kane run. **Not tested:** Firefox, Safari, mobile browsers, other hosts, hosting under a sub-path (GitHub Pages project sites), embedding in another site.
- **Where a Service Worker cannot start** (some in-app or embedded browser views, some private windows), the capsule shows a page saying what it needs, with a link to the recorded run on AMBER's page, which needs no Service Worker. A hard reload, which bypasses the Service Worker for one page load, is followed by one ordinary reload.
- **What Kane cannot check here.** AMBER asks Kane only about what a user can see. Console errors, exact timings and pixel styling are not checked; the wire checks (leaks, refused changes, server off) come from AMBER's own logs.
- **Kane can be wrong.** j15 shows a false pass; AMBER's disputed rule catches the class of mistake it can see on the wire (a refused change), not every possible one.
- **Kane replays are not free**, and every round-1 recording waits for the greeting of the evening it was captured ("Still at it, Amber Demo?"), so replays at other times wait for it to time out, cost more, and depend on Kane's fallback; five journeys are therefore verified by fresh authored runs instead (see above).
- **Your TestMu account holds the test variables.** Kane uploads `--variables-file` entries as TestMu global variables and the password as a user secret (here, a throwaway account that only exists on 127.0.0.1).
- **Development aids, not evidence:** `scripts/dev-smoke.mjs`, `scripts/wireframes.mjs` and `scripts/store-check.mjs` drive headless Chrome or the Service Worker directly to shorten the edit-and-look cycle, and `scripts/browser-check.mjs` with `scripts/static-host.mjs` checks browsers and plain static hosting. No claim about the journeys rests on them.
- The Vikunja binary is not in the repository (licence and size); `amber setup` verifies its checksum.

## Layout

| Path | |
|---|---|
| `journeys.json` | the 21 plain-English journeys |
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
