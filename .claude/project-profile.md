# TheTemple — Project Profile

Personal fitness/life PWA. Live at https://thetemple.web.app. Mobile-first.

## Stack

- React 19 + TypeScript + Vite
- Zustand with `persist` middleware (3 stores)
- Firebase Auth + Firestore (client SDK); Cloud Functions (Node 20, firebase-admin) in `functions/`
- Tailwind, Recharts, `react-router-dom` v7, `date-fns`
- Vitest (unit, colocated `*.test.ts`), Playwright (e2e, currently `test.fixme`'d)
- No backend server. Client + serverless only.

## Architecture (top modules)

- **`src/store/useStore.ts`** (~950 lines) — Workout state: sessions, sets/reps, routines, PRs, weight history, Jeff Nippard "Min Max" Block program.
- **`src/store/useDietStore.ts`** — Diet: foods, recipes, saved meals, daily food log, macro goals, streaks, TDEE.
- **`src/store/useCalendarStore.ts`** — Calendar: events, multi-calendar, recurrence, invitations, Google Places autocomplete. Soft-delete via `isDeleted`.
- **`src/contexts/AuthContext.tsx`** — Auth + cloud sync wiring. `onAuthStateChanged` → `resetStore` → `Promise.all` cloud loads → `loadFromCloud` → `startSync(uid)`. ⚠️ has a known cancellation-unsafe race (multiple Firebase emits can wipe local writes).
- **`src/lib/firestoreSync.ts`** — Read/write to `users/{uid}/data/{workout|diet|calendar|siriConfig}`. Debounced 2s (`SYNC_DEBOUNCE_MS`).
- **`functions/src/index.ts`** — Siri endpoints (Apple Shortcuts → Cloud Functions, token-auth via top-level `siriTokens/{token}`, Admin SDK bypasses rules).

## Conventions

- Branch: `claude/<topic>-<suffix>`. Never push directly to `main`. No PRs unless asked.
- Pre-finish: `npm run lint` + `npm run build`; `npm test` if logic changed. `test:e2e` not a gate.
- Pages in `src/pages/`; module components in `src/components/{workout,calendar,blocks,onboarding,exercises,layout}/`; seed data in `src/data/`.
- Adding a persisted slice: update **5 places** — types, `loadFromCloud`, `getCloudSyncData`, `resetStore`, and the reference-equality check in `AuthContext.startSync`. Missing any → data loss or write storms.
- Touching Firestore paths: update `firestoreSync.ts`, `firestore.rules`, `functions/src/index.ts`, `scripts/backup.cjs`, `scripts/restore.cjs`.
- Auth flow goes through `AuthContext` only — no `signIn`/`signOut` from pages.
- No `firebase-admin` in frontend deps (removed in `9df1176`); only in `functions/` and `scripts/`.
- Persisted store version migrations live in store options (`version`, `migrate()`); bump on shape change.

## Domain

- **Modules**: Workout, Diet, Calendar, Siri (Shortcuts integration).
- **Routine.dayOfWeek**: 0=Sun..6=Sat (matches `Date.getDay()`); Siri depends on this.
- **Date stamps**: `YYYY-MM-DD` strings via `getDateStamp()`/`parseDateStamp()` from `src/utils/date.ts`.
- **Min Max Block program**: Jeff Nippard 12-week customizable workout program.
- **Ephemeral state**: `currentView`, `selectedDate`, `newPRs`, `currentSession` — not synced.

## Gotchas

1. **Firestore rejects `undefined`.** Omit the key or use `null`. `setDoc({merge:true})` preserves prior value when field is `undefined`, so undefined-on-clear silently keeps stale cloud value. **Editor-controlled fields → `null` on clear; pass-through fields → omit the key.** Pattern: see `useStore.addWeightEntry`.
2. **Never use `new Date().toISOString().split('T')[0]`** for date stamps — UTC, breaks for non-UTC users. Use the date utils.
3. **`getCloudSyncData()` ships a lean projection** — strips static `exercises` to `{id, name}`. Don't reintroduce the full list to the cloud doc.
4. **Logout must flush sync immediately** via `saveWorkoutData`/`saveDietData`/`saveCalendarData` (non-debounced). Skipping → users lose unsynced data.
5. **AuthContext race**: `onAuthStateChanged` fires more than once on load (cached then verified). A late-landing `resetStore` after user interaction wipes local writes; reproducible at ~300ms post-click. Blocks e2e harness.
