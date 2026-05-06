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

## Batch 3 — Diet UX correctness 🚧 In flight

**Branch:** `claude/audit-batch3-diet-ux` (off main at `6836f5a`). No commits on the branch
yet — Phase A read complete, Phase B decisions made, Phase C halted on a #3 finding awaiting
the owner's call.

### Phase A — files read

`Diet.tsx`, `History.tsx`, `DietMeals.tsx`, `DietMealNew.tsx`, `DietRecipeEditor.tsx`,
`DietSettings.tsx`, `useDietStore.ts`, `App.tsx`, `types/index.ts`. No code touched yet.

### Phase B — decisions

| # | Item | Status | Decision |
|---|---|---|---|
| 1 | Render custom `mealType` strings on `Diet.tsx` and `History.tsx`. Both pages hard-filter by built-in slot lists, so custom strings (and `pre_workout`/`post_workout` on Diet.tsx) render nothing. | Mechanical | Derive the visible mealType list from the entries themselves; built-ins first, custom appended; humanize unknown labels. |
| 2 | `/diet/meals/:id/edit` is a dead Edit pencil — `DietMeals.tsx` links to it but `App.tsx` registers no route. The catch-all silently redirects to dashboard. | Propose-and-wait | **Build it (Option A) with rename.** Mirror `DietRecipeEditor.tsx`'s edit-mode pattern. Rename `DietMealNew.tsx` → `DietMealEditor.tsx` for symmetry. Register the new route. |
| 3 | Replace banned `toISOString().split('T')[0]` in `useDietStore.ts` (`updateStreaks`, `getWeeklyStats`). | **Mechanical → re-classified** | **Open question (Option A vs B).** See below — the simple swap as originally specified introduces a one-day regression for non-UTC users. |
| 4 | `mealReminders` — store + DietSettings UI exists, no notification firing. (Original prompt assumed no UI; Phase A correction: there IS a settings editor.) | Propose-and-wait | **Strip (Option A).** Remove type, store actions, default state, DietSettings section. Bump persist version + write `migrate` that drops persisted `mealReminders` while preserving everything else. |
| 5 | Vitest coverage. | Mechanical | Test the #3 fix at the store layer (with a TZ-aware setup that fails under the regression); recommended migrate-function unit test for #4 (3 lines, eliminates the only failure mode). Component test for the meal editor only if feasible. |

### Open question — Item #3 trap

The originally specified swap (`d.toISOString().split('T')[0]` → `getDateStamp(d)`) does NOT
work as a one-line fix. Tracing the math:

The current code's input is already a date stamp (e.g. `weekStartStr = format(currentWeekStart,
'yyyy-MM-dd')` from `DietWeekly.tsx`). `new Date('YYYY-MM-DD')` parses as UTC midnight per
ECMAScript spec. The pattern then operates the Date in local time via `setDate` and reads it
back via `toISOString`, which round-trips through UTC midnight cleanly. Output happens to be
correct for any timezone — the UTC parse and UTC format cancel.

`getDateStamp` formats in *local* time. Replacing only the format step breaks the cancellation:
in PST, `new Date('2026-01-12')` becomes `Jan 11 16:00 PST`, and `getDateStamp` of that returns
`'2026-01-11'` — a one-day backward shift relative to the requested input.

**Two options:**

- **Option A — full local-aware fix.** Replace `new Date(date)` with `parseDateStamp(date)`
  AND `toISOString().split('T')[0]` with `getDateStamp(d)`. Local arithmetic end-to-end.
  Same output as today for all timezones; removes the trap. 4 line edits + 1 import.
- **Option B — originally specified swap.** Just `getDateStamp(d)` for the format step.
  **Regression** — week boundaries shift back one day for non-UTC users. Low value.

Recommendation in the conversation: **A**. The "mechanical" framing of #3 in the original
Batch 3 prompt was wrong; this is a Phase B-class scope decision. Holding for the owner's
explicit call before Phase C resumes.

### Suggested commit grouping (when Phase C resumes)

Per `docs/COMMIT_STYLE.md`, lowest-risk first, highest-risk last:

1. `fix(diet): render custom mealTypes on Diet and History pages` (#1)
2. `fix(diet): use parseDateStamp + getDateStamp in useDietStore date math` (#3, assuming A)
3. `test(diet): vitest coverage for date-stamp fix` (#5a)
4. `refactor(diet): rename DietMealNew → DietMealEditor` (#2 part 1, behavior-preserving)
5. `feat(diet): add edit-mode support to DietMealEditor + register route` (#2 part 2)
6. `test(diet): vitest coverage for meal editor` (#5b, if feasible — else skip with note)
7. `refactor(diet): strip mealReminders feature, bump store version with migration` (#4)

The store-version bump in #7 is the highest-risk change; do last so a rollback only loses
one commit. Migrate function should be unit-tested with a hand-constructed old-shape object
(input has `mealReminders` and other persisted fields → output preserves everything except
`mealReminders`).

### Verification approach

Vitest at the store/utility layer for #3 (with `vi.useFakeTimers().setSystemTime` and a
process TZ that distinguishes Option A from Option B). Migrate-function unit test for #4.
Component test for the meal editor only if the patterns extend cleanly. Defer e2e to whenever
the AuthContext race is fixed.

### Side findings flagged during Phase A

- `MealType` type in `src/types/index.ts` is now `string` (line 186) — fully open. The
  audit comment in the original prompt assumed it was a closed union; it isn't. The fix
  for #1 must humanize unknown strings rather than route them through a Record lookup.
- `DietSettings.tsx` mealTypeLabels lookup (`Record<MealType, string>`) was used to render
  reminder display labels. Removed entirely once #4 strips the reminders.
- `useStore.startWorkout` `routineId = undefined` (flagged in Batch 1) is still pending —
  Batch 6 territory.

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
