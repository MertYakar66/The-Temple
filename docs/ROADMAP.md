# Roadmap

What comes next, in what order, and why. Companion to `AUDIT_STATE.md` (per-batch detail) and
`PROJECT_STATE.md` (current snapshot).

## Sequencing

```
                      ┌─ AuthContext race fix ──┐
                      │  (e2e becomes useful)   │
                      ▼                         │
Batch 3 (Diet UX)  ─►  Batch 4 (Recurrence)  ─► Batch 5 (Siri Functions)  ─► Batch 6 (Polish)
                                                    ▲
                                                    │
                                                    │  may need shared
                                                    │  recurrence code
                                                    │  extracted to lib/
```

## Order of operations

1. **Batch 3 — Diet UX correctness.** Highest user-visible value (custom mealType bug, broken
   meal-edit page, banned date pattern). Vitest-only verification — no AuthContext dependency.
2. **AuthContext race fix.** Promotes the e2e harness from "decoration" to "actual gate".
   After this lands, switch the fixme'd spec back on and revert the playwright config to dev.
   Should be a single targeted PR, not bundled with anything.
3. **Batch 4 — Calendar recurrence.** Vitest-first against `src/utils/calendar.ts`. Lands the
   shared expansion logic that Batch 5 will reuse.
4. **Batch 5 — Cloud Functions Siri TZ + server-side recurrence expansion.** Reuses Batch 4's
   recurrence work (consider extracting to a shared `lib/` if duplication grows).
5. **Batch 6 — Polish.** Sweeps up flagged side findings.

The ordering is value-driven, not technically forced — Batches 3 and 4 are independent. But
fixing user-visible Diet bugs before the recurrence engine matches the user's stated priority.

## Dependencies

- **AuthContext race fix → e2e harness becomes useful.** Until it lands, every e2e spec must
  be `test.fixme()`'d.
- **Batch 4 → Batch 5.** Server-side recurrence expansion in Batch 5 should reuse the engine
  Batch 4 hardens. If they're done in the wrong order, Batch 5 either re-implements
  (duplication) or punts (incomplete).
- **Batch 6 ← everything.** Polish sweeps up findings flagged during the prior batches; do it
  last.

## Why this order

- Diet UX before recurrence: user-visible bugs > architectural cleanup.
- AuthContext race fix between Batch 3 and Batch 4: at this point the e2e harness has been
  sitting fixme'd long enough; unblock it before adding more invariants that should be tested
  end-to-end.
- Polish last: sweep findings, not interrupt them.

## Post-audit

After Batch 6 there's no shipped work scheduled. The product is the owner's personal app —
features ship as the owner has new needs, not on a roadmap. Likely follow-ups when they come up:

- Functions emulator for integration coverage of the Cloud Functions (CI already runs the
  `functions/` build + test on every PR — see `.github/workflows/ci.yml`).
- Bundle splitting (current bundle is 1.4 MB; Vite warns).
- Native push for invitation delivery (currently in-app only).
- Onboarding flow polish.

## When to update this file

Update ROADMAP.md when:
- A batch lands (remove from sequencing graph; CHANGELOG.md picks up the history).
- A new dependency between work items is discovered.
- The user reprioritizes (e.g. moves AuthContext race fix ahead of Batch 3).
- Post-audit follow-ups are picked up or descoped.
