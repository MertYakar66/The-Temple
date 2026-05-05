# AGENTS.md — Read this first

Token-efficient orientation for AI agents working on TheTemple. If you read only one file, read this one.
For deeper context, in roughly the order a new agent should consume them:

- `docs/PROJECT_STATE.md` — what the project is right now, what's deployed, what's in-flight.
- `docs/AUDIT_STATE.md` — per-batch audit progress (Batches 1–6) and current blockers.
- `docs/ROADMAP.md` — what comes next and in what order.
- `docs/ARCHITECTURE.md` — data flow + sync model + Cloud Functions.
- `docs/MODULES.md` — per-module file map and gotchas.
- `docs/DATA_POLICY.md` — hard invariants expanded with rationale.
- `docs/DECISIONS.md` — architectural decisions and why.
- `docs/TESTING.md` — Vitest + Playwright + the blocked-test discipline.
- `docs/COMMIT_STYLE.md` — commit/PR shape used in this repo.
- `CHANGELOG.md` — human-readable summary of recent landings.
- `SIRI_INTEGRATION.md` — user-facing Siri setup guide.
- `README.md` — user-facing project description.

## What this is

TheTemple is a personal fitness/life PWA. Live at https://thetemple.web.app. Three product modules + one
integration:

- **Workout** — sessions, sets/reps/weight, routines, PRs, weight history, exercise goals, Jeff Nippard
  "Min Max" Block program (12-week customizable).
- **Diet** — foods, recipes, saved meals, daily food log, macro goals, streaks, TDEE calculator.
- **Calendar** — events, multiple calendars, day/week/month/upcoming views, recurrence, invitations,
  Google Places autocomplete.
- **Siri** — Apple Shortcuts hit Firebase Cloud Functions that read the user's Firestore data and return
  text for Siri to speak. Token-based auth.

## Stack

React 19 + TypeScript + Vite. Zustand (with `persist` middleware) for state. Firebase Auth + Firestore
for cloud. Tailwind for styling. Recharts for charts. `react-router-dom` v7. `date-fns` for dates.
Cloud Functions in `functions/` (Node 20, firebase-admin). No backend server — everything is
client + serverless.

## Critical files

| Concern | File |
|---|---|
| Routes / app shell | `src/App.tsx` |
| Auth + cloud sync wiring | `src/contexts/AuthContext.tsx` (⚠️ known race — see below) |
| Workout state | `src/store/useStore.ts` (~950 lines, the big one) |
| Diet state | `src/store/useDietStore.ts` |
| Calendar state | `src/store/useCalendarStore.ts` |
| Firestore read/write | `src/lib/firestoreSync.ts` |
| Firebase init | `src/lib/firebase.ts` |
| Siri token mgmt (client) | `src/lib/siriToken.ts` |
| Siri endpoints (server) | `functions/src/index.ts` |
| Type definitions | `src/types/index.ts`, `src/types/calendar.ts` |
| Firestore security rules | `firestore.rules` |
| Backup/restore | `scripts/backup.cjs`, `scripts/restore.cjs` |
| E2E harness | `tests/e2e/`, `playwright.config.ts` (⚠️ blocked — see below) |

## Hard invariants — break these and things break silently

1. **Firestore rejects `undefined`.** Never write `{ field: undefined }`. Either omit the key or use
   `null`. See `useStore.addWeightEntry` for the pattern (only attach `notes` if truthy).
2. **Date stamps are `YYYY-MM-DD` strings.** Use `getDateStamp()` / `parseDateStamp()` from
   `src/utils/date.ts`. Never `new Date().toISOString().split('T')[0]` — that uses UTC and breaks for
   non-UTC users.
3. **`Routine.dayOfWeek`: 0=Sun..6=Sat** (matches `Date.getDay()`). The Siri function relies on this.
4. **`getCloudSyncData()` ships a lean projection.** `useStore.getCloudSyncData()` strips the static
   `exercises` array down to `{id, name}` because cloud only needs that and the full payload is huge.
   Don't reintroduce the full list to the cloud doc.
5. **Ephemeral state is not synced.** `currentView`, `selectedDate`, `newPRs`, `currentSession` in some
   contexts — sync subscribers in `AuthContext.startSync` filter slices by reference equality. If you
   add a new persisted slice, add it to that equality check or it won't sync. If you add ephemeral
   state, leave it out of the equality check (otherwise you cause Firestore write storms).
6. **Sync is debounced 2s.** `firestoreSync.ts` sets `SYNC_DEBOUNCE_MS = 2000`. On logout, `AuthContext`
   flushes immediately via `saveWorkoutData`/`saveDietData`/`saveCalendarData` (non-debounced). Don't
   skip the flush — users lose data if you do.
7. **Soft-delete for calendar events.** `CalendarEvent.isDeleted` flag, never hard-delete. Filter on
   read.
8. **One Firestore doc per module per user.** Paths: `users/{uid}/data/workout`, `.../diet`,
   `.../calendar`, `.../siriConfig`. Top-level `siriTokens/{token}` is the lookup index for Cloud
   Functions. The security rules in `firestore.rules` only let users read/write their own subtree —
   the Siri Cloud Functions bypass rules via Admin SDK.
9. **Persisted store version migrations live in the store options.** See `useStore` `version: 2` and
   `migrate()`. If you change persisted shape, bump the version and write a migration.
10. **Null-emit on clear, not undefined.** When the user empties an editor field that's optional,
    write `null`, not `undefined`. `setDoc({merge:true})` preserves keys whose value is `undefined`,
    so an undefined-on-clear silently keeps the prior value in the cloud doc. See Batch 1 commits
    (e.g. `b484873`) and `docs/DATA_POLICY.md`. Editor-controlled fields use null; non-editor
    pass-through fields (e.g. `organizer` in the event editor) use omit-the-key.

## Known issues (active blockers)

- **AuthContext race — cancellation-unsafe `onAuthStateChanged`.** The callback in
  `AuthContext.tsx:135` calls `resetStore()` on all three Zustand stores before awaiting
  `Promise.all` of the cloud loads. Firebase emits the listener more than once on initial page
  load (cached-user fire, then a verified fire). If a chain whose `resetStore` lands AFTER user
  interaction wins the race, it wipes local writes — and the wipe propagates to cloud on the
  next debounced sync. Reproducible at ~300 ms post-click under bot-style fast interaction.
  Blocks the e2e harness (see `tests/e2e/calendar-location-roundtrip.spec.ts` — currently
  `test.fixme()`'d). Fix shape and audit-batch sequencing in `docs/AUDIT_STATE.md`.

## Repo conventions

- Pages in `src/pages/`, reusable in `src/components/`, module-specific components in
  `src/components/{workout,calendar,blocks,onboarding,exercises,layout}/`.
- Default seed data in `src/data/` (exercises, foods, default routines, Jeff Nippard program).
- Unit tests are colocated `*.test.ts` next to the file they test (Vitest). Setup in
  `src/test/setup.ts`. End-to-end tests live under `tests/e2e/` (Playwright). The single e2e spec
  is currently `test.fixme()`'d — see `docs/TESTING.md` for the verification discipline.
- Lint with `npm run lint`, build with `npm run build`, test with `npm test`. Run all three before
  finishing. `npm run test:e2e` is currently fixme'd; not a verification gate.
- Don't add `firebase-admin` to the frontend deps — was removed in commit `9df1176`. It's only for
  `functions/` and `scripts/`.

## Branch & PR convention

Feature branches are named `claude/<description>-<suffix>` and merged via PR (or `git merge --no-ff`
for grouped audit batches) to `main`. Past PRs are all from such branches. Don't push directly to
`main`. Don't create PRs unless the user asks. Commit body shape is in `docs/COMMIT_STYLE.md` —
the audit-batch commits in `git log` are the reference style.

## How the app boots

1. `main.tsx` mounts `<App />`.
2. `<App>` wraps `<AppRoutes>` in `<AuthProvider>` (in `AuthContext.tsx`).
3. `AuthProvider` runs `onAuthStateChanged`. On user present:
   - `resetStore()` on all three Zustand stores (clears prior user's data).
   - `Promise.all([loadWorkoutData, loadDietData, loadCalendarData])` from Firestore.
   - `loadFromCloud(...)` on each store.
   - `startSync(uid)` — subscribes to each store, filters out ephemeral changes, writes debounced.
4. `<AppRoutes>` decides: not logged in → `/login`; logged in but no `user.onboardingCompleted` →
   `/onboarding`; otherwise main app routes.

## When making changes

- Touching state shape? Add to types, add to `loadFromCloud`, add to `getCloudSyncData`, add to
  `resetStore`, and add to the `startSync` reference-equality check. Missing any of these causes
  data loss or write storms.
- Touching Firestore paths? Update `firestoreSync.ts`, `firestore.rules`, `functions/src/index.ts`,
  and `scripts/backup.cjs` / `scripts/restore.cjs`.
- Touching auth flow? `AuthContext.tsx` is the only place; do not call `signOut`/`signIn` directly
  from pages, go through the context.
- Mobile is the primary form factor. Bottom nav lives in `components/layout/BottomNav.tsx`. Some
  routes deliberately have no bottom nav (settings, editors) — see `App.tsx` route grouping.
