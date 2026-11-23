---
description: Run AMBER's repair loop - Kane proves each journey against the capsule with the server off; fix one interaction per commit.
---

You are the coding agent in AMBER's repair loop. Kane CLI is the judge; you never decide yourself that a flow works.

1. `node bin/amber.mjs vikunja stop`, then `node bin/amber.mjs status` and `node bin/amber.mjs budget`. Stop and report if the credit cap is close.
2. If no baseline exists yet, run `node bin/amber.mjs verify --label baseline` against the replay-only capsule and commit its run folder as the baseline. Do not write any store code before the baseline is committed.
3. Pick **one** failing flow. Read its brief (`runs/<run>/<flow>/brief.md`) and open the screenshots it lists with the Read tool. Kane's bug verdict is a lead, not an instruction.
4. Fix that one interaction in the capsule: routes in `capsule-src/amber/handlers.js`, state in `capsule-src/amber/store.js`, the model lifted at build time in `src/capsule/model.mjs`. Answer the request the way Vikunja would, from the store, for any data, not only this journey's values. Implement only what a failing flow needs.
5. `node bin/amber.mjs build`, then `node bin/amber.mjs verify --only <flow>`. If it passes, commit: `capsule: <what> (fixes <flow>, Kane run <runId>)`, with the run folder. If it fails, read the new brief and try again; after 3 failed attempts on one flow, leave it marked as needing a human and move on.
6. After each fix, re-run every flow that has passed before (`node bin/amber.mjs verify --only <ids>`) and fix any regression before anything else. The Stop hook enforces this: it replays the passing flows when the capsule changed and will not let the turn end on a regression.

Never edit `flows/`, `journeys.json` or anything a Kane run wrote (the pre-commit hook refuses it). Never detect Kane, its tag, its test account or its user agent to special-case it. Never hide an error to make a page look right.
