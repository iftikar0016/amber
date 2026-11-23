# AMBER: build plan (for approval)

Nothing is built yet and no credits have been spent. Kane CLI 0.10.7 is signed in with **9,711 credits** (if Argus uses the same Kane account, that balance is shared).

## What AMBER is, honestly

An agent workflow that turns **one** real app, Vikunja v2.8.0, into a **capsule**: its real front end plus a Service Worker that answers every API call from an in-browser store, with no server at all. Kane CLI walks the app's journeys, proves each one with the server off, and gates the coding agent. It is not a one-command tool for any app, and the README will say so.

## The stages (each leaves something that works)

**1. Capture.** `amber capture` starts Vikunja from a pristine SQLite copy, puts the recording proxy in front of it on `127.0.0.1:4790`, and runs each journey as `kane-cli run "<objective>" --name amber-<id> --agent --headless`. Kane writes each journey as a `_test.md`. The DB is restored before every journey, so each one starts from the same seed. A journey that fails against the **real** server is fixed (reworded) before anything else; once all pass, the files go to `flows/` and their SHA-256 hashes go to `flows/flows.lock.json`. From then on they are frozen: the gate, a git pre-commit check and the agent's instructions all refuse any edit.

**2. The capsule.** `amber build` turns the capture into static files: Vikunja's front end, a boot page, `sw.js` (Vikunja already registers `/sw.js`, so ours replaces its own), and `seed.json`. The capsule is served on the **same origin** the journeys were recorded on (`127.0.0.1:4790`), so frozen flows run unchanged. Rules from the feasibility check:
- The store is a model (projects, views, tasks, buckets, labels, comments), seeded only from what was seen on the wire. GETs are answered from the model, falling back to exact replay; writes change the model and return a response built from it, never the recorded one.
- URLs are matched by meaning: the path is routed, the query is parsed, `filter=due_date < '…'` is evaluated against the store's tasks (so Upcoming works on any day). Seed dates are shifted to "now" when the capsule loads.
- `/api/v2/ws` gets a harmless stand-in; `/user/token/refresh` returns a fresh fake token; login accepts the demo user (the real password is never in the capsule).
- Captured data is scrubbed of the test password, tokens and JWTs before it reaches `seed.json`; the build fails if any survive.
- Service Workers are stopped when idle, so the store writes through to IndexedDB. A "Reset demo" control restores the seed.
- Every API call the SW sees is logged (`answered | fallback | unanswered`); when served by `amber serve` the log goes to `runs/…/capsule-log.ndjson`, and any `/api` request that reaches the static server is logged as a **leak**.

**3. The loop.** `amber verify` refuses to start if anything listens on 3456 or a Vikunja process exists, and records that check. It runs the frozen flows against the capsule. Each failure gets a brief for the coding agent (Claude Code, in this session): Kane's diagnosis and failed step, its final screenshots, and the capsule log of unanswered or fallback calls in that flow. The agent fixes **one interaction per commit** in the SW store (commit message names the flow), Kane re-runs that flow, then all previously passing flows are re-run and any that broke again are shown. Verdicts use Bad Day's tiers: PASS, FAIL, INCONCLUSIVE (Kane exit 2/3, missing evidence, server found running) with one automatic retry. A flow still failing after 3 attempts is marked **needs a human** and stays visible.

**4. More roles for Kane.**
- A Claude Code **Stop hook** (`amber gate --hook`): if the capsule changed since the last check, it replays the previously passing flows; if any fail it blocks the turn with the flow names and the brief path. Capped at 3 blocks per regression; on Kane infrastructure errors it lets the turn end and says why.
- A small **saved Kane suite for AMBER's own page** (about 4 tests: the counter and block render, a fracture opens its evidence, the flip opens the live capsule, the replay heals the block).

**5. The visual.** One translucent amber block on near-black, enclosing a line wireframe of the app's screens (one region per journey). A failing interaction is a crimson fracture; when Kane proves it with the server off it heals to gold. One counter line above ("11 of 15 interactions proven with the server off"), one caption below, and a flip control that turns the block into the live capsule in an iframe. All state comes from `runs/timeline.ndjson`. A recorded replay of the real loop plays with no Kane account and no credits.

**6. Judge-facing.** README opening with "Judge this in 90 seconds", every number linking to a committed file; committed, scrubbed Kane logs and screenshots (never raw evidence packs, which carry account details); exact reproduce commands; the capsule as static files; an honest caveats list.

## Proposed journeys (yours to change)

Each starts by signing in as the test user and ends on a visible outcome. I will add a few due dates, one label, one description and one comment to the seed so the read journeys have something to show.

| # | Journey | Visible outcome | Expected first result in the capsule |
|---|---|---|---|
| 1 | Sign in | Overview greets the user and lists current tasks | likely pass |
| 2 | Projects page | The three projects are listed | likely pass |
| 3 | Open Website relaunch (list view) | Its 5 tasks are listed | likely pass |
| 4 | Open a task | Title, project and description shown | likely pass |
| 5 | Table view of Kitchen renovation | Tasks in table rows | likely pass |
| 6 | Kanban view | Columns with their task cards | **fails** (buckets never captured) |
| 7 | Upcoming | Tasks due this week | **fails** (timestamp in URL) |
| 8 | Search for "tiles" | "Order tiles" found and opened | unknown |
| 9 | Add a task | New title appears in the list | **fails** (stale write) |
| 10 | Mark a task done | It leaves the undone list | likely fails |
| 11 | Rename a task | New title shown in the list | likely fails |
| 12 | Add a description, reload | Description still there | likely fails |
| 13 | Delete a task | Gone from the list | likely fails |
| 14 | Create project "Garden" | It appears and opens empty | **fails** (never-seen project) |
| 15 | Comment on a task | Comment shown with author | likely fails |

Optional extras: set a due date and see it on Upcoming; add a label; favourite a project; drag a Kanban card (Kane is weaker at drags).

## Credits (estimate; yours to cap)

| Item | Credits |
|---|---|
| Spike: does a `--name` run give a replayable `_test.md`, what does a replay really re-check and cost, does Kane's fresh Chrome take the Service Worker | ~80 |
| Capture: 15 journeys against the real server, plus rewording | ~600 |
| Loop: replays of saved flows are free when the page is unchanged; authored diagnostic runs on failures | ~400–700 |
| Kane suite on AMBER's own page (authored once, replays free) | ~100 |
| Final recorded proof: frozen flows replayed with the server off (free), plus a fresh authored run of each journey against the capsule | ~450 |
| **Total** | **~1,600–1,950** |

I propose a hard cap of **2,500**, enforced by a budget guard that checks `kane-cli balance` before every batch and refuses a batch that could exceed it.

The spike decides one thing that matters for honesty: if a replay does not really re-check the page (for example, it passes when the asserted text is missing), the loop and the gate will use authored runs instead. That would raise the loop cost to about 1,000 and I would come back to you before spending it.

## Timeline (deadline Thu 26 Nov, 23:59 IST)

- **Mon 23 (tonight):** repo, spike, seed and DB reset, capture tooling, journeys authored against the real server.
- **Tue 24:** capsule (replay first, then the store model), first verify pass, fixes.
- **Wed 25:** loop to green, Stop hook, the visual and replay, Kane suite on AMBER's page.
- **Thu 26:** final recorded run, README, static build. The demo video and the two public posts are yours.

## Decisions I need from you

1. **Journeys:** the 15 above, or changes.
2. **Credit cap:** 2,500, or another figure.
3. **Hosting the capsule:** I will make it work from any static file server and test it locally. Publishing it publicly (GitHub Pages under `/<repo>/`, which may need Vikunja's bundle rewritten for a sub-path, or a root-domain host such as Cloudflare Pages) is outward-facing, so I will ask before doing it.
