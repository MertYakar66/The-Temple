# End-to-end tests

Playwright-driven browser tests that verify TheTemple's behavior end-to-end
through the real Firebase backend (auth + Firestore). Each spec mirrors a
verification step from one of the audit batches that's already shipped on
`main` — so re-running these is how we confirm the fix didn't regress.

| Spec | Batch | Invariant covered | Status |
|---|---|---|---|
| `calendar-location-roundtrip.spec.ts` | Batch 1 | Clearing an event's location field actually clears it under `setDoc({merge:true})` — the null-emit pattern from `b484873` | **active** |

Future batches add a new `*.spec.ts` here per logical invariant.

## Test status

All specs here are active. `calendar-location-roundtrip` was `test.fixme()`'d
while the cancellation-unsafe `onAuthStateChanged` race (audit C-1) wiped local
writes within ~300 ms of any click — every run failed for a reason unrelated to
the invariant under test. That race is fixed
(`docs/plans/fix-authcontext-race.md`), so the spec runs again.

Batch 1's null-emit invariant is also covered at the store layer in
`src/store/useCalendarStore.test.ts` / `src/store/useStore.test.ts` — the
fastest first stop; the e2e spec is the end-to-end confirmation.

## Prerequisites

A dedicated Firebase Auth user is required:

- Email: `e2e-test@thetemple.test`
- UID: `J3iKzKy129UicL4VrYFrQ3xUwFb2`
- Firestore profile pre-populated (so `onboardingCompleted: true` and the
  app skips the onboarding flow on first sign-in).

`.env.test` at repo root provides credentials and Firebase web config.
Both `.env` and `.env.test` are gitignored. Required keys:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_API_KEY=     # optional; empty disables location autocomplete
TEST_USER_EMAIL=
TEST_USER_PASSWORD=
```

## Run

```sh
npm run test:e2e
```

Playwright auto-starts the Vite **dev** server on `http://localhost:5173`
and reuses it if already running locally (`reuseExistingServer:
!process.env.CI`).

`npm run test:e2e` runs the spec against the dev server and real Firebase
(the `e2e-test@thetemple.test` user); it needs both `.env` and `.env.test`
present.

## Dev server, not production build

The harness runs against the Vite **dev** server. It previously ran against
the production build because React StrictMode's dev double-invoke amplified
the cancellation-unsafe `onAuthStateChanged` race — every spec failed for a
reason unrelated to the invariant under test. That race is fixed (the callback
is StrictMode-safe), so dev-build testing is correct again and skips the
~3-5 s build step. See `docs/DECISIONS.md` D-12 (supersedes D-8).

## Debug

```sh
npm run test:e2e:headed   # browser visible, normal speed
npm run test:e2e:ui       # Playwright UI mode — best for picking selectors
npm run test:e2e:debug    # step through with the inspector
```

Failures generate an HTML report (`playwright-report/`) and traces
(`test-results/`). Both are gitignored. Open the report with:

```sh
npx playwright show-report
```

## Cleanup pattern

Each spec uses a unique-per-run identifier (e.g.
`E2E location test ${Date.now()}`) for any data it creates, and `afterEach`
deletes that data via the in-app delete UI — soft-delete in the case of
calendar events (`isDeleted: true`).

If a test crashes mid-run before cleanup completes, an orphan event with that
unique title remains in the test user's Firestore data. The unique title means
this never collides with a future test run, but it also means orphans
accumulate over time. To clear them:

1. Sign in to the app at `https://thetemple.web.app` (or localhost) as
   `e2e-test@thetemple.test`.
2. Use the calendar UI to delete leftover events whose titles start with
   `E2E `.

Or, more aggressively: Settings → Clear All Data on that account. This wipes
all of the test user's data (including the pre-populated profile that skips
onboarding) — so you'd need to recreate the profile via Cloud Shell again
before the next test run. Avoid unless cleanup is genuinely needed.

## Adding a new batch verification

1. Pick the smallest, highest-signal invariant the batch introduced.
2. Create `tests/e2e/<topic>-<thing>.spec.ts`.
3. Use `signIn`/`signOut` from `helpers/auth.ts`.
4. Use unique-per-run identifiers for any data you create. Implement
   `afterEach` cleanup that runs even on test failure.
5. Wait `~2.5s` between save and reload — the Firestore sync debounce in
   `firestoreSync.ts` is `2000ms`, and `AuthContext.startSync` flushes
   debounced. Reloading sooner means `loadFromCloud` overwrites local with a
   stale cloud doc.
6. Update the table at the top of this README.

## Known constraints

- **Sequential by design**: `playwright.config.ts` sets `workers: 1` and
  `fullyParallel: false`. Multiple tests touching the same test user's
  Firestore doc in parallel produce non-deterministic outcomes (last write
  wins).
- **Single browser**: only Chromium is configured.
- **Sync debounce**: hard `waitForTimeout(2_500)` between save and reload is
  intentional and reflects `firestoreSync.SYNC_DEBOUNCE_MS = 2000`. There is
  no UI signal to wait on (no "saved" indicator — see
  [audit Batch 2/3 candidate findings](../../AGENTS.md)).
