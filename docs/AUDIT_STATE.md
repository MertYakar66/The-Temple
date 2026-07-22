# Audit State

Per-batch progress for the multi-batch correctness audit. Companion to `ROADMAP.md`
(sequencing) and `PROJECT_STATE.md` (top-level snapshot).

## Background

The repo is being walked through end-to-end for correctness issues, batched by theme so each
landing has a clear scope and review surface. Each batch is a feature branch named
`claude/audit-batch<N>-<topic>` and merges to `main` via `git merge --no-ff` (preserves the
batch grouping in `git log --graph`). Tests at the layer where the fix was made are part of
the batch — see `TESTING.md` for the verification discipline.

Batches are independent in scope but share the hard invariants in `DATA_POLICY.md`. A batch
should never relax an invariant.

## Batch 1 — Null-emit sweep ✅ Merged

**Merge:** `99cf9d4 Merge branch 'claude/audit-batch1-undef'`.

**Theme:** `setDoc({merge:true})` preserves keys whose value is `undefined`, but Firestore
rejects `undefined` outright on new-doc writes. Many editors wrote `{field: undefined}` when
the user emptied an optional field. On update this silently kept the prior value; on insert
this rejected the whole write. The fix sweeps the editors to emit `null` (or omit the key
entirely for fields that aren't editor-controlled).

**Commits in the batch:**
- `4a0599c` `CalendarSettings.timeZoneOverride`
- `b484873` `CalendarEvent.location/locationPlaceId/videoCallUrl/notes/travelTime/recurrenceRule/organizer`
- `9b5f7ec` `CustomBlockExercise.note/substitutions`
- `5132b4b` `WeightEntry.notes`
- `90ade3a` `ExerciseGoal.targetRIR/targetSets`
- `7ad1365` `WorkoutSet.rir`
- `f7837d2` `currentSession.notes` from start-from-block
- `8936540` template-routine import empty fields
- `c1ff666` `Routine.program` group modal
- `d9ff0fc` `Routine.program` editor

**Verification:** Store-layer Vitest invariant tests landed on the e2e-harness branch
(`80192dd`) — `src/store/useStore.test.ts`, `src/store/useCalendarStore.test.ts`. The intended
e2e round-trip is now active — the AuthContext race that blocked it is fixed (see
"Cross-cutting blocker" below).

**Side findings flagged for later:**
- `useStore.startWorkout` without `routineId` leaves `currentSession.routineId = undefined`.
  Same class as Batch 1 but not in the original audit scope.
- `Settings.tsx` data-export filename (in the JSON-export handler) uses the banned
  `toISOString().split('T')[0]`.

## Batch 2 — Quick wins ✅ Merged

**Merge:** `11f2861 Merge branch 'claude/audit-batch2-quickwins'`.

**Commits in the batch:**
- `2c4aef9` Stop wiping cloud routines on missing `program` field. The merge logic was
  matching against the wrong key, so cloud routines without the optional `program` got
  overwritten by the in-memory defaults.
- `483be06` Preserve profile weight when back-filling older weight entries. The back-fill
  was overwriting `user.weight` with each historical entry's weight.
- `534f7a8` Apply unit-aware weight bound in Settings. The bound was hard-coded for kg.
- `50dba8d` Omit onboarding email field when sign-in provides no email. (Some Google
  sign-ins return no email; writing `undefined` rejected the onboarding doc.)

**Verification:** None landed with the batch (these are localized fixes). Should be covered
by future Vitest expansion.

## Batch 3 — Diet UX correctness ✅ Merged in 5bbd9a6

**Branch:** `claude/audit-batch3-diet-ux` (off main at `6836f5a`). Eight commits, ready for
merge to main. All five scope items landed with full Vitest coverage.

### What landed

| Commit | Subject | What it does |
|---|---|---|
| `420617f` | docs(infra): record Batch 3 in-flight state and the parseDateStamp corollary | Pre-work: captured propose-and-wait decisions and the parseDateStamp trap finding into AUDIT_STATE / PROJECT_STATE / DATA_POLICY before code commits started. |
| `d928d67` | fix(diet): render custom mealTypes on Diet and History pages | #1 — anchor slots first, custom mealTypes appended in first-appearance order. Humanize-fallback for unknown strings. |
| `d960249` | fix(diet): use parseDateStamp + getDateStamp in useDietStore date math | #3 (Option A) — local-aware end-to-end. Removes the parseDateStamp trap. |
| `6539aa0` | test(diet): vitest coverage for the Batch 3 date-stamp fix | #5a — three TZ-sensitive regression sentinels (PST) plus a TZ-override sanity check. Run vacuously in UTC; meaningful in non-UTC. |
| `f9af9f4` | refactor(diet): rename DietMealNew → DietMealEditor (behavior-preserving) | #2 part 1 — pure rename for symmetry with DietRecipeEditor. |
| `84aecf6` | feat(diet): add edit-mode support to DietMealEditor + register route | #2 part 2 — useParams + getMeal + isEditing + addMeal vs updateMeal. New `/diet/meals/:id/edit` route. |
| `716c20f` | test(diet): vitest coverage for the meal editor (first component test) | #5b — three component tests (create / edit / stale-id). First component test in the repo; pattern documented inline for future use. |
| `746b513` | refactor(diet): strip mealReminders feature, bump store version with migration | #4 — full strip across types, store, settings UI. Persist version 0 → 1 with `dietStoreMigrate` (exported, unit-tested for happy path + 3 edge cases). |

### Decisions (Phase B)

| # | Item | Decision |
|---|---|---|
| 1 | Render custom `mealType` strings on `Diet.tsx` and `History.tsx`. | Derive visible mealType list from entries; built-ins first, custom appended; humanize unknown labels. |
| 2 | `/diet/meals/:id/edit` was a dead Edit pencil. | **Build it (Option A) with rename.** Mirror `DietRecipeEditor.tsx`. Rename `DietMealNew.tsx` → `DietMealEditor.tsx`. |
| 3 | Replace banned `toISOString().split('T')[0]` in `useDietStore.ts`. | **Option A — full local-aware fix.** parseDateStamp + getDateStamp end-to-end. The naïve swap (Option B) introduces a one-day regression for non-UTC users — see DATA_POLICY.md §2 corollary. |
| 4 | `mealReminders` — store + DietSettings UI exists, no notification firing. | **Strip (Option A).** Removed type, store actions, default state, DietSettings section. Persist version 1 with migration. |
| 5 | Vitest coverage. | TZ-sensitive store-layer tests for #3; migrate-function unit test for #4 (4 cases); component tests for the meal editor (3 cases). |

### Verification

- `npm run lint` exit 0.
- `npm run build` exit 0 (1396.62 kB bundle, ~1 KB smaller than pre-batch).
- `npm test` exit 0 — 54/54 (43 prior + 4 date-stamp + 4 migrate + 3 component-test).
- `npm run test:e2e` not run as a gate (still fixme'd per docs/TESTING.md).
- TZ override sanity check passes — `new Date('2026-05-05').getDate()` returns 4 in PDT/PST.

### Side findings flagged for future batches

- `useStore.startWorkout` `routineId = undefined` (flagged in Batch 1) is still pending —
  Batch 6 territory.
- `Settings.tsx` data-export filename still uses banned `toISOString().split('T')[0]` —
  Batch 6.
- `Cloud Functions todayDateString` UTC fallback — Batch 5.
- The `humanizeMealType` helper is duplicated between `Diet.tsx` and `History.tsx`. If a
  third caller appears, extract to `src/utils/`. Two copies is acceptable — premature DRY.
- First component test in the repo landed (`DietMealEditor.test.tsx`). The renderAt() helper
  shape is documented inline; future component tests in `src/pages/` should copy it.
- Persist `version` for `useDietStore` is now 1. Next persisted-shape change must bump to 2
  and chain the migrations.

## Integration & hardening batch ✅ Merged

A broad hardening pass — run as an autonomous session against a weakness map rather than under
the planned Batch-4/5/6 naming — landed via a set of topic branches, integrated on
`claude/integration-hardening` (`7c949b9`) and merged to `main` through `eceb6fd`. All the
branches below are now merged and **pruned**; `main` is the single source of truth.

**What landed (by area):**
- **Build / perf:** `392bfac` lazy-load routes + split vendor chunks (recharts / firebase);
  `84a36e1` memoize Progress derived series and bound the "all" range to real data; `a6c2b44`
  correct the recharts chunk matcher. → **Retires the Batch-6 bundle-size side finding.**
- **Backup / restore:** `2ea294f` capture user data in backup + real restore overwrite;
  `a6c2b44` quarantine empty backups.
- **Auth / sync integrity:** `fd30e17` close three silent data-loss paths in `AuthContext`;
  `9763e0d` surface `cloudError` + logout failure in the UI.
- **A11y / UX:** `bd95a3e` un-nest interactive controls in Workout/History accordions;
  `669084d` Add-Exercise selector dark-mode variants; `afdee44` DietLog servings input holds
  partial text and clamps on commit; `e77772f` `+N more` overflow for all-day events in the
  calendar week view.
- **Workout history UX:** `4f6c74c` reachable from Dashboard & Workout; `aade036` surface RIR +
  notes in expanded cards; `98f4fe1` per-set exercise history + reachable detail route;
  `da0abce` browsable day-by-day All-Workouts list.
- **Also landed earlier in the same window:** the CI workflow (`.github/workflows/ci.yml`), the
  README refresh, the Jeff Nippard PowerBuilding program (`f4f612d`), and Blocks per-workout
  done-tracking (`f94ed99`).

**Verification:** `lint` / `build` / `test` green on `main` after integration (120 tests).

## Diet plans ✅ Merged

**Merge:** `742fa97 Merge branch 'claude/diets-menu-d7x2' into main`.

Goal-based Diet plans — curated multi-meal reference plans keyed by goal, seeded in
`src/data/diets.ts` and surfaced through a new `DietPlanDetail` page (`/diet/diets/:id`) with an
entry point on the Nutrition diary.

- `6312a96` feat(diet): goal-based Diets menu with active plan + one-tap logging. Adds the
  `activeDietId` persisted slice to `useDietStore` — **all five mirror places** (interface,
  `resetStore`, `getCloudSyncData`, `loadFromCloud`, the `AuthContext.startSync` equality check)
  plus a **persist `version` 1 → 2** bump (additive; `dietStoreMigrate` needs no extra step —
  zustand's default merge supplies the `null` initializer for pre-v2 state). `logDietMeal` writes
  a synthetic `type: 'meal'` food-log entry (no undefined, `getDateStamp` for the date — invariants
  1/2/10 respected).
- `d2d1ad4` fix(workout): separate previous-workout notes for repeated exercises.
  `getLastWorkoutForExercise` gained an `occurrence` param; read-only, no persisted-shape change.
- `277a65b` fix(diet): add Diets/Meals entry point on the Nutrition diary.

**App.tsx merge note:** the branch predated route code-splitting, so its eager `DietPlanDetail`
import conflicted; resolved in favour of `main`'s lazy route tree (lazy import + the
`/diet/diets/:id` route). Adversarially verified (5-place rule, invariants, conflict completeness)
before the push — no findings.

## Batch 4 — Calendar recurrence ⏳ Pending

**Branch (planned):** `claude/audit-batch4-recurrence`.

**Scope:** the recurrence engine in `src/utils/calendar.ts` has known gaps in:
- exception handling (single-instance overrides via `seriesMasterId` + `originalDate`),
- weekly `daysOfWeek` semantics,
- monthly recurrence (especially "nth weekday of month" — `weekOfMonth` ordinal).

**Verification approach:** Vitest for the recurrence engine first (table-driven tests over
known rules vs. expected occurrences), then component tests, then e2e if the harness is
unblocked.

## Batch 5 — Cloud Functions Siri TZ + recurrence expansion ⏳ Pending

**Branch (planned):** `claude/audit-batch5-siri-tz`.

**Scope:**
- `functions/src/index.ts` — `todayDateString(tz)` falls back to UTC when `tz` is missing
  or invalid. Should require `tz` (return 400) or use a configured per-user default from
  `users/{uid}/data/siriConfig.timezone`.
- The functions read stored events without expanding recurrence, so a weekly event speaks
  the original master start date instead of today's occurrence. Need server-side expansion
  using the same logic the client uses (or extracted into a shared `lib/`).
- Token cache TTL is 60 s; tokens revoked on the client may keep working server-side for up to
  60 s. Audit whether to push revocations through immediately.

**Verification approach:** Functions emulator + targeted tests; check live behavior after
deploy.

## Batch 6 — Polish ⏳ Pending

**Branch (planned):** `claude/audit-batch6-polish`.

**Scope:** TBD. Will sweep up flagged side findings from earlier batches:
- `useStore.startWorkout` undefined `routineId` — still open,
- `Settings.tsx` data-export filename (`:221`, banned `toISOString().split('T')[0]`) — still open,
- ~~bundle-size warning (1.4 MB; manualChunks)~~ — ✅ done in the integration & hardening batch
  (`392bfac` lazy routes + vendor chunking),
- whatever else gets flagged on the way through.

## Cross-cutting blocker — AuthContext race ✅ Resolved

Audit finding C-1. Fixed on branch `claude/fix-authcontext-race-8mq2`
(`fix(auth): close AuthContext cloud-sync race (A + B)`).

`AuthContext.tsx`'s `onAuthStateChanged` callback ran `resetStore()` then awaited the cloud
loads then `loadFromCloud()` — both destructive whole-store overwrites. A duplicate or late
emission (Firebase's cached-then-verified double-fire; React StrictMode's dev double-invoke)
re-ran that pair after the UI had gone interactive, wiping a concurrent local write; the wipe
then synced to Firestore.

**What landed:**
- `resolveAuthAction` (`src/contexts/authSession.ts`) — pure helper classifying each
  emission as `establish` / `skip` / `sign-out`. A same-uid re-fire is a `skip`; an
  unexpected `null` (not an in-app sign-out) is also a `skip`. Closes Race B.
- An `AbortController` per `establish` chain; a newer chain aborts the older, which bails
  after its `await`. Closes Race A (overlap).
- `resetStore()` fused with `loadFromCloud()` after the await as one synchronous block —
  no empty-state TOCTOU write.
- `startSync` unsubscribes prior refs first — no subscriber leak.
- `logout()` / `deleteAccount()` set an intentional-sign-out flag, so a transient `null`
  emission is never treated as a sign-out.

**Verification:** `npm run lint` / `npm run build` clean; `npm test` 78/78 (adds an
11-case `resolveAuthAction` table test and an 8-case `AuthContext` integration test that
reproduces both races in jsdom). The e2e spec
`tests/e2e/calendar-location-roundtrip.spec.ts` is un-`fixme`'d and
`playwright.config.ts`'s `webServer.command` is back to `npm run dev`.

Design and rationale: `docs/plans/fix-authcontext-race.md`.

## When to update this file

Update AUDIT_STATE.md when:
- A batch's status changes (pending → in-progress → merged).
- A side finding is added.
- The cross-cutting blocker is resolved.
- A new batch is scoped.

If a batch's commit list grows past ~10 entries, link to the merge commit and trim the body —
this file is for status, not history. CHANGELOG.md owns the human-readable history.
