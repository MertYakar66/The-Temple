---
description: Run a read-only correctness audit using the project rubric.
argument-hint: [optional scope — a module or file]
---

Run a **read-only** correctness audit. **Scope:** $ARGUMENTS — if no scope is
given, audit the whole codebase.

Investigation only — make no edits. Model the rubric on the prior pass,
`docs/audits/2026-05-08-cross-module-audit.md`.

## Method

Check the code against every hard invariant in `CLAUDE.md` and
`docs/DATA_POLICY.md`:

- Firestore `undefined` rejection; null-emit on clear.
- Date stamps via `getDateStamp()` — flag any
  `new Date().toISOString().split('T')[0]`.
- `Routine.dayOfWeek` is `0=Sun..6=Sat`.
- The 5-place persisted-slice rule and the 5-place Firestore-path rule.
- Lean `getCloudSyncData` projection; ephemeral state kept out of sync.
- 2 s debounce + logout flush; calendar soft-delete; store version migrations.
- `firebase-admin` only in `functions/` and `scripts/`; auth only via
  `AuthContext`.

Back every finding with a `file:line` citation. No hedging without quoted code.

## Output

Group findings by severity: **Critical** (data loss, auth, security) →
**High** (broken invariant, correctness) → **Medium** (code health, perf,
types) → **Low / nits**. For each finding give: files, what's wrong, why it
matters, a suggested fix, a confidence level, and a repro if one exists. End
with a "Verified clean" list and any open questions.

If the audit is broad, also write it to `docs/audits/YYYY-MM-DD-<slug>.md` and
add it to the index in `docs/audits/README.md`.
