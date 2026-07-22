# Project State

The single page that answers "what is this project right now?" If you're a new agent and only
have a minute, read this and then `AUDIT_STATE.md`.

## What it is

TheTemple — a personal fitness and life-management progressive web app. Live at
[thetemple.web.app](https://thetemple.web.app). One owner; not a public product.

Three product modules + one integration:
- **Workout** — sessions, sets/reps/weight, routines, PRs, weight history, exercise goals,
  per-set exercise history, a browsable day-by-day workout history, and the Jeff Nippard
  "Min Max" 12-week + "PowerBuilding" block programs (per-week customizations, per-workout
  done-tracking).
- **Diet** — foods, recipes, saved meals, daily food log, macro goals, training-day adjustments,
  streaks, TDEE calculator, and goal-based Diet plans (active-plan pick + one-tap logging).
- **Calendar** — events, multiple calendars, day/week/month/upcoming views, recurrence,
  invitations, Google Places autocomplete.
- **Siri** — Apple Shortcuts hit Firebase Cloud Functions for hands-free daily briefings,
  schedule, workout, and nutrition queries.

Plus body weight tracking with progress charts.

## Stack

React 19 + TypeScript + Vite. Zustand (with `persist` middleware) for state. Firebase Auth +
Firestore for cloud. Tailwind for styling. Recharts. `react-router-dom` v7. `date-fns`. Cloud
Functions in `functions/` (Node 20, firebase-admin). No backend server — everything is
client + serverless.

## Deploy state

- **Hosting:** `the-temple-f195e` Firebase project, hosting target `myapp` →
  `thetemple.web.app`. Deploy via `firebase deploy --only hosting:myapp`.
- **Functions:** four endpoints in `us-central1` (`siriDailyBriefing`, `siriSchedule`,
  `siriWorkout`, `siriNutrition`). Deploy via `cd functions && npm run deploy`.
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) runs `lint`/`build`/`test` (frontend)
  and `build`/`test` (`functions/`) on every PR and on pushes to `main` — no secrets needed.
  e2e is not in CI (it needs `.env.test`). A Vercel GitHub integration also posts a
  preview-deploy status check on every PR (no Vercel config in the repo).
- **Default branch:** `main`. Feature branches are `claude/<topic>-<suffix>`. Direct pushes to
  main are forbidden.

## What's implemented

Roughly: everything described in `MODULES.md` is shipped and working. The gaps are listed in
"What's in flight" and "Known risks".

## What's in flight

A multi-batch audit is mid-flight. See `AUDIT_STATE.md` for per-batch detail.

- **Batch 1 — Null-emit sweep.** ✅ Merged (`99cf9d4`). Replaced
  `{field: undefined}` writes with `null` (or omitted keys) across the editors so that
  `setDoc({merge:true})` actually clears optional fields when the user empties them.
- **Batch 2 — Quick wins.** ✅ Merged (`11f2861`). Stop wiping cloud routines on missing
  `program` field; preserve profile weight when back-filling older entries; unit-aware weight
  bounds in Settings; omit onboarding email when sign-in provides none.
- **E2E harness + repo foundation pass.** ✅ Merged into main at `6836f5a` (one merge commit
  covering both — the foundation pass branch was stacked on the e2e harness branch). Adds
  Playwright config, sign-in/sign-out helpers, one fixme'd Calendar location round-trip spec,
  Vitest store-layer null-emit invariant tests, plus the AI-handoff doc set
  (`PROJECT_STATE`, `AUDIT_STATE`, `ROADMAP`, `TESTING`, `DATA_POLICY`, `DECISIONS`,
  `COMMIT_STYLE`, `CHANGELOG`) and top-of-file headers on data-spine modules.
- **Batch 3 — Diet UX correctness.** ✅ Merged (`5bbd9a6`).
  Eight commits. Render custom mealTypes on Diet/History; full local-aware date math
  (parseDateStamp + getDateStamp end-to-end) with TZ-sensitive Vitest coverage; rename
  `DietMealNew` → `DietMealEditor` and add `/diet/meals/:id/edit` route with edit-mode
  support; strip `mealReminders` feature with persist v1 migration. First component test in
  the repo landed alongside. 54/54 tests green. See `AUDIT_STATE.md` Batch 3 for the full
  per-commit table.
- **AuthContext cloud-sync race fix.** ✅ Landed (`claude/fix-authcontext-race-8mq2`).
  Audit finding C-1 — the cancellation-unsafe `onAuthStateChanged`. The callback is now
  guarded: `resolveAuthAction` skips a same-uid re-fire and an unexpected `null`, a
  per-chain `AbortController` cancels superseded chains, and `resetStore`+`loadFromCloud`
  are fused after the await. The e2e harness is unblocked. See
  `docs/plans/fix-authcontext-race.md`.
- **Integration & hardening batch.** ✅ Merged (`eceb6fd` and the merges below it). A broad
  hardening pass landed via topic branches, now all merged into `main` and pruned: route
  code-splitting + vendor chunking (`392bfac`, retires the 1.4 MB bundle finding), Progress
  memoization (`84a36e1`), backup/restore recovery (`2ea294f`, `a6c2b44`), Workout/History
  a11y (`bd95a3e`), DietLog servings input (`afdee44`), week-view all-day overflow
  (`e77772f`), Add-Exercise dark mode (`669084d`), three AuthContext data-loss closures +
  cloud-error surfacing (`fd30e17`, `9763e0d`), and the workout-history UX / per-set history
  / All-Workouts list (`4f6c74c`, `aade036`, `98f4fe1`, `da0abce`). Plus a CI workflow, the
  README refresh, the PowerBuilding program, and Blocks per-workout done-tracking.
- **Diet plans.** ✅ Merged (`742fa97`, `claude/diets-menu-d7x2`). Goal-based Diet plans
  (`src/data/diets.ts`, `DietPlanDetail`) with an `activeDietId` persisted slice (store
  version 1→2, all 5 mirror places) and one-tap logging. Plus a workout previous-notes fix
  for repeated exercises.
- **Batch 4 — Calendar recurrence.** ⏳ Pending. The recurrence engine in
  `src/utils/calendar.ts` (exceptions, weekly `daysOfWeek`, monthly nth-weekday) is untouched;
  the week-view overflow fix above was UI, not the engine.
- **Batch 5 — Cloud Functions Siri TZ + recurrence expansion.** ⏳ Pending. `functions/` is
  untouched — the `todayDateString` UTC fallback and lack of server-side recurrence expansion
  both remain. See "Known risks".
- **Batch 6 — Polish.** Two side findings still open: `useStore.startWorkout` undefined
  `routineId`, and the `Settings.tsx` data-export filename banned date pattern. The bundle-size
  item is done (route code-splitting).

## Known risks

- **Cloud Functions Siri TZ fallback (active).** When the `?tz=` query param is missing or
  invalid, the function (`todayDateString` in `functions/src/index.ts`) falls back to UTC,
  which gives wrong "today" for non-UTC users. Batch 5 territory.
- **Cloud Functions don't expand recurrence (active).** Stored recurring events are read raw,
  not expanded. Siri speaks the original master event date instead of today's occurrence.
  Batch 5 territory.
- **`Settings.tsx` data-export filename uses the banned `toISOString().split('T')[0]`**
  (`src/pages/Settings.tsx:221`) — UTC-derived date in the export filename. Batch 6 side finding.
- **`useStore.startWorkout` leaves `currentSession.routineId = undefined`** when started
  without a routine. Same class as Batch 1; Batch 6 side finding.
- *(Resolved — no longer a risk)* The `useDietStore` banned-date-pattern in `updateStreaks` /
  `getWeeklyStats` was fixed in Batch 3 (`d960249`); only a cautionary comment remains.
- **Single-user product.** Test users live in the production Firebase project (no separate
  staging). The `e2e-test@thetemple.test` user was created against prod. Be aware when running
  destructive scripts.

## Where to start

Audit Batches 1–3, the AuthContext cloud-sync race, the integration & hardening batch, and the
Diet-plans feature are all landed; `main` is clean (all feature branches merged and pruned).
The remaining audit work is **Batch 4 — Calendar recurrence** (the recurrence engine in
`src/utils/calendar.ts` — exception handling, weekly `daysOfWeek`, monthly "nth weekday") and
**Batch 5 — Cloud Functions Siri TZ + server-side recurrence expansion** (`functions/` is
untouched). See `ROADMAP.md` for sequencing and `AUDIT_STATE.md` for scope.

## When to update this file

Update PROJECT_STATE.md when any of these change:
- Deploy targets, Firebase project, or hosting setup.
- A batch lands (move from "in flight" to "implemented") or a new batch is added.
- A known risk is resolved or a new one is introduced.
- The recommended-next-task pointer becomes stale.

Keep it short. If it's growing past ~150 lines, push detail into the topic-specific docs and
leave one-line pointers here.
