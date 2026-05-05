# End-to-end tests

Playwright-driven browser tests that verify TheTemple's behavior end-to-end
through the real Firebase backend (auth + Firestore). Each spec mirrors a
verification step from one of the audit batches that's already shipped on
`main` — so re-running these is how we confirm the fix didn't regress.

| Spec | Batch | Invariant covered | Status |
|---|---|---|---|
| `calendar-location-roundtrip.spec.ts` | Batch 1 | Clearing an event's location field actually clears it under `setDoc({merge:true})` — the null-emit pattern from `b484873` | **blocked** (`test.fixme`) — see below |

Future batches add a new `*.spec.ts` here per logical invariant.

## Currently blocked tests

**`calendar-location-roundtrip`** — marked `test.fixme()`. The end-to-end
round-trip fails not because the Batch 1 invariant is wrong, but because of
an unrelated audit finding (`AuthContext.onAuthStateChanged` is not
cancellation-safe). The auth listener fires twice on page load and each chain
calls `resetStore()` before awaiting cloud loads, so user writes between the
two chains get wiped within ~300ms of any click. The full diagnostic
timeline is in the comment block at the top of the spec file.

**Until that race is fixed**, Batch 1's actual invariant is verified at the
**store layer** in `src/store/useCalendarStore.test.ts` and
`src/store/useStore.test.ts`. The null-emit fixes are pure JS state
mutations — Vitest can prove them without React or Firebase, and that's the
layer where the fix was made. Use the Vitest store tests as the first stop
for batch verification until the e2e suite is unblocked.

Once `AuthContext` is made cancellation-safe in a future audit batch, switch
`test.fixme` back to `test` here.

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

Playwright auto-starts a Vite **preview** (production build) on
`http://localhost:5173` and reuses it if already running locally
(`reuseExistingServer: !process.env.CI`). On a cold run the build adds
~3-5 seconds; subsequent runs reuse the running preview.

Note: while the only spec here is `test.fixme()`'d, `npm run test:e2e` will
report `0 passed, 1 skipped` and exit zero — that's expected. Do not rely
on it for verification of audit batches until at least one spec is
unblocked.

## Why production build, not dev

React 18 Strict Mode runs effects twice in dev only. `AuthContext`'s
`onAuthStateChanged` callback (`src/contexts/AuthContext.tsx:135-176`)
begins with `resetStore()` on all three Zustand stores, so the
double-invocation can wipe local writes that happen in between the two
mounts. This is a known audit finding (AuthContext race, high severity)
— in dev the race fires reproducibly within ~300 ms of any user
interaction; in production builds Strict Mode is a no-op and the
listener fires once.

For verification of behavior, prod-build testing matches what users at
`thetemple.web.app` actually run. Until the AuthContext race is fixed
in its own audit batch (cancellation-safe callback + uid stale-check),
testing against `npm run dev` would fail not because of the invariant
under test but because of an unrelated bug.

**TODO**: when the AuthContext race is fixed in a future audit batch,
switch the `webServer.command` in `playwright.config.ts` back to
`npm run dev` for faster local iteration (saves the build step).

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
