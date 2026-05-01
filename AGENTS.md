# AGENTS.md — Read this first

Token-efficient orientation for AI agents working on TheTemple. If you read only one file, read this one.
For deeper context: `docs/ARCHITECTURE.md` (data flow + sync), `docs/MODULES.md` (per-module map),
`SIRI_INTEGRATION.md` (user-facing Siri guide), `README.md` (user-facing).

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
| Auth + cloud sync wiring | `src/contexts/AuthContext.tsx` |
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

## Repo conventions

- Pages in `src/pages/`, reusable in `src/components/`, module-specific components in
  `src/components/{workout,calendar,blocks,onboarding,exercises,layout}/`.
- Default seed data in `src/data/` (exercises, foods, default routines, Jeff Nippard program).
- Tests are colocated `*.test.ts` next to the file they test (Vitest). Setup in `src/test/setup.ts`.
- Lint with `npm run lint`, build with `npm run build`, test with `npm test`. Run all three before
  finishing.
- Don't add `firebase-admin` to the frontend deps — was removed in commit `9df1176`. It's only for
  `functions/` and `scripts/`.

## Branch & PR convention

Feature branches are named `claude/<description>-<suffix>` and merged via PR to `main`. Past PRs are
all from such branches. Don't push directly to `main`. Don't create PRs unless the user asks.

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
