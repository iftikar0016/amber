# Spike results (2026-11-23, kane-cli 0.10.7, Windows 11)

The spike's two authored runs are real journeys (j03 list view, j09 add task), captured through `amber capture`, so they also count towards the capture. **Spent: 91.79 credits** (see `runs/credits.ndjson`; balance 9,711.41 → 9,619.62).

| Run | What | Result | Credits |
|---|---|---|---|
| [`capture-2026-11-23T14-42-03`](../runs/capture-2026-11-23T14-42-03/summary.json) | j03 and j09 authored against the real Vikunja, through the recorder | both PASS (122 s, 130 s) | 71.82 |
| [`spike-replay-real-…14-46-54`](../runs/spike-replay-real-2026-11-23T14-46-54/summary.json) | frozen j09 replayed against the real Vikunja with a fresh tag | PASS; the wire shows Kane typed the new tag | 9.04 |
| [`spike-replay-capsule-…14-49-35`](../runs/spike-replay-capsule-2026-11-23T14-49-35/summary.json) | j03 and j09 replayed against the capsule, server off | j03 PASS; **j09 FAIL**, caught by Kane | 10.56 |
| [`spike-blank-ids-…14-52-50`](../runs/spike-blank-ids-2026-11-23T14-52-50/j03-list-view/a1/result.json) | j03 replay with the account IDs blanked in its recording | refused before starting (exit 2) | 0 |
| [`spike-replay-capsule-…14-53-50`](../runs/spike-replay-capsule-2026-11-23T14-53-50/summary.json) | j03 replay of a run copy with the IDs restored | PASS | 0.37 |

## What the spike settled

1. **`kane-cli run --name <id>` saves a replayable flow.** It writes `.testmuai/tests/<id>_test.md` (one step: the whole objective) and `output-<id>/` with the recorded actions (`.internal/steps/…/actions.ndjson`), `execution.json`, `meta.json` and generated Playwright code. `testmd run` replays it (`replay_decisions: 1, author_decisions: 0`).
2. **A replay really re-checks the page.** Each check is recorded as code that reads the live page (`analyze` actions with `code_js`) followed by an assertion. On the capsule, j09's recorded assertion "Paint samples {{global.amber_tag}} appears in the project task list" **failed** because the capsule (correctly, at this stage) refused the write with a 501, and the screenshot shows the task never appeared. No adaptive heal ran (`--no-adaptive-heal`).
3. **Kane's own diagnosis comes with a failed replay.** The replay stream carried `test_md_bug_verdict`: confirmed, "Task creation rejected with 501 error", severity major, confidence 0.99. It goes into the brief as a lead.
4. **Per-run values work, but not the way the docs suggest.**
   - Kane turns `--variables-file` entries into TestMu namespaced variables (`global.amber_tag`, `secrets.user.amber_password`) and writes their values into the saved flow's frontmatter. Frontmatter values win when the flow is replayed, so a saved flow would replay the recorded tag. The recorded actions themselves use placeholders (`Type "Paint samples {{global.amber_tag}}"`).
   - So AMBER commits flows with every frontmatter value blanked (no password in git), and each replay runs a copy in `.amber/` with this run's values filled in. The run copy is checked to have exactly the frozen steps.
   - Proven on the wire: the capture typed `Paint samples gwndho`; the replay typed `Paint samples mztekg`.
   - Side effect to know: the password became a TestMu user-scope secret, and the user name and tag became TestMu global variables, on the account. The password belongs to a throwaway Vikunja account that only exists on 127.0.0.1.
5. **Recordings are tied to the TestMu account.** A replay of a recording whose `org_id` is not the signed-in account's is refused before it starts ("this test belongs to org …"). AMBER keeps the org and user IDs in `.amber/kane-account.json` (gitignored), blanks them in the committed recordings and restores them in each run copy. Consequence for anyone else: **the committed recordings cannot be replayed with another Kane account**; a stranger re-authors the journeys from `journeys.json` with their own account (credits), or uses the recorded runs and the credit-free replay.
6. **Kane's fresh Chrome takes the capsule's Service Worker.** j03 passed against the capsule with Vikunja stopped (server-off proof taken before and after each run, no leaks).
7. **Costs.** An authored journey costs about 26–38 credits (2 minutes). A passing replay cost 0.37 on the capsule; the first replay against the real server cost 9.04; a failing replay with Kane's bug verdict cost about 10. Kane's `credits_consumed` is absent from replay streams, so AMBER measures every batch from the balance.

## What it changed in AMBER

- Saved flows enter `flows/` with frontmatter values blanked and account IDs removed; replays run a materialized copy (`src/flows/materialize.mjs`).
- Replay records now read typed `step_end`, assertion and `test_md_bug_verdict` events, and find the evidence pack from the `session_id`.
- The capture completes the front end: after the journeys, every file the app's bundle refers to and no journey loaded (164 code-split chunks) is fetched from the real server through the recorder. API data still comes only from Kane's journeys.
- The build takes the app shell from any client-side route when `/` was never loaded (Kane starts at `/login`).
- Committed evidence keeps Kane's JPEG screenshots and drops its annotated PNGs (4× larger).

## Risks it showed

- Kane recorded a wait for the literal greeting "Still at it, Amber Demo?", which Vikunja changes with the time of day. Replays at another hour wait for it to time out; the greeting assertion itself is phrased generally ("greets Amber Demo") and passed. Watch for slow or flaky replays.
- Element-index lookups (`el(95)`) in recorded checks assume the same DOM; the capsule serves Vikunja's own front end, so they match as long as the data matches.
