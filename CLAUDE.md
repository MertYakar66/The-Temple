# CLAUDE.md — TheTemple

Claude Code auto-loads this file every session. It is the **canonical agent
front door** — orientation, the hard invariants, conventions, and where to go
deeper. `AGENTS.md` is a thin pointer to this file. `.claude/commands/` holds
slash commands; `docs/` holds load-on-demand depth.

## What this is

TheTemple is a personal fitness/life PWA. Live at https://thetemple.web.app.
Mobile-first. Three product modules + one integration:

- **Workout** — sessions, sets/reps/weight, routines, PRs, weight history,
  exercise goals, the Jeff Nippard "Min Max" Block program (12-week, customizable).
- **Diet** — foods, recipes, saved meals, daily food log, macro goals, streaks,
  TDEE calculator.
- **Calendar** — events, multiple calendars, day/week/month/upcoming views,
  recurrence, invitations, Google Places autocomplete.
- **Siri** — Apple Shortcuts hit Firebase Cloud Functions that read the user's
  Firestore data and return text for Siri to speak. Token-based auth.

## Stack

React 19 + TypeScript + Vite. Zustand (with `persist` middleware) for state.
Firebase Auth + Firestore for cloud. Tailwind for styling. Recharts for charts.
`react-router-dom` v7. `date-fns` for dates. Cloud Functions in `functions/`
(Node 20, `firebase-admin`). No backend server — client + serverless only.

## Pre-finish gates

Before declaring any task done:

- `npm run lint`
- `npm run build`
- `npm test` — if logic changed.
- If `functions/` changed: `cd functions && npm run build && npm test`.

`npm run test:e2e` is currently `test.fixme()`'d and is **not** a gate. Quick
gate: the `/preflight` slash command. GitHub Actions
(`.github/workflows/ci.yml`) runs this same lint/build/test gate on every
pull request — but run it locally first; don't lean on CI to catch it.

## Branch & PR rules

- Develop on a feature branch named `claude/<topic>-<suffix>`. **Never push
  directly to `main`.**
- **Don't open PRs unless the user asks.**
- Feature branches merge to `main` via PR (or `git merge --no-ff` for grouped
  audit batches). Commit/PR body shape: `docs/COMMIT_STYLE.md` — the
  audit-batch commits in `git log` are the reference style.

## Architecture map

One line per load-bearing module:

- **`src/store/useStore.ts`** (~950 lines) — Workout state: sessions, sets/reps,
  routines, PRs, weight history, the Min Max Block program.
- **`src/store/useDietStore.ts`** — Diet: foods, recipes, meals, food log, macro
  goals, streaks, TDEE.
- **`src/store/useCalendarStore.ts`** — Calendar: events, multi-calendar,
  recurrence, invitations. Soft-delete via `isDeleted`.
- **`src/contexts/AuthContext.tsx`** — Auth + cloud-sync wiring.
  `onAuthStateChanged` → `resetStore` → `Promise.all` cloud loads →
  `loadFromCloud` → `startSync(uid)`. ⚠️ has a known cancellation-unsafe race.
- **`src/lib/firestoreSync.ts`** — reads/writes `users/{uid}/data/*`, debounced
  2 s (`SYNC_DEBOUNCE_MS`).
- **`functions/src/index.ts`** — Siri endpoints (Apple Shortcuts → Cloud
  Functions, token auth via top-level `siriTokens/{token}`, Admin SDK bypasses
  rules).

Full data flow: `docs/ARCHITECTURE.md`. Sync internals: `docs/sync-model.md`.
Per-module map + gotchas: `docs/MODULES.md`.

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

## How the app boots

1. `main.tsx` mounts `<App />`.
2. `<App>` wraps `<AppRoutes>` in `<AuthProvider>` (in `AuthContext.tsx`).
3. `AuthProvider` runs `onAuthStateChanged`. On user present:
   - `resetStore()` on all three Zustand stores (clears prior user's data).
   - `Promise.all([loadWorkoutData, loadDietData, loadCalendarData])` from
     Firestore.
   - `loadFromCloud(...)` on each store.
   - `startSync(uid)` — subscribes to each store, filters out ephemeral
     changes, writes debounced.
4. `<AppRoutes>` decides: not logged in → `/login`; logged in but no
   `user.onboardingCompleted` → `/onboarding`; otherwise the main app routes.

## The two 5-place invariants

These are the project's MIRROR contracts — a partial update silently breaks
something. Step-by-step runbooks live in `docs/runbooks/`.

**Adding a persisted store slice → update all 5 places** (`/add-slice`):
the type definition · `resetStore()` · `getCloudSyncData()` · `loadFromCloud()`
· the reference-equality check in `AuthContext.startSync`. Bump the store
`version` and add a `migrate()` if the persisted shape changed. Miss one →
silent data loss or a Firestore write storm.

**Changing a Firestore path → update all 5 places** (`/touch-firestore-path`):
`src/lib/firestoreSync.ts` · `firestore.rules` · `functions/src/index.ts` ·
`scripts/backup.cjs` · `scripts/restore.cjs`. Miss one → broken reads,
security, Siri, or backups.

## Domain conventions

- **`Routine.dayOfWeek`: `0=Sun .. 6=Sat`** (matches `Date.getDay()`). The Siri
  Cloud Functions rely on this.
- **Date stamps are `YYYY-MM-DD` strings**, via `getDateStamp()` /
  `parseDateStamp()` in `src/utils/date.ts`.
- **Ephemeral UI state is not synced** — see hard invariant #5 below.
- **Min Max Block program** — the Jeff Nippard 12-week customizable program,
  seeded in `src/data/minMaxProgram.ts`.

## Hard invariants — the 10 gotchas

Break these and things break **silently**.

1. **Firestore rejects `undefined`.** Never write `{ field: undefined }` —
   omit the key or use `null`. See `useStore.addWeightEntry` for the pattern
   (only attach `notes` if truthy).
2. **Date stamps are `YYYY-MM-DD` strings.** Use `getDateStamp()` /
   `parseDateStamp()` from `src/utils/date.ts`. Never
   `new Date().toISOString().split('T')[0]` — that uses UTC and breaks for
   non-UTC users.
3. **`Routine.dayOfWeek`: 0=Sun..6=Sat** (matches `Date.getDay()`). The Siri
   function relies on this.
4. **`getCloudSyncData()` ships a lean projection.**
   `useStore.getCloudSyncData()` strips the static `exercises` array down to
   `{id, name}` because cloud only needs that and the full payload is huge.
   Don't reintroduce the full list to the cloud doc.
5. **Ephemeral state is not synced.** `currentView`, `selectedDate`, `newPRs`,
   `currentSession` in some contexts — sync subscribers in
   `AuthContext.startSync` filter slices by reference equality. If you add a
   new persisted slice, add it to that equality check or it won't sync. If you
   add ephemeral state, leave it out of the equality check (otherwise you
   cause Firestore write storms).
6. **Sync is debounced 2s.** `firestoreSync.ts` sets
   `SYNC_DEBOUNCE_MS = 2000`. On logout, `AuthContext` flushes immediately via
   `saveWorkoutData` / `saveDietData` / `saveCalendarData` (non-debounced).
   Don't skip the flush — users lose data if you do.
7. **Soft-delete for calendar events.** `CalendarEvent.isDeleted` flag, never
   hard-delete. Filter on read.
8. **One Firestore doc per module per user.** Paths:
   `users/{uid}/data/workout`, `.../diet`, `.../calendar`, `.../siriConfig`.
   Top-level `siriTokens/{token}` is the lookup index for Cloud Functions. The
   security rules in `firestore.rules` only let users read/write their own
   subtree — the Siri Cloud Functions bypass rules via the Admin SDK.
9. **Persisted store version migrations live in the store options.** See
   `useStore` `version: 2` and `migrate()`. If you change persisted shape,
   bump the version and write a migration.
10. **Null-emit on clear, not undefined.** When the user empties an editor
    field that's optional, write `null`, not `undefined`. `setDoc({merge:true})`
    preserves keys whose value is `undefined`, so an undefined-on-clear
    silently keeps the prior value in the cloud doc. See Batch 1 commits
    (e.g. `b484873`) and `docs/DATA_POLICY.md`. Editor-controlled fields use
    null; non-editor pass-through fields (e.g. `organizer` in the event
    editor) use omit-the-key.

## Never do

A quick-scan restatement of the prohibitions above:

- Write `{ field: undefined }` into a synced object (#1, #10).
- Use `new Date().toISOString().split('T')[0]` for a date stamp (#2).
- Hard-delete a calendar event (#7).
- Skip the logout flush (#6).
- Change a persisted store shape without a `version` bump + `migrate()` (#9).
- Reintroduce the full `exercises` list into the cloud projection (#4).
- Call `signIn` / `signOut` / `onAuthStateChanged` outside `AuthContext.tsx`.
- Add `firebase-admin` to the root `package.json` — it belongs only to
  `functions/` and `scripts/` (removed from frontend deps in commit `9df1176`).
- Push directly to `main`, or open a PR unless the user asks.

## Known issues (active blockers)

- **AuthContext race — cancellation-unsafe `onAuthStateChanged`.** The callback
  in `AuthContext.tsx` (the `onAuthStateChanged` handler inside `AuthProvider`'s
  `useEffect`) calls `resetStore()` on all three Zustand stores before awaiting
  `Promise.all` of the cloud loads. Firebase emits the listener more than once
  on cold load (cached-user fire, then a verified fire). If a chain whose
  `resetStore` lands AFTER user interaction wins the race, it wipes local
  writes — and the wipe propagates to cloud on the next debounced sync. It also
  leaks Zustand subscribers. Reproducible at ~300 ms post-click under bot-style
  fast interaction. Blocks the e2e harness
  (`tests/e2e/calendar-location-roundtrip.spec.ts` — currently `test.fixme()`'d).
  Detail and fix shape: `docs/sync-model.md`, `docs/AUDIT_STATE.md`
  ("Cross-cutting blocker"), `docs/audits/2026-05-08-cross-module-audit.md` (C-1).

## Repo conventions

- Pages in `src/pages/`, reusable components in `src/components/`,
  module-specific components in
  `src/components/{workout,calendar,blocks,onboarding,exercises,layout}/`.
- Default seed data in `src/data/` (exercises, foods, default routines, the
  Min Max program).
- Unit tests are colocated `*.test.ts` next to the file they test (Vitest);
  setup in `src/test/setup.ts`. End-to-end tests live under `tests/e2e/`
  (Playwright); the single e2e spec is currently `test.fixme()`'d — see
  `docs/TESTING.md` for the verification discipline.
- Don't add `firebase-admin` to the frontend deps — it's only for `functions/`
  and `scripts/`.
- Mobile is the primary form factor. Bottom nav is
  `components/layout/BottomNav.tsx`; some routes deliberately have no bottom
  nav (settings, editors) — see `App.tsx` route grouping.

## When making changes

- **Touching state shape?** → the persisted-slice 5-place rule above
  (types, `loadFromCloud`, `getCloudSyncData`, `resetStore`, the `startSync`
  equality check). Missing any causes data loss or write storms.
- **Touching Firestore paths?** → the Firestore-path 5-place rule above
  (`firestoreSync.ts`, `firestore.rules`, `functions/src/index.ts`,
  `scripts/backup.cjs`, `scripts/restore.cjs`).
- **Touching auth flow?** `AuthContext.tsx` is the only place — never call
  `signOut`/`signIn` directly from pages, go through the context.
- Decision-layer files (`AuthContext.tsx`, `firestoreSync.ts`, the three
  stores, `functions/src/index.ts`) warrant the full `lint`+`build`+`test`
  gate, not a targeted check.

## Deeper reading (`docs/`)

Load on demand:

- **Start here** — `docs/PROJECT_STATE.md` (current state, what's deployed),
  `docs/AUDIT_STATE.md` (per-batch audit progress + blockers),
  `docs/ROADMAP.md` (what's next, in what order).
- **Architecture** — `docs/ARCHITECTURE.md` (data flow, Firestore layout,
  sync lifecycle, Cloud Functions), `docs/sync-model.md` (auth-sync deep-dive),
  `docs/MODULES.md` (per-module file map and gotchas).
- **Rules** — `docs/DATA_POLICY.md` (hard invariants expanded with rationale),
  `docs/DECISIONS.md` (architectural decisions and why),
  `docs/COMMIT_STYLE.md` (commit/PR shape), `docs/TESTING.md` (Vitest +
  Playwright + the blocked-test discipline).
- **Runbooks** — `docs/runbooks/` (add-persisted-slice, touch-firestore-path,
  release, rotate-siri-token).
- **Reference** — `docs/siri-integration.md` (user-facing Siri setup guide),
  `docs/adr/` (decision-record convention), `docs/audits/` (dated audit
  reports), `CHANGELOG.md` (recent landings), `docs/CLAUDE_CODE_WEB.md`
  (Claude Code cloud-session reference).
