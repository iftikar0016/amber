# AMBER: build plan

> **Status (2026-11-24): stages 1–6 are built and recorded; see the [README](../README.md).** All 15 journeys pass on the capsule with the server off, both as replays and as fresh authored runs; the Stop hook blocked the agent on a deliberate regression and allowed it once Kane proved the fix; Kane's suite of AMBER's own page passes. Spent: 1,942.64 of the 2,500-credit cap. Still open, and the user's: public hosting, pushing the repository, the video and the posts. The plan below is kept as it was approved; where the build differed (the spike's findings, per-flow authored verification for j10, the disputed rule), the README and `docs/` say how.

Kane CLI 0.10.7 is signed in with **9,711 credits** (if Argus uses the same Kane account, that balance is shared). No credits have been spent yet: the credit cap in `amber.config.json` is 0 until the user sets one, and every Kane run is refused until then.

## What AMBER is, honestly

An agent workflow that turns **one** real app, Vikunja v2.8.0, into a **capsule**: its real front end plus a Service Worker that answers every API call from an in-browser store, with no server at all. Kane CLI walks the app's journeys, proves each one with the server off, and gates the coding agent. It is not a one-command tool for any app, and the README will say so.

There is no deadline pressure on this build: stages are done in order, each one leaving something that works, and none is cut short or reduced in scope to fit a date.

## The stages (in order; each leaves something that works)

**1. Capture.** `amber capture` starts Vikunja from a pristine SQLite copy, puts the recording proxy in front of it on `127.0.0.1:4790`, and runs each journey as `kane-cli run "<objective>" --name <id> --agent --headless`. Kane writes each journey as a `_test.md`. The database is restored before every journey, so each one starts from the same seed. A journey that fails against the **real** server is fixed (reworded) before anything else; once all pass, the files go to `flows/` and their SHA-256 hashes go to `flows/flows.lock.json`. From then on they are frozen: the gate, a git pre-commit check and the agent's instructions all refuse any edit.

**2. The replay-only capsule.** `amber build` turns the capture into static files: Vikunja's front end, a boot page, `sw.js` (Vikunja already registers `/sw.js`, so ours replaces its own), and `seed.json`. The capsule is served on the **same origin** the journeys were recorded on (`127.0.0.1:4790`), so frozen flows run unchanged. At this stage the capsule only replays; it has **no store model**. It does handle the generic problems the feasibility check found:
- A recorded write response is never replayed as if it were the result of a new write: an unsupported change gets an honest error (501) and is logged as unanswered.
- Only GETs captured before the first change in their journey are replayed, so no post-write state leaks into another journey.
- Request URLs are matched by meaning: a timestamp inside a query value (Upcoming's "due before …") matches any timestamp.
- Captured dates move forward by whole days to today.
- `/api/v2/ws` gets a silent in-page stand-in (a Service Worker cannot answer WebSockets); `/user/token/refresh` returns a fresh token so the session stays alive; login accepts the demo user (the real password is never in the capsule).
- Captured data is scrubbed of the test password, tokens and JWTs before it reaches `seed.json`; the build fails if any survive.
- Every API call the Service Worker sees is logged (`store | replay | unanswered | unanswered-write`); any `/api` request that reaches the static server is logged as a **leak**.

**3. The baseline, then the loop.** `amber verify` refuses to start if anything listens on port 3456 or a Vikunja process exists, and records that check.
- **Baseline first.** All frozen flows run against the replay-only capsule with the server off, and that run is committed as the baseline of real breakages, before any store code exists. This is what Kane caught.
- **Then one repair per commit, each driven by a recorded Kane failure.** The coding agent (Claude Code, in this session) reads the failing flow's brief: Kane's diagnosis and failed step, its final screenshots, and the capsule log of unanswered or fallback calls in that flow. It writes the store support for that **one** interaction (commit message names the flow and the Kane run that failed), Kane re-runs that flow, then every previously passing flow is re-run and any that broke again are shown. **No endpoint is implemented before a flow has failed on it.**
- Verdicts use Bad Day's tiers: PASS, FAIL, INCONCLUSIVE (Kane exit 2/3, missing evidence, server found running) with one automatic retry. A flow still failing after 3 attempts is marked **needs a human** and stays visible.
- Chrome stops an idle Service Worker, so the store keeps its state in IndexedDB; a "Reset demo" control restores the seed.

**4. More roles for Kane.**
- A Claude Code **Stop hook** (`amber gate --hook`): if the capsule changed since the last check, it replays the previously passing flows; if any fail it blocks the turn with the flow names and the brief path. Capped at 3 blocks per regression; on Kane infrastructure errors it lets the turn end and says why.
- A small **saved Kane suite for AMBER's own page** (about 4 tests: the counter and block render, a fracture opens its evidence, the flip opens the live capsule, the replay heals the block).

**5. The visual.** One translucent amber block on near-black, enclosing a line wireframe of the app's screens (one region per journey). A failing interaction is a crimson fracture; when Kane proves it with the server off it heals to gold. One counter line above ("11 of 15 interactions proven with the server off"), one caption below, and a flip control that turns the block into the live capsule in an iframe. All state comes from the committed run timelines. A recorded replay of the real loop plays with no Kane account and no credits.

**6. Judge-facing.** README opening with "Judge this in 90 seconds", every number linking to a committed file; committed, scrubbed Kane logs and screenshots (never raw evidence packs, which carry account details); exact reproduce commands; the capsule as static files; an honest caveats list.

**The published capsule starts signed in.** A judge or visitor who opens it lands in the app as the demo user, not on a login page. Kane's journeys keep their sign-in step: they start at `/login`, which still shows the login form; any other entry page signs the visitor in automatically. One build serves both.

## Journeys (yours to change)

Each starts by signing in as the test user (with "Stay logged in" ticked, so a reload keeps the session) and ends on a visible outcome.

**Write journeys cannot pass on a recording.** Each run gets a fresh tag (`{{amber_tag}}`, six random letters, supplied by AMBER's runner both for authored runs and for replays of saved flows). Every value a write journey types contains that tag, so a capsule that replays the recorded response shows the recorded run's tag and fails. Every write journey ends with a reload followed by a check that the change is still there. The spike confirms that a saved flow with a per-run value still replays.

| # | Journey | Visible outcome |
|---|---|---|
| 1 | Sign in | Home greets Amber Demo and lists current tasks |
| 2 | Projects page | The three projects are listed |
| 3 | Open Website relaunch (list view) | Its tasks are listed |
| 4 | Open a task | Title and description shown |
| 5 | Table view of Kitchen renovation | Tasks in table rows |
| 6 | Kanban view | Columns with their task cards |
| 7 | Upcoming | Tasks due this week |
| 8 | Search for "tiles" | "Order tiles" found and opened |
| 9 | Add task "Paint samples <tag>" | Listed, and still listed after a reload |
| 10 | Mark "Choose worktop" done | Gone from the open list after a reload |
| 11 | Rename to "Homepage copy <tag>" | New title listed, and after a reload |
| 12 | Description "Oak or quartz <tag>" | Still shown after a reload |
| 13 | Delete "Pick a colour palette" | Gone from the list after a reload |
| 14 | Create project "Garden <tag>" | Listed, and still listed after a reload |
| 15 | Comment "Third quote <tag>" | Shown with the existing comment, and after a reload |

Optional extras: set a due date and see it on Upcoming; add a label; favourite a project. Dragging a Kanban card stays optional (Kane is weaker at drags).

## Credits (estimate; yours to cap)

| Item | Credits |
|---|---|
| Spike: does a `--name` run give a replayable `_test.md`; does a replay with a per-run tag still replay; what does a replay really re-check and cost; does Kane's fresh Chrome take the Service Worker | ~80 |
| Capture: 15 journeys against the real server (the reload checks add a few steps), plus rewording | ~650 |
| Baseline against the replay-only capsule: replays of saved flows are free when the page is unchanged; authored diagnostic runs for the failures | ~300 |
| Loop: one repair at a time, a re-run per attempt, regression replays (free) | ~400–700 |
| Kane suite on AMBER's own page (authored once, replays free) | ~100 |
| Final recorded proof: frozen flows replayed with the server off (free), plus a fresh authored run of each journey against the capsule | ~450 |
| **Total** | **~2,000–2,300** |

I propose a hard cap of **2,500**, enforced by the budget guard, which reads `kane-cli balance` before every batch and refuses a batch that could take AMBER's total past the cap.

The spike decides one thing that matters for honesty: if a replay does not really re-check the page (for example, it passes when the asserted text is missing), the loop and the gate will use authored runs instead. That would raise the loop cost to about 1,000 and I would come back to you before spending it.

## Built so far (no credits spent)

- Git repo with small commits; `.gitignore` keeps out the Vikunja binary and databases, credentials and raw evidence packs.
- Vikunja from a seeded, resettable database (`amber setup`, `amber vikunja reset|status`).
- The recording proxy with scrubbing, the capture runner, verdict tiers and the credit guard (not yet run: they need credits).
- The replay-only capsule and its static server. Tested with a capsule built from the feasibility check's capture: with Vikunja stopped it signs in, shows home, project lists and task detail, opens deep links, and shows honest errors for what was never captured (Kanban, an unvisited project). Tested only with `scripts/dev-smoke.mjs`, a zero-credit headless-Chrome development aid; the in-app browser cannot register Service Workers. Kane has not seen it yet.

## Caveats to carry into the README

- The capsule has only been tested on its own local address (`127.0.0.1:4790`). Embedding it in a page on another site is untested, and will be listed as untested until it has been tested.

## Decisions I need from you

1. **Journeys:** the 15 above, or changes.
2. **Credit cap:** 2,500, or another figure.
3. **Hosting the capsule:** I will make it work from any static file server and test it locally. Publishing it publicly (GitHub Pages under `/<repo>/`, which may need Vikunja's bundle rewritten for a sub-path, or a root-domain host such as Cloudflare Pages) is outward-facing, so I will ask before doing it.
