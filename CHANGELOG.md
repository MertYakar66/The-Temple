# Changelog

Human-readable summary of recent landings. For per-batch state see `docs/AUDIT_STATE.md`.
For sequencing of upcoming work see `docs/ROADMAP.md`.

This file groups commits by logical landing (audit batch, harness setup, foundation pass)
rather than by version — there are no semver tags. Newest first.

---

## Audit Batch 3 — Diet UX correctness — `claude/audit-batch3-diet-ux` (pending merge)

Branch off main at `6836f5a`. Eight commits. All five scope items landed with full Vitest
coverage (54/54 tests green; 11 new tests this batch).

- `420617f` Pre-work: capture in-flight Batch 3 state, the parseDateStamp-trap corollary in
  `docs/DATA_POLICY.md` §2, and the suggested commit grouping into `docs/AUDIT_STATE.md`.
- `d928d67` Render custom `mealType` strings on `Diet.tsx` and `History.tsx`. Anchor slots
  first, custom mealTypes appended in first-appearance order. Humanize-fallback for unknown
  strings (`'my_custom_meal'` → `'My Custom Meal'`).
- `d960249` Use `parseDateStamp` + `getDateStamp` in `useDietStore` date math (`updateStreaks`
  + `getWeeklyStats`). Local-aware end-to-end. The naïve swap introduces a one-day regression
  for non-UTC users via the parseDateStamp trap (DATA_POLICY §2 corollary); this fix swaps
  both halves.
- `6539aa0` Vitest coverage for the date-stamp fix. Sets `process.env.TZ =
  'America/Los_Angeles'` at the top of the file with a sanity check that fires first; the
  three regression sentinels would each fail under the naïve swap.
- `f9af9f4` Rename `DietMealNew.tsx` → `DietMealEditor.tsx` (pure rename, behavior-preserving).
- `84aecf6` Add edit-mode support to `DietMealEditor` + register `/diet/meals/:id/edit`
  route. Mirrors `DietRecipeEditor`'s pattern. The Edit pencil from `DietMeals.tsx` now
  works instead of redirecting to dashboard.
- `716c20f` First component test in the repo: `DietMealEditor.test.tsx`. Three cases (create
  / edit / stale-id) using `MemoryRouter` + direct store seeding. Pattern documented inline.
- `746b513` Strip `mealReminders` feature across types, store, and DietSettings editor.
  Persist `version` 0 → 1 with `dietStoreMigrate` (exported, unit-tested for happy path +
  three edge cases) that drops `mealReminders` from older persisted state while preserving
  every sibling field.

Carry-forwards (flagged for future batches):
- `useStore.startWorkout` undefined `routineId` → Batch 6.
- `Settings.tsx` data-export filename banned date pattern → Batch 6.
- Cloud Functions `todayDateString` UTC fallback → Batch 5.
- `humanizeMealType` is duplicated across two pages — extract to `src/utils/` if a third
  caller appears.

---

## Repo foundation pass — `claude/repo-foundation-pass` (in progress)

Branch from `claude/setup-playwright-e2e`. Documentation and hygiene only — no source
behavior change.

- **Untrack `.claude/settings.local.json` and `.firebase/`.** Both are local-only
  artifacts; tracking them produced noise in every diff. Files remain on disk;
  `.gitignore` updated.
- **Refresh existing docs.** `AGENTS.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`,
  `docs/MODULES.md` updated for post-Batch-1/2 reality and to reference the new doc
  set.
- **Create AI-handoff doc set.** `docs/PROJECT_STATE.md`, `docs/AUDIT_STATE.md`,
  `docs/ROADMAP.md`, `docs/TESTING.md`, `docs/DATA_POLICY.md`, `docs/DECISIONS.md`,
  `docs/COMMIT_STYLE.md`, plus this `CHANGELOG.md`. Each includes a "When to update"
  section.
- **Add top-of-file headers to priority modules.** `AuthContext.tsx`,
  `firestoreSync.ts`, the three stores, `functions/src/index.ts`, `utils/calendar.ts`,
  `utils/date.ts`, `firestore.rules`. 3-8 lines each, comment-only.

---

## E2E harness — `claude/setup-playwright-e2e` (not yet merged to main)

Playwright + Vitest store-layer fallback for audit-batch verification.

- `eabf1f8` Add Playwright + dotenv dev deps and e2e npm scripts.
- `35cb018` Add Playwright config and sign-in/sign-out helpers. `webServer` runs the
  production build, not dev — Strict Mode dev double-invocation collides with the
  AuthContext race finding.
- `4a29ebb` Add Calendar location round-trip e2e (`test.fixme()`'d — blocked by
  AuthContext race; reproduction timeline in the spec's top-of-file comment).
- `82b14e9` Add `tests/e2e/README.md` documenting the blocked test, the prerequisites
  (test user UID, `.env.test` keys), and the cleanup pattern.
- `80192dd` Add Vitest store-layer invariant tests for Batch 1 null-emit
  (`src/store/useStore.test.ts`, `src/store/useCalendarStore.test.ts`). 38 → 43 tests.
  Plus a localStorage shim in `src/test/setup.ts` so `zustand/middleware/persist`
  works under Node 25 + Vitest 4.

**Status:** the only e2e spec is `test.fixme()`'d. Until the AuthContext race lands a
fix, e2e isn't a verification gate. Batch invariants are verified at the layer where
the fix was made (Vitest at the store / utility level).

---

## Audit Batch 2 — Quick wins ✅ Merged

Merge: `11f2861 Merge branch 'claude/audit-batch2-quickwins'`.

- `2c4aef9` Stop wiping cloud routines on missing `program` field. The merge logic was
  matching against the wrong key, so cloud routines without the optional `program`
  got overwritten by the in-memory defaults.
- `483be06` Preserve profile weight when back-filling older weight entries. The
  back-fill was overwriting `user.weight` with each historical entry's weight.
- `534f7a8` Apply unit-aware weight bound in Settings. The bound was hard-coded for
  kg.
- `50dba8d` Omit onboarding email field when sign-in provides no email. (Some Google
  sign-ins return no email; writing `undefined` rejected the onboarding doc.)

---

## Audit Batch 1 — Null-emit sweep ✅ Merged

Merge: `99cf9d4 Merge branch 'claude/audit-batch1-undef'`.

Theme: `setDoc({merge:true})` preserves `undefined` keys, so `{field: undefined}` on
clear silently kept the prior value. Sweep through editors to emit `null`
(editor-controlled fields) or omit the key (pass-through fields). Type widening on the
affected models.

- `4a0599c` `CalendarSettings.timeZoneOverride`.
- `b484873` `CalendarEvent.location` / `locationPlaceId` / `videoCallUrl` / `notes` /
  `travelTime` / `recurrenceRule` / `organizer`. Includes full read-path trace.
- `9b5f7ec` `CustomBlockExercise.note` / `substitutions`.
- `5132b4b` `WeightEntry.notes`.
- `90ade3a` `ExerciseGoal.targetRIR` / `targetSets`.
- `7ad1365` `WorkoutSet.rir`.
- `f7837d2` Omit notes when starting workout-from-block has no metadata.
- `8936540` Omit empty fields when importing template routine exercises.
- `c1ff666` `Routine.program` group modal.
- `d9ff0fc` `Routine.program` editor.

Side findings flagged (deferred to Batch 6):
- `useStore.startWorkout` without `routineId` leaves `currentSession.routineId =
  undefined`.
- `Settings.tsx:211` data-export filename uses banned `toISOString().split('T')[0]`.

---

## Pre-audit highlights

A non-exhaustive list of the larger pre-audit landings, for orientation:

- `658dfd8` Add Claude Code on the web reference doc.
- `281be6e` Add CLAUDE.md as Claude Code project-memory entry point.
- `dbc3213` Add token-efficient AI agent context files (the original AGENTS.md).
- `a0b971d` Efficiency pass: slimmer syncs, cached token lookups, calendar
  memoization. Established the 2-second debounce and the slice-equality check
  pattern in `AuthContext.startSync`.
- `9df1176` Remove firebase-admin from frontend deps, add `.env.example`.
- `5bf6d1f` Refactor: eliminate redundancy, fix bugs, harden error handling.
- `448c089` Implement comprehensive account security for multi-user support.
- `2a98403` Fix two Siri integration bugs: missing exercises + wrong timezone.
  (TZ partially fixed — the missing/invalid-tz fallback in `todayDateString` still uses
  UTC; Batch 5.)
- `99a8538` Add Siri integration via Apple Shortcuts + Firebase Cloud Functions.
- `a8c4c47` Add Google Places autocomplete for calendar event locations.
- `774de24` Fix popover positioning: use fixed instead of absolute.
- `d495f69` Add Firestore backup/restore system with daily JSON exports.

For full pre-audit history use `git log --oneline`.

---

## When to update this file

- A new audit batch lands (add a section above the previous newest).
- A non-batch landing of similar weight (harness setup, infra change) lands (add a
  section).
- A historical entry is wrong or misleading.

Keep entries terse. Detail belongs in the commit message. Anchor each entry to its
commit hash so a reader can `git show` for full context.
