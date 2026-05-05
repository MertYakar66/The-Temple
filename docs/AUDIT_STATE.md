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
e2e round-trip is fully written but `test.fixme()`'d (see "Cross-cutting blocker" below).

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

## Batch 3 — Diet UX correctness ⏳ Pending

**Branch (planned):** `claude/audit-batch3-diet-ux`.

**Scope:**
- Render custom `mealType` strings on the daily log. Currently the log groups only by the
  built-in breakfast/lunch/dinner/snack — custom types entered by the user are dropped.
- Fix `/diet/meals/:id/edit`. The route exists but the page doesn't load the meal it's
  editing.
- Replace `new Date().toISOString().split('T')[0]` with `getDateStamp()` in
  `useDietStore.ts` (call sites: `updateStreaks` action and `getWeeklyStats` action).
  Banned per `DATA_POLICY.md`; uses UTC and breaks for non-UTC users (date stamps roll
  over at the wrong moment).
- Decide on `mealReminders` feature. The store has the type and CRUD, but no UI exposes it.
  Either ship a UI or strip the dead actions.
- Add Vitest tests for the date-stamp fix and the meal-edit page.

**Verification approach:** Vitest at the store/utility layer for the date-stamp fix; component
test for the meal editor; defer e2e to whenever the AuthContext race is fixed.

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
- `useStore.startWorkout` undefined `routineId`,
- `Settings.tsx` data-export filename,
- bundle-size warning (1.4 MB; manualChunks),
- whatever else gets flagged on the way through.

## Cross-cutting blocker — AuthContext race

Not a batch of its own yet; will get sequenced once Batch 3 is closed.

`AuthContext.tsx` — the `onAuthStateChanged` callback in `AuthProvider`'s `useEffect` runs
`resetStore()` on all three Zustand stores before awaiting `Promise.all` of the cloud loads. Firebase emits the listener more than
once on initial page load (cached-user fire, then a verified fire). Each chain runs
reset → load → start sync. If a chain whose `resetStore` lands AFTER user interaction wins
the race, it wipes the local write. Reproduced reliably under bot-style fast interaction (~300
ms post-click in Playwright).

**Fix shape:**
- Track an in-flight token / `AbortController` across callback runs.
- Verify `auth.currentUser?.uid === user.uid` before resetting / loading / starting sync; bail
  if a newer chain is already in flight.
- Unsubscribe the prior `unsubXxxRef` before overwriting (currently leaks).

**Why it's pending:** the e2e harness is the immediate payoff (it stays `test.fixme()`'d
until then), but the in-app impact is rare in practice (real users pause between page-load
and click). So Batch 3 went first because Diet UX bugs are user-visible today.

When this lands, do these together:
- Switch `tests/e2e/calendar-location-roundtrip.spec.ts` from `test.fixme` back to `test`.
- Switch `playwright.config.ts`'s `webServer.command` back to `npm run dev` (faster local
  iteration).

## When to update this file

Update AUDIT_STATE.md when:
- A batch's status changes (pending → in-progress → merged).
- A side finding is added.
- The cross-cutting blocker is resolved.
- A new batch is scoped.

If a batch's commit list grows past ~10 entries, link to the merge commit and trim the body —
this file is for status, not history. CHANGELOG.md owns the human-readable history.
