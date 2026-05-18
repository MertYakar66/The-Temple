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
- Web server: production build (`npm run build && npx vite preview --port 5173`). Not the
  dev server. Reason: React 18 Strict Mode in dev double-invokes
  `AuthContext.onAuthStateChanged`; combined with the AuthContext race finding, this wipes
  local writes within ~300 ms of any click. Production matches what users at
  `thetemple.web.app` actually run.
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
| `tests/e2e/calendar-location-roundtrip.spec.ts` | Playwright | Calendar location create→clear→reload→sign-out-and-back round-trip. **`test.fixme`'d** — see below |

## The blocked-test discipline

The single e2e spec is `test.fixme()`'d because the AuthContext race wipes local writes within
~300 ms of user interaction in the test environment. The spec is fully written and will start
passing once the race is fixed (see `AUDIT_STATE.md` for the fix shape).

**Discipline:**
1. Don't delete a `fixme`'d spec to "clean up". The intent is preserved for the day the
   underlying issue is fixed; the diagnostic in the spec's top-of-file comment is part of the
   bug record.
2. Don't paper over the race in test code (e.g. by inserting waits before the first
   interaction). The test must reproduce real-user conditions; if you compensate for the bug
   in the test, you can no longer use the test to verify the fix.
3. When you want to verify a Batch invariant whose e2e is blocked, **verify at the layer
   where the fix was made**:
   - Fix is in a Zustand action → store-level Vitest (see `useStore.test.ts`).
   - Fix is in a utility → utility Vitest.
   - Fix is in a Cloud Function → functions emulator + targeted test.
   - Fix is in a component → component test (Testing Library).
4. Note in the commit message that store-layer tests are the proof-of-fix because e2e is
   blocked. Cite the e2e spec by path.

## Running

```sh
npm run lint         # ESLint
npm run build        # tsc -b && vite build
npm test             # vitest run
npm run test:watch   # vitest (watch mode)
npm run test:coverage # vitest run --coverage

npm run test:e2e         # Playwright (currently 0 passed, 1 skipped — that's expected)
npm run test:e2e:headed  # browser visible, normal speed
npm run test:e2e:ui      # Playwright UI mode — best for picking selectors
npm run test:e2e:debug   # step through with the inspector
```

`npm run lint` and `npm run build` and `npm test` are the gate every batch must pass before
merging. `npm run test:e2e` is **not** a gate while the only spec is `test.fixme()`'d — it
exits 0 on `0 passed, 1 skipped`, which is uninformative.

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

No GitHub Actions and no test CI — lint/build/test pass locally before each merge. A Vercel
GitHub integration builds a preview deploy on every PR and posts it as a status check (the repo
has no Vercel config); it does not run lint or tests. If a test CI is added later, the target
gate is `lint && build && test` (not e2e — keep e2e local until the harness is unblocked and
stable).

## When to update this file

- A new test layer is added (e.g. functions emulator).
- The blocked-test discipline changes (e.g. when the AuthContext race is fixed and the e2e
  harness becomes a real gate, this file should reflect the new "e2e as gate" expectation).
- The test prerequisites change (new test user, new env keys).
- A test layer's tooling changes (Vitest major upgrade, Playwright config shift).
