# Architecture

Data flow, sync model, and invariants. Companion to root `AGENTS.md`. For invariant rationale
and data-policy detail see `DATA_POLICY.md`. For per-batch audit progress see `AUDIT_STATE.md`.

## High-level

```
Browser (PWA)                              Firebase
─────────────                              ────────
React + Zustand stores      ── auth ──▶    Firebase Auth
  │                                         │
  ├─ persist → localStorage                 │ uid
  │                                         ▼
  └─ subscribe → debounced(2s) ─writes──▶  Firestore
                                            users/{uid}/data/{workout,diet,calendar,siriConfig}
                                            siriTokens/{token}                 (top-level index)

iPhone Shortcut ──HTTPS+token──▶  Cloud Functions (us-central1)
                                    siriTokens/{token} → uid
                                    read users/{uid}/data/*
                                    return { text }
```

## State management

Three Zustand stores, all wrapped in `persist` (localStorage):

| Store | File | Persist key | Module |
|---|---|---|---|
| `useStore` | `src/store/useStore.ts` | `workout-tracker-storage` (v2) | Workout, weight, PRs, blocks |
| `useDietStore` | `src/store/useDietStore.ts` | `diet-tracker-storage` | Diet, foods, recipes, log |
| `useCalendarStore` | `src/store/useCalendarStore.ts` | `calendar-storage` (v1) | Calendar |

Each store implements three sync methods:

- `loadFromCloud(data)` — replace persisted slices from Firestore doc. Defensive: each slice
  uses `?? get().<slice>` to fall back to local if cloud is missing the field.
- `getCloudSyncData()` — return the slice subset to ship to Firestore. Lean — `useStore` strips
  `exercises` to `{id, name}` only.
- `resetStore()` — wipe to defaults on logout / user switch.

## Firestore layout

```
users/{uid}/
  data/
    workout      ← useStore.getCloudSyncData()
    diet         ← useDietStore.getCloudSyncData()
    calendar     ← useCalendarStore.getCloudSyncData()
    siriConfig   ← { token, createdAt, timezone }

siriTokens/{token}  ← { userId, createdAt }   (top-level lookup index)
```

Rules (`firestore.rules`):
- `users/{uid}/**` — owner-only read/write.
- `siriTokens/{token}` — owner can create/read/delete; field validation on create
  (`hasOnly(['userId','createdAt'])`).
- Cloud Functions use Admin SDK and bypass rules.
- Default-deny everywhere else.

## Sync lifecycle

`AuthContext.tsx` is the controller. **Note**: the controller has a known cancellation-unsafe
race (see "Known issues" below). The lifecycle described here is the intended behavior; in
practice the listener can fire more than once on cold load and step on its own state.

1. **Login** — `onAuthStateChanged` fires with user.
   - Reset all three stores.
   - `Promise.all` load all three Firestore docs.
   - `loadFromCloud` on each store.
   - `startSync(uid)` — installs three Zustand subscriptions.

2. **Subscriptions** — each subscription receives `(state, prevState)`. Compares only the slices
   that should sync by reference equality. If all relevant slices unchanged, returns. Otherwise
   `debouncedSave*Data(uid, state.getCloudSyncData())`.

   This shape matters: Zustand calls subscribers on **every** state change including ephemeral UI
   state. Without the equality check, paging through the calendar caused a Firestore write per
   click. See commit `a0b971d` ("Efficiency pass").

3. **Debounce** — 2s timer in `firestoreSync.ts`. New writes reset the timer. Multiple stores have
   independent timers (`workoutSyncTimer`, `dietSyncTimer`, `calendarSyncTimer`).

4. **Logout** — `stopSync()` first, then `Promise.all` of non-debounced flush writes, then
   `signOut`, then clear localStorage. **Order matters** — flushing after `signOut` would fail
   because rules require auth.

5. **Account deletion** — re-auth, revoke Siri token, `deleteUserCloudData`, `deleteUser`,
   clear localStorage.

## Cloud Functions (Siri)

`functions/src/index.ts`. Four endpoints, all under `onRequest({cors: true})`:

| Endpoint | Returns |
|---|---|
| `siriDailyBriefing` | Schedule + workout + nutrition combined |
| `siriSchedule` | Today's calendar events |
| `siriWorkout` | Today's routines (filtered by `dayOfWeek`) |
| `siriNutrition` | Today's totals vs goals + per-meal breakdown |

Auth via `authenticateToken(req)`:
- Pulls token from `x-siri-token` header or `?token=` query.
- Validates against regex `^[A-Za-z0-9]{8}-...{4 segments}$`.
- In-process LRU cache, 60s TTL, max 128 entries — function instances stay warm and reuse it.
- Cache miss → read `siriTokens/{token}` → cache → return `userId`.

All endpoints take optional `?tz=` query param. Commit `2a98403` added the parameter and the
`Intl.DateTimeFormat` happy path; the missing/invalid-tz fallback at `functions/src/index.ts:99`
still uses `new Date().toISOString().split("T")[0]` which is UTC. **Batch 5** in
`AUDIT_STATE.md` covers replacing the fallback and adding server-side recurrence expansion (the
function currently reads stored events directly without expanding `recurrenceRule`, so weekly
repeating events are spoken on the wrong days).

Helper `buildExerciseNameMap(exercises)` builds `Map<id, name>` for O(1) lookups instead of
linear scans per routine exercise.

## Persistence + migrations

Each store sets `persist({ name, version, migrate, merge })`:

- `version`: bump when persisted shape changes incompatibly.
- `migrate(persistedState, version)`: transform old shapes forward. Example in `useStore`:
  v2 forces `routines` back to `defaultRoutines` (old Turkish/legacy data was bad).
- `merge(persistedState, currentState)`: optional. `useStore` overrides `exercises` with the
  in-code defaults so updates to the seed list reach existing users.

## Dates and times

- `getDateStamp(d)` → `'YYYY-MM-DD'` via `date-fns format`. Use this for any "what day is it"
  string in storage.
- `parseDateStamp(s)` → `Date` via `parseISO`.
- `isDateStampInRange(stamp, start, end)` — range filter using `startOfDay`/`endOfDay`.
- Calendar events store full ISO datetimes (`startDate`, `endDate`).
- Cloud Functions use `Intl.DateTimeFormat` with the `tz` query param to get the user's local
  "today" string (`en-CA` locale yields `YYYY-MM-DD`).

## Routing

- Bottom-nav routes wrapped in `<Layout>` (Dashboard, Workout, Diet, Calendar, Exercises,
  Progress, History, Blocks).
- Settings/editors/detail routes are siblings (no bottom nav).
- Auth-gated: not logged in → `/login`; not onboarded → `/onboarding`; else app.
- Catch-all `<Navigate to="/" replace />`.

## Build / deploy

- `npm run build` → Vite static bundle to `dist/`.
- `firebase deploy --only hosting:myapp` → deploys to `thetemple.web.app` (target `myapp` in
  `.firebaserc` + `firebase.json`).
- `cd functions && npm run deploy` → deploys Cloud Functions.
- Hosting headers (`firebase.json`): HSTS, CSP-ish (X-Frame-Options DENY, etc.), 1-year immutable
  cache for hashed JS/CSS.

## Data backup

- `npm run backup` (`scripts/backup.cjs`) — dumps all top-level collections + `users/*/data/*`
  subcollection to `backups/YYYYMMDD_HHmmss_backup.json`. Requires `serviceAccountKey.json`
  at repo root (gitignored).
- `npm run restore` — companion script.

## Known issues

These are documented in `AUDIT_STATE.md` and have audit batches scheduled. Listed here for
agents reading architecture docs.

### AuthContext race (cancellation-unsafe `onAuthStateChanged`)

`AuthContext.tsx:135` runs `resetStore()` on all three Zustand stores before awaiting
`Promise.all` of the cloud loads. Firebase emits the listener more than once on initial page
load — typically a cached-user fire followed by a verified-user fire. Each chain runs the same
sequence (reset → load → start sync). If a chain whose `resetStore` lands AFTER the user
interacts with the app wins the race, it wipes the local write the user just made. The wipe
then propagates to cloud on the next debounced sync.

Reproduction (Playwright, prod build, Chromium):
- click Add at t=0 → `addEvent` succeeds, localStorage `events.length === 1`.
- t = 150 ms: still 1.
- t = 300 ms: `events.length === 0`. Stack: `AuthContext.resetStore` from the second listener
  callback.

Fix shape (Batch — sequencing TBD):
- Track an in-flight token / `AbortController` across callback runs.
- Verify `auth.currentUser?.uid === user.uid` before resetting / loading / starting sync; bail
  if a newer chain is already in flight.
- Unsubscribe the prior `unsubXxxRef` before overwriting (currently leaks).

This blocks the e2e harness — `tests/e2e/calendar-location-roundtrip.spec.ts` is `test.fixme()`'d
with the full diagnostic timeline in its top-of-file comment block.

### Cloud Functions Siri TZ fallback + recurrence expansion (Batch 5)

`functions/src/index.ts:99` — `todayDateString(tz)` falls back to UTC when `tz` is missing or
invalid. The right behavior is to require `tz` (return 400) or fall back to a configured default,
not silently UTC. Batch 5 will fix this alongside server-side recurrence expansion.
