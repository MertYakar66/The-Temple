---
description: Run the pre-finish gate (lint, build, test) and report pass/fail.
---

Run the project's verification gate and report a clear PASS/FAIL for each step.
Stop at the first failure and show its output.

Root package (from the repo root):

1. `npm run lint`
2. `npm run build`
3. `npm test`

If anything under `functions/` changed this session, also run:

4. `cd functions && npm run build && npm test`

Report one line per step. Do not fix anything — just verify and report. If
every step passes, say so plainly.
