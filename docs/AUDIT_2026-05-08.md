# Audit — 2026-05-08

Read-only audit pass over the TheTemple codebase. Investigation only; no edits made during the audit. Findings prioritized by impact and grouped by severity.

## Summary

1. **AuthContext race is worse than documented**: in addition to the known wipe pattern, each cold-load `onAuthStateChanged` fire leaks a Zustand subscriber (`startSync` overwrites `unsubWorkoutRef.current` without calling the old unsub) AND the synchronous `resetStore()` triggers a debounced empty-state save that, if `loadFromCloud` exceeds 2s, lands on Firestore before the loaded state.
2. **Siri Cloud Functions double-count macros**: `entry.macros` is already total (multiplied by servings at write time in `useDietStore.logFood/logRecipe`), but `sumMacros` and `siriNutrition`'s `mealBreakdown` multiply by servings again. Calorie / protein readouts are over-reported by a factor of `servings`.
3. **`startWorkout(name)` writes `routineId: undefined`** into `workoutSessions[i]` and `currentSession`. `Workout.tsx:259` is the only caller without a `routineId`. Firestore client SDK rejects `undefined`; `saveWorkoutData` swallows the error silently → cloud sync silently stops for that user.
4. **Logout flush silently swallows errors**: `saveWorkoutData`/`saveDietData`/`saveCalendarData` all catch internally and never throw, so `Promise.all` in `AuthContext.logout` always resolves and `await signOut(auth)` proceeds even when the flush failed.
5. **Cloud Function `todayDateString` UTC fallback** is documented as "Batch 5 territory" but `siriConfig.timezone` is written by the client and never read by the server — the function only ever sees `?tz=` query params.

---

## Critical — data loss, auth, security

### C-1. AuthContext race: leaked subscribers + reset-driven empty-state write

- **Files**: `src/contexts/AuthContext.tsx:89-148`, `src/lib/firestoreSync.ts:52-58`
- **What's wrong**:
  - **(a)** `startSync` (lines 95, 110, 123) writes to `unsubWorkoutRef.current = useStore.subscribe(...)` without calling any prior `unsubWorkoutRef.current()` first. When `onAuthStateChanged` fires twice on cold load, the second `startSync` orphans the first chain's three subscribers — they keep firing, debouncing duplicate writes per state change, and never get cleaned up until logout.
  - **(b)** The three synchronous `resetStore()` calls at lines 156-158 do fire Zustand subscribers (because `state.workoutSessions !== prevState.workoutSessions` after the reset — both new arrays). Those subscribers schedule `debouncedSaveWorkoutData(uid, EMPTY_STATE)` for ~2s out. The subsequent `await Promise.all([loadWorkoutData, ...])` (line 162) is racing the 2-second debounce; if load exceeds 2s on a cold/slow connection, the empty state hits Firestore before `loadFromCloud` resets the timer.
  - **(c)** Combined with the already-documented "second chain's `resetStore` lands AFTER user interaction" wipe, this is a multi-mode failure: subscriber leak + empty-state TOCTOU + interaction wipe.
- **Why it matters**: lost workouts/PRs/weight history on cold-loads with slow networks; double Firestore writes for every state mutation across leaked subscribers (cost + write contention). The fixme'd e2e at `tests/e2e/calendar-location-roundtrip.spec.ts:94` already trips this.
- **Suggested fix**: introduce a generation counter (`useRef<number>`); each callback bumps and captures it; before `loadFromCloud` and `startSync`, bail if `myGen !== currentGen`. In `startSync`, call the prior unsub before overwriting. After `resetStore` calls, temporarily mute the equality-check subscribers (e.g., flip a `loadingRef` that the subscriber checks first) until `loadFromCloud` runs, so the empty-state write is never scheduled.
- **Confidence**: high — validated against the codebase + the spec's documented reproduction.
- **Repro**: throttle network → DevTools, force a cold load with cached Firebase Auth user; observe `useStore.getState().workoutSessions.length` drop to `[]` between the cached and verified `onAuthStateChanged` fires, then drop in cloud at debounce time.

### C-2. Siri Cloud Functions double-count macros

- **Files**: `functions/src/index.ts:140-157` (`sumMacros`), `functions/src/index.ts:465-471` (`siriNutrition` `mealBreakdown`), vs. `src/store/useDietStore.ts:316-329` (`logFood`), `src/store/useDietStore.ts:371-393` (`logRecipe`), `src/store/useDietStore.ts:411-422` (`getDailyMacros`)
- **What's wrong**: at write time, `logFood` stores `entry.macros = food.macros * servings` (already total) and also stores `entry.servings`. `getDailyMacros` correctly sums `entry.macros.calories` directly. The Cloud Functions instead do `(macros.calories || 0) * servings` — multiplying again. For a 3-serving entry of 200 cal/serving, the client says 600 cal, Siri says 1800.
- **Why it matters**: the entire Siri Daily Briefing and Nutrition Check return wrong calorie/protein numbers as soon as any `servings != 1` exists. Users tracking cuts/bulks could under/overeat. `logMeal` happens to pass because it sets `servings: 1`, masking the bug for meal-template logs.
- **Suggested fix**: drop the `* servings` factor in `sumMacros` and the `mealBreakdown` reducer — the stored macros already include serving multiplication. Add a Vitest unit covering `sumMacros` against a fixture that mirrors `useDietStore.logFood`'s output.
- **Confidence**: high — verified by reading both the writer and the reader, plus the client `getDailyMacros` for cross-check.
- **Repro**: log a 3-serving food via the Diet UI; curl `https://us-central1-the-temple-f195e.cloudfunctions.net/siriNutrition?token=...&tz=...`. Compare numbers to the in-app Diet page.

### C-3. `startWorkout(name)` writes `routineId: undefined`

- **Files**: `src/store/useStore.ts:154-198` (writer), `src/pages/Workout.tsx:259` (the only `undefined`-`routineId` caller), test note at `src/store/useStore.test.ts:91-97`
- **What's wrong**: `startWorkout('My workout')` constructs `{ ...session, routineId }` where `routineId` is the second parameter, defaulting to `undefined` when not passed. The session lands in `currentSession`, then in `workoutSessions[]` after `endWorkout`. Both make it into `getCloudSyncData()`. Firestore client SDK rejects payloads containing `undefined`. `saveWorkoutData` (`src/lib/firestoreSync.ts:43-50`) catches the rejection and only `console.error`s — the user gets no signal.
- **Why it matters**: any user who starts a "free" workout from `Workout.tsx`'s "+" path (not via routine, not via block) breaks their workout-doc sync silently. Subsequent debounced writes for anything in that store keep failing as long as the offending session sits in `workoutSessions[]`. Future devices reading from cloud miss every workout written after the first free workout.
- **Suggested fix**: in `startWorkout`, attach `routineId` only when truthy: `...(routineId ? { routineId } : {})`. Audit other writers using the same pattern as the Batch 1 null-emit work.
- **Confidence**: high — the test file at `src/store/useStore.test.ts:91-97` explicitly calls this out as a known unfixed Batch-1-class issue.
- **Repro**: from `/workout`, "Start Workout", name only, then end. Check `users/{uid}/data/workout` in Firestore — newest session won't appear (or `workoutSessions` won't update at all if the array now contains the bad object).

### C-4. Logout flush silently swallows save errors

- **Files**: `src/contexts/AuthContext.tsx:210-230`, `src/lib/firestoreSync.ts:43-50,77-84,111-118`
- **What's wrong**: each `saveXxxData` has its own try/catch that logs and returns. They never throw. So `Promise.all([saveWorkoutData, saveDietData, saveCalendarData])` always resolves; the surrounding try/catch in `logout` is dead code. The user signs out thinking the flush succeeded.
- **Why it matters**: combined with the 2s debounce, any state changes within the last 2s before logout are flushed via this non-debounced path. If the flush fails (transient network, rules violation from a bug like C-3), the user loses their last-2s edits and has no signal. They'll log in on another device and see stale data.
- **Suggested fix**: make `saveXxxData` propagate errors (remove the try/catch), let the call site decide whether to surface. The logout flow should report the failure to the user (e.g., a toast) and offer to retry before signing out.
- **Confidence**: high.
- **Repro**: in dev, set network offline; logout with pending state; observe console error but a clean `signOut`. Re-login on another device → missing edits.

---

## High — broken invariants, correctness

### H-1. Cloud Function `todayDateString` UTC fallback ignores stored `siriConfig.timezone`

- **Files**: `functions/src/index.ts:105-119`, `functions/src/index.ts:122-138` (mirror in `getDayOfWeek`), `src/lib/siriToken.ts:53-81` (writer of `siriConfig.timezone`)
- **What's wrong**: the Cloud Functions resolve "today" purely from `?tz=` query param. Missing/invalid → `new Date().toISOString().split("T")[0]` → UTC. The user's `siriConfig.timezone` is written by `generateSiriToken(uid, timezone)` but never read by the server. Same gap in `getDayOfWeek`.
- **Why it matters**: a Pacific-time user calling the URL without `?tz=` (forgotten in the Apple Shortcut, or curl/test) gets UTC's day, which is ahead by 7-8 hours. After 4-5 PM local, "today" silently becomes tomorrow → no events / no workout / wrong nutrition log. Also breaks routine-day-of-week resolution at the day boundary.
- **Suggested fix**: in `authenticateToken`, after the cache hit/miss read, also fetch `users/{userId}/data/siriConfig.timezone` and pass it down as a fallback: `const tz = req.query.tz || siriConfig.timezone || undefined`. If both still missing, return 400 instead of UTC.
- **Confidence**: high.
- **Repro**: hit `siriDailyBriefing` with `?token=...` (no `?tz=`) at 5 PM PST.

### H-2. `Settings.tsx` export uses banned date pattern

- **File**: `src/pages/Settings.tsx:211`
- **What's wrong**: `a.download = `thetemple-export-${new Date().toISOString().split('T')[0]}.json`` — exactly the pattern banned by `src/utils/date.ts:5` and AGENTS.md invariant #2. The consequence here is just that the filename uses UTC's date instead of local, but the pattern is the documented red-flag.
- **Why it matters**: low blast radius (filename only), but the docs/AUDIT discipline has been to grep this pattern out of the codebase. Letting one persist invites copy-paste reuse elsewhere.
- **Suggested fix**: `a.download = `thetemple-export-${getDateStamp()}.json``.
- **Confidence**: high.

### H-3. Stores' `loadFromCloud` uses `??` against empty cloud values

- **Files**: `src/store/useStore.ts:894-905`, `src/store/useDietStore.ts:536-546`, `src/store/useCalendarStore.ts:254-261`
- **What's wrong**: each `loadFromCloud` does `(data.routines as Routine[]) ?? get().routines` — i.e., only falls back when cloud is `null`/`undefined`. If a prior bug ever wrote `{ routines: [] }` to cloud (e.g., via the C-1 empty-state write), `[] ?? defaultRoutines` evaluates to `[]` and the user loses their default routines on next login.
- **Why it matters**: amplifies C-1 — the wipe survives reload. Once cloud is wiped, every reload re-applies the wipe.
- **Suggested fix**: tighten the fallback to also catch arrays of length 0 for the initial load when local is also empty, OR make `loadFromCloud` only run once per chain (after the C-1 fix), and rely on `??` purely for the first-time-no-doc case (which `loadWorkoutData` already returns as null).
- **Confidence**: medium — depends on whether C-1 is fully fixed first; standalone, this is a defensive concern, not a known repro.

### H-4. `currentSession` is in the sync slice — every set tap triggers debounced cloud write

- **Files**: `src/contexts/AuthContext.tsx:99` (equality check), `src/store/useStore.ts:898,907-924`
- **What's wrong**: AGENTS.md §5 lists `currentSession` as "ephemeral state ... in some contexts," but the implementation includes it in the equality check, ships it in `getCloudSyncData`, and restores it via `loadFromCloud`. So every `toggleSetComplete`/`updateSet`/`addSetToExercise` in an active workout (~1 tap per second during a hard set) triggers a debounced 2s write. The doc grows because each write replaces `workoutSessions` AND re-ships `currentSession`. Cost + Firestore quota.
- **Why it matters**: not a correctness bug per se — preserving an in-progress workout across devices is a feature — but the cost/policy is undocumented. Also, the null-emit on logout (when `currentSession === null`) actively clears the cloud's `currentSession`, which is correct.
- **Suggested fix**: either (a) document this is intentional and accept the cost; (b) sync `currentSession` to a separate, smaller doc (`users/{uid}/data/activeWorkout`) to avoid re-shipping the full payload every tap; or (c) drop it from sync and accept that an in-progress workout doesn't carry across devices.
- **Confidence**: medium — depends on intent; flagging for explicit decision.

---

## Medium — code health, perf, type safety

### M-1. `Progress.tsx` — unmemoized heavy computations on every render

- **File**: `src/pages/Progress.tsx:108-221`
- **What's wrong**: `today = new Date()` (line 109) inside the function body creates a new `Date` per render → `getRangeStart()` returns a new `Date` → `eachDayOfInterval(...)` (line 142, 171) is called on every render → `workoutFrequencyData`, `dietTrackingData`, `bodyWeightData` all recomputed. None of them are wrapped in `useMemo`. With months/years of weight entries and workouts, the iterating arrays grow.
- **Suggested fix**: wrap the data-derivation blocks in `useMemo([deps])`. Stabilize `today` per render via `useMemo(() => new Date(), [])` (or accept fresh-per-day by deriving once per today's date stamp).
- **Confidence**: high (read).

### M-2. No code splitting / route-level lazy loading

- **File**: `src/App.tsx:1-39`
- **What's wrong**: every page imports eagerly. Recharts (~150KB min), `@googlemaps/js-api-loader`, all editors, all settings — all in the initial bundle. For a mobile-first PWA, this hurts first-paint.
- **Suggested fix**: `const Progress = React.lazy(() => import('./pages/Progress'));` and similar for editors, with `<Suspense fallback={<LoadingScreen />}>`. Vite + Rollup will chunk per import. Recharts and `js-api-loader` will land in their own chunks.
- **Confidence**: high.

### M-3. Cloud Functions have zero unit tests

- **Files**: `functions/` has only `package.json` and `src/index.ts`, no test runner configured.
- **What's wrong**: input validation, token cache, macro accumulation, event filtering — all untested. C-2 and H-1 would have been caught by trivial fixtures.
- **Suggested fix**: add `vitest` (or jest) to `functions/`, write tests for `sumMacros`, `filterTodayEvents`, `filterTodayRoutines`, `authenticateToken` (mock Firestore), `todayDateString(tz)`.
- **Confidence**: high.

### M-4. No rate limiting / `maxInstances` on Cloud Functions

- **File**: `functions/src/index.ts:252,346,386,431` (all `onRequest({ cors: true })`)
- **What's wrong**: no `maxInstances`, no per-token throttle. A leaked token plus a curl loop could rack up Firebase reads. Personal-use blast radius is small, but the surface exists.
- **Suggested fix**: `onRequest({ cors: true, maxInstances: 10 })` and a token-keyed in-memory rate limiter (Token can do 1/sec, 60/min — easily implemented in the cache module).
- **Confidence**: medium (small risk, easy mitigation).

### M-5. Token revocation lag

- **File**: `functions/src/index.ts:35-56`
- **What's wrong**: `tokenCache` TTL is 60s. A revoked token still authorizes for up to 60s after `revokeSiriToken`.
- **Suggested fix**: on delete `/siriTokens/{token}` (client-side), also POST to a `siriRevoke` Cloud Function that purges the cache entry across function instances (or use Firestore listeners). For personal use, 60s is acceptable — flag for future hardening.
- **Confidence**: medium.

### M-6. `LocationAutocomplete` — `any` proliferation + file-level eslint disable

- **File**: `src/components/calendar/LocationAutocomplete.tsx:23,24,25,31,56,92,95,128`
- **What's wrong**: `/* eslint-disable @typescript-eslint/no-explicit-any */` at file level, `let placesLib: any`, multiple `(loader as any)` casts. The `@types/google.maps` package is already in `package.json` devDeps but not used here.
- **Suggested fix**: replace with proper types from `@types/google.maps` (or `google.maps.places.AutocompleteService` etc.). Drop the file-level disable.
- **Confidence**: high.

### M-7. Empty-string vs null inconsistency in `RoutineEditor`

- **Files**: `src/pages/RoutineEditor.tsx:69-82`, `src/types/index.ts:113`
- **What's wrong**: `program: program.trim() || null` (correct null-on-clear) but `description: description.trim()` writes `''` instead of `null`. The type `description?: string` doesn't allow null, so the API is consistent with itself, but it's an outlier — every other optional editor field uses `T | null`.
- **Suggested fix**: pick one convention and apply. Most natural here: change type to `description?: string | null` and emit `description.trim() || null` for symmetry with the Batch 1 work.
- **Confidence**: medium — stylistic, but visible.

### M-8. `Workout.tsx` "free workout" path is the only `routineId: undefined` writer

- **File**: `src/pages/Workout.tsx:259`
- See C-3 above. Calling out separately because the fix is in the call site (or, better, in `startWorkout` itself) — `Workout.tsx:259` should probably just pass `undefined` explicitly and let `startWorkout` strip the key.
- **Suggested fix**: `startWorkout(workoutName.trim())` → unchanged at call site; fix is in `useStore.startWorkout` to omit key when falsy. (Already noted in C-3.)

---

## Low / Nits

- `src/pages/Progress.tsx:101`: `addWeightEntry(weightInKg, weightNotes.trim() || undefined)` passes `undefined`, relying on `addWeightEntry`'s `if (notes)` to skip — works, but it's the only caller using `undefined`-as-skip; matches the docs but worth aligning with explicit null somewhere.
- `src/pages/Workout.tsx:101-104` in `WorkoutExerciseCard.tsx:47` — `setExerciseGoal({ ..., notes: goalNotes })` without `.trim()` — empty notes can land as whitespace. Tiny.
- `src/contexts/AuthContext.tsx:194-198` cleanup runs `unsubscribe()` then `stopSync()`, but the `onAuthStateChanged` callback is itself async. If the cleanup fires mid-callback, there's still no cancellation — same root as C-1.
- `firebase.json:19-58` — security headers are good but no Content-Security-Policy. Not currently blocking.
- `tests/e2e/calendar-location-roundtrip.spec.ts:94` is the only Playwright spec, and it's `test.fixme()`'d — `npm run test:e2e` is effectively a no-op.
- 7 Vitest test files total (`src/store/useStore.test.ts`, `useDietStore.test.ts`, `useCalendarStore.test.ts`, `pages/DietMealEditor.test.tsx`, `utils/{date,weight,workoutMetrics}.test.ts`). Coverage of the 10 landmines is uneven (see Open Questions).
- `src/store/useStore.ts:898` `currentSession: (data.currentSession as WorkoutSession | null) ?? get().currentSession` — `??` here will preserve any prior `currentSession` when cloud writes `null`. After a logout-flush that wrote `{ currentSession: null }`, login on a new device with no local state is fine (both are null), but a re-login on the same device with a zombie `currentSession` would skip the cloud's "no session" signal. Edge case.
- `src/pages/Settings.tsx:80-81`: `useDietStore.getState()` and `useCalendarStore.getState()` outside a selector — fine for export-button construction, but won't re-render if the underlying stores change. Acceptable for an export action.
- `src/utils/calendar.ts:99` — recurring instance IDs use `${event.id}_${format(current, 'yyyyMMdd')}`. If a user has two recurring events with overlapping IDs (they shouldn't, since `event.id = uuidv4()`), the synthesized IDs would collide. Theoretical.

---

## Landmines Verified Clean

- **L4 — `getCloudSyncData()` lean exercises projection**: `src/store/useStore.ts:907-925` strips `exercises` to `{id, name}`. No other static data ships: `useDietStore.getCloudSyncData()` (lines 548-559) ships only user-mutable slices (`customFoods`, `recipes`, `meals`, `foodLog`, `recentFoodIds`, `dietSettings`, `streaks`) — `defaultFoods` is excluded. `useCalendarStore.getCloudSyncData()` (lines 263-271) ships `events`, `calendars`, `settings`, `invitations` — `DEFAULT_CALENDARS` is small (3 entries) and morphs into user data on first edit; not a static-payload risk.
- **L6 — firebase-admin containment**: zero refs in `src/`; `package.json:21-32` has no `firebase-admin` dep. Commit `9df1176` (verified via `git show`) removed it from frontend deps. `firebase-admin: ^13.0.0` is correctly only in `functions/package.json:14`. Scripts use `require('firebase-admin')` (`scripts/backup.cjs:10`, `scripts/restore.cjs:11`) — those are Node-only, not bundled.
- **L7 — auth flow containment**: a wide grep for `signOut|signInWithPopup|signInWithEmailAndPassword|createUserWithEmailAndPassword|GoogleAuthProvider|onAuthStateChanged|sendPasswordResetEmail|sendEmailVerification|reauthenticateWithCredential|deleteUser|updatePassword` outside `AuthContext.tsx` returns nothing. All pages go through `useAuth()`.
- **L9 — `Routine.dayOfWeek` 0=Sun..6=Sat**: confirmed at `src/types/index.ts:116` (`// 0-6, Sunday-Saturday`), used by `functions/src/index.ts:121` (`Returns 0=Sun..6=Sat, matching JS Date.getDay() and the app's Routine.dayOfWeek`), and the weekday→number map at `functions/src/index.ts:129-131` (`{ Sun: 0, Mon: 1, ... }`). Filter at line 184-188 uses the same convention. Editor at `src/pages/CalendarEventEditor.tsx:123` (`WEEKDAY_LABELS = ['Sun', 'Mon', ...]`) is consistent. No off-by-one.
- **L10 — calendar `isDeleted` filtering on read**: every read path filters:
  - `src/utils/calendar.ts:161` (`getEventsForDate`), :208 (`getEventsInRange`), :270 (`searchEvents`).
  - `src/store/useCalendarStore.ts:157` (`getEvent`).
  - `src/components/calendar/EventDetailPopover.tsx:20` (defensive double-filter).
  - All view consumers (`MonthView`, `WeekView`, `DayView`, `UpcomingView`, `CalendarSearch`, `CalendarEventDetail`, `CalendarEventEditor`) flow through these helpers.
  - The Cloud Functions also filter at `functions/src/index.ts:179` (`filterTodayEvents`).
- **L8 — store version migrations**:
  - `useStore` v2 with `migrate` (`src/store/useStore.ts:945-953`): the migration only touches `routines`, but the persisted shape includes `weightEntries`, `exerciseGoals`, `blockCustomizations` which were added later. No drift detected — the old shapes are forward-compatible (missing slices stay at default). Note: the merge callback at line 954-962 always overrides `exercises` from current state, which is correct given they're code-bundled.
  - `useDietStore` v1 with `dietStoreMigrate` (`src/store/useDietStore.ts:131-148`): drops `dietSettings.mealReminders`. Backed by the most thorough tests in the repo (`src/store/useDietStore.test.ts:144-209`).
  - `useCalendarStore` v1 with no `migrate` (`src/store/useCalendarStore.ts:285-287`): no shape changes since v1; clean.

---

## Open Questions

1. **Is `currentSession` deliberately synced?** The 5-site invariant treats it as synced (in equality check + `getCloudSyncData` + `loadFromCloud` + `resetStore`). AGENTS.md §5 hedges. Need a decision: keep as-is (cost), drop from sync (UX regression), or move to a smaller doc (engineering work). See H-4.
2. **Does the C-1 leaked-subscriber actually compound across multiple cold loads, or does Zustand's GC eventually clean up?** Reading the Zustand source would confirm. Strongly suspected: subscribers stay until manually unsubscribed.
3. **Is the Siri double-count (C-2) caught by any deployed monitoring?** It would have been visible to the user any time `servings != 1`. Either no one noticed, or no one routes nutrition through Siri yet. Surfacing the bug earlier suggests Siri usage is light.
4. **Is `npm test` currently passing on `main`?** The audit didn't run tests. Per instructions ("Don't run lint/build/test as actions"), this is left for a follow-up.
5. ~~**Does the C-3 `routineId: undefined` actually crash `setDoc` or get silently stripped by the Firebase v12 SDK?**~~ **Resolved 2026-05-08.** Firebase JS SDK v12.9.0 (the version pinned in `package.json`) inherits `ignoreUndefinedProperties = false` when no settings are passed to `getFirestore` (verified against `firebase-js-sdk` `packages/firestore/src/lite-api/settings.ts`: `this.ignoreUndefinedProperties = !!settings.ignoreUndefinedProperties` — undefined → `false`). The interface doc confirms: *"If set to `false` or omitted, the SDK throws an exception when it encounters properties of type `undefined`."* `firebase.ts:14-16` does NOT pass settings, so writes containing `undefined` throw `FirebaseError`. The silencing is in `saveWorkoutData`'s try/catch (`firestoreSync.ts:43-50`), not in the SDK. **C-3 stays CRITICAL.**

---

## Suggested Next Branches

(Impact-ordered; none depend on each other except as noted.)

1. **`claude/authcontext-cancellation-tokens`** — fixes C-1 (race + leaked subs + reset-driven empty save). Adds generation counter, mutes subscribers during reset+load, calls prior unsub before overwriting. Unblocks the Playwright spec at `tests/e2e/calendar-location-roundtrip.spec.ts` — flip `test.fixme` → `test`. Also unlocks C-3 fix being verifiable end-to-end.
2. **`claude/siri-macros-doublecount`** — single-line fix: drop `* servings` in `functions/src/index.ts:149-152` and :469. Add `functions/test/sumMacros.test.ts` with fixtures matching `useDietStore.logFood`'s output. Independent of #1.
3. **`claude/firestore-undefined-strip`** — fixes C-3 (`startWorkout(name)` writing `routineId: undefined`). Either strip the key in `useStore.startWorkout` or surface the error from `saveWorkoutData` so future undefined leaks are loud. Independent of #1, but worth landing alongside since the wider "swallow errors" pattern (C-4) shares the same fix shape.
4. **`claude/siri-server-side-tz`** — fixes H-1. Cloud Function reads `users/{uid}/data/siriConfig.timezone` as fallback; returns 400 if neither query nor stored tz available. Independent of #2.

(Out of scope for "next 4 branches" but worth queuing: route-level `React.lazy` (M-2), `Progress.tsx` memoization (M-1), Cloud Functions test runner (M-3), `LocationAutocomplete` typing cleanup (M-6).)
