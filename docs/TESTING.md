# Testing

Two-layer test suite plus a discipline rule for what counts as "verified". Companion to
`MODULES.md` (which lists what each test covers as part of its module description).

## Layers

### Unit / store / utility — Vitest

- Runner: `vitest run` (one-shot) / `vitest` (watch) / `vitest run --coverage`.
- Setup: `src/test/setup.ts`. Loads `@testing-library/jest-dom` matchers and an in-memory
  `localStorage` shim. The shim matters: Node 25 + Vitest 4 surface a partial localStorage
  that breaks `zustand/middleware/persist` without it (you get a bare `{}` and persist
  silently misbehaves).
- Test files: `src/**/*.test.ts`. Colocated with the file under test.
- Mocks: minimal. Tests run against the real store and real utilities. No Firestore mock —
  store-layer tests verify the slice and serialization, not the network round-trip.

### End-to-end — Playwright

- Runner: `npm run test:e2e`. Headed/UI/debug variants in `package.json`.
- Test files: `tests/e2e/*.spec.ts`.
- Helpers: `tests/e2e/helpers/auth.ts` (sign-in / sign-out using `.env.test` credentials).
- Web server: the Vite dev server (`npm run dev`). It previously ran the production build
  because StrictMode's dev double-invoke amplified the cancellation-unsafe
  `AuthContext.onAuthStateChanged` race; that race is fixed, so dev-build testing is correct
  again. See `DECISIONS.md` D-12.
- Single browser (Chromium), workers: 1, fullyParallel: false. Sequential by design — the
  test user has one Firestore doc per module and parallel writes produce non-deterministic
  outcomes.

## What's tested today

| File | Layer | Covers |
|---|---|---|
| `src/utils/date.test.ts` | Vitest | `getDateStamp` / `parseDateStamp` / `isDateStampInRange` |
| `src/utils/weight.test.ts` | Vitest | kg/lbs conversion + display rounding |
| `src/utils/workoutMetrics.test.ts` | Vitest | Volume / 1RM / set-volume helpers |
| `src/store/useStore.test.ts` | Vitest | Batch 1 null-emit invariants — `setExerciseGoal` clears `targetRIR/targetSets`, `updateSet({rir:null})` clears, `getCloudSyncData()` has no undefined paths |
| `src/store/useCalendarStore.test.ts` | Vitest | Batch 1 null-emit invariants — `updateEvent({location:null})` clears, `getCloudSyncData()` has no undefined paths |
| `tests/e2e/calendar-location-roundtrip.spec.ts` | Playwright | Calendar location create→clear→reload→sign-out-and-back round-trip. **Active.** |
| `src/contexts/authSession.test.ts` | Vitest | `resolveAuthAction` — the auth-transition decision (audit C-1 fix), 11-case table |
| `src/contexts/AuthContext.test.tsx` | Vitest | AuthContext cloud-sync race — multi-fire sequences vs. the real stores (audit C-1 fix), 8 cases |

## Verification discipline

**Verify at the layer where the fix was made.** Test the invariant at the lowest layer that
can capture it; lift to higher layers only when the lower one can't.
- Fix is in a Zustand action → store-level Vitest (see `useStore.test.ts`).
- Fix is in a utility → utility Vitest.
- Fix is in the auth controller → an integration test with mocked Firebase (see
  `src/contexts/AuthContext.test.tsx`).
- Fix is in a Cloud Function → functions emulator + targeted test.
- Fix is in a component → component test (Testing Library).
- End-to-end behavior through real Firebase → a `tests/e2e/*.spec.ts` Playwright spec.

If a spec ever has to be `test.fixme()`'d because an unrelated bug blocks it, keep it — don't
delete it, don't paper over the bug with waits before the first interaction — and say so in
the commit message, citing the spec by path. The lower-layer test is the proof-of-fix in the
meantime.

## Running

```sh
npm run lint         # ESLint
npm run build        # tsc -b && vite build
npm test             # vitest run
npm run test:watch   # vitest (watch mode)
npm run test:coverage # vitest run --coverage

npm run test:e2e         # Playwright (needs .env + .env.test)
npm run test:e2e:headed  # browser visible, normal speed
npm run test:e2e:ui      # Playwright UI mode — best for picking selectors
npm run test:e2e:debug   # step through with the inspector
```

`npm run lint` and `npm run build` and `npm test` are the gate every batch must pass before
merging. `npm run test:e2e` is **not** part of that gate — it needs `.env.test` + network +
the test user; run it when a change touches end-to-end behavior.

## Adding tests

For a new batch:
1. Identify the smallest, highest-signal invariant the batch introduced.
2. Pick the layer (utility / store / component / e2e) where the fix was made.
3. Test there first. Lift to higher layers only when the lower layer can't capture the
   invariant.
4. Use unique-per-run identifiers for any data the test creates (e.g.
   `E2E location test ${Date.now()}`); implement cleanup that runs even on test failure.
5. For e2e: the Firestore sync debounce is 2 s, so wait `~2.5 s` between save and reload —
   reloading sooner means `loadFromCloud` overwrites local with a stale cloud doc.

## Test prerequisites

For e2e specifically:
- A dedicated Firebase Auth user. Currently:
  - Email: `e2e-test@thetemple.test`
  - UID: `J3iKzKy129UicL4VrYFrQ3xUwFb2`
  - Firestore profile pre-populated (so `onboardingCompleted: true` and the app skips the
    onboarding flow on first sign-in).
- `.env.test` at repo root (gitignored). Required keys mirror `.env.example` plus
  `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`. See `tests/e2e/README.md` for the full key list.
- Test user lives in the **production** Firebase project. There is no separate staging
  project. Be aware when running destructive scripts. See `DECISIONS.md`.

## CI

GitHub Actions runs the secret-free gate on **every pull request** and on pushes to `main` —
workflow at `.github/workflows/ci.yml`:

- **Frontend job:** `npm ci` → `npm run lint` → `npm run build` → `npm test`.
- **Functions job:** `npm ci` → `npm run build` → `npm test`, in `functions/`.

Both run on `ubuntu-latest` / Node 20 with per-lockfile npm caching. The workflow needs **no
secrets** — `npm ci` / lint / build / test all succeed without Firebase config because Vite
reads `VITE_*` at runtime, not build time — so it runs on PRs from any branch.

`npm run test:e2e` is **not** in CI: it signs into real Firebase as a test user and needs
`.env.test`, which CI has no way to supply. e2e stays a local / manual step.

A Vercel GitHub integration also builds a preview deploy on every PR and posts it as a status
check (the repo has no Vercel config); it does not run lint or tests.

## When to update this file

- A new test layer is added (e.g. functions emulator).
- The verification discipline changes.
- The test prerequisites change (new test user, new env keys).
- A test layer's tooling changes (Vitest major upgrade, Playwright config shift).
