# Plan — Fix the AuthContext cloud-sync race

**Status:** proposed (Phase 1 — plan only, no source edited).
**Branch:** `claude/fix-authcontext-race-8mq2`.
**Scope:** one controller file (`src/contexts/AuthContext.tsx`) + one new test +
config/doc updates. No store-shape change, no Firestore-path change, no
`firestore.rules` / `functions/` change.
**Audit refs:** finding C-1 in `docs/audits/2026-05-08-cross-module-audit.md`;
"Cross-cutting blocker" in `docs/AUDIT_STATE.md`; "Known issue" in
`docs/sync-model.md`. Reference (do **not** merge): `origin/claude/audit-authcontext-race`.

---

## TL;DR

`onAuthStateChanged` in `AuthContext.tsx` is not cancellation-safe. Its callback
runs `resetStore()` then `await`s cloud loads then `loadFromCloud()` — both
`resetStore` and `loadFromCloud` are destructive whole-store overwrites. When
the listener fires more than once (Firebase cached-then-verified emission;
React StrictMode dev double-invoke), a later chain re-runs that destructive
pair *after* the UI has gone interactive and the user has written something,
wiping the write. The wipe then propagates to Firestore on the next debounced
sync.

The fix keeps the documented shape — an `AbortController` per chain, an
`auth.currentUser` re-validation after awaits, unsubscribe-before-overwrite —
and adds the two pieces the reference attempt was missing: a **null-safe
same-uid dedup** so an already-owned session is never re-hydrated, and
**fusing `resetStore()` with `loadFromCloud()` after the await** so the
destructive phase is a single un-interruptible synchronous block.

---

## 1. The race mechanism(s)

### 1.0 Current flow (what the code does today)

`AuthProvider`'s `useEffect` (`AuthContext.tsx:150-198`) registers one
`onAuthStateChanged` listener. The `async` callback (`:151`):

1. `setCurrentUser(user)` — `:152`.
2. If `user`: `resetStore()` on all three stores — `:156-158` — **synchronously,
   before any await**.
3. `await Promise.all([loadWorkoutData, loadDietData, loadCalendarData])` —
   `:162-166`.
4. `loadFromCloud(...)` on each store that returned a doc — `:168-176`.
5. `startSync(user.uid)` — `:182` — installs one Zustand subscriber per store
   into `unsubWorkoutRef` / `unsubDietRef` / `unsubCalendarRef` (`:85-87`,
   assigned at `:95`, `:110`, `:123`).
6. `setLoading(false)` — `:191`.

`loading` gates the **entire** UI: `AppRoutes` returns `<LoadingScreen/>` while
`loading` is true (`App.tsx:59-61`). So no route — including the calendar event
editor — renders until some chain reaches step 6.

Both destructive operations are full-store overwrites:

- `resetStore()` — e.g. `useCalendarStore.ts:273-282` sets `events: []`.
- `loadFromCloud(data)` — e.g. `useCalendarStore.ts:254-261` sets
  `events: (data.events as CalendarEvent[]) ?? get().events`. The `?? get()`
  only falls back when the cloud field is `null`/`undefined`; if the cloud doc
  *exists* with a stale `events` array (the normal case), it **replaces** local
  state wholesale.

Two distinct races ride on this. The labels Race A / Race B match the reference
branch's own top-of-file taxonomy.

### 1.1 Race A — concurrent overlap

**Mechanism.** The callback is `async` and suspends at the `await` on
`:162-166`. A second invocation can start while the first is suspended. Nothing
tracks an in-flight chain, so **both** invocations run
`resetStore → loadFromCloud → startSync` with no ordering guarantee.

**Triggers.**
- React StrictMode dev double-invoke (`main.tsx:7-9`): mount → run effect
  (listener registered, fires) → cleanup → run effect again (listener
  re-registered, fires) → two near-simultaneous chains.
- Firebase emitting the listener twice on a cold load (cached-user emission,
  then a verified emission) close enough together to overlap.

**Failure modes.**
- *Subscriber leak.* `startSync` (`:89-132`) assigns `unsubWorkoutRef.current =
  useStore.subscribe(...)` (`:95`, `:110`, `:123`) **without calling the prior
  unsub**. A second `startSync` orphans the first chain's three subscriptions —
  they keep firing on every state change forever (until logout/unmount),
  doubling every debounced Firestore write. Audit C-1(a).
- *Nondeterministic apply order.* The two `loadFromCloud` calls, plus any
  interleaved store write, land in whatever order the event loop produces.
- *Empty-state TOCTOU write* (audit C-1(b)). If a chain runs `resetStore()`
  while a *prior* chain's subscribers are still installed (the leak above), the
  reset's reference-changing `set()` trips those subscribers, which schedule
  `debouncedSaveCalendarData(uid, EMPTY)` (`firestoreSync.ts:52-59`, debounce
  `SYNC_DEBOUNCE_MS = 2000`, `:23`). If a slow `loadFromCloud` does not land and
  reset the timer within 2 s, the **empty doc is written to Firestore**.

### 1.2 Race B — serial same-uid re-fire

**Mechanism.** A second `onAuthStateChanged` fire for the **same uid** arrives
*after* the first chain fully completed — `loading` already flipped to false,
the UI is interactive, `startSync` already installed. The second chain re-runs
`resetStore()` (instant empty) → `await` → `loadFromCloud(staleCloudDoc)`.

Because `loading` is already false, the user has had the chance to interact.
Any event / set / weight entry created **after chain 1 finished and before
chain 2's destructive phase** is lost:

- `resetStore()` empties the slice, **or**
- `loadFromCloud()` replaces it with the pre-interaction cloud doc — which does
  **not** contain the new write, because sync is debounced 2 s and has not
  flushed yet.

**Trigger.** Firebase emitting the listener again for an already-established
user — the late "verified" emission, a token-refresh-adjacent re-emit, or (the
reference branch's hypothesis) a transient `null` emission *between* two
same-uid emissions.

**Failure mode.** Data loss. The wipe is in-memory immediately; it propagates to
Firestore on the next debounced sync, so it survives reload. Audit H-3 notes
this then compounds: once cloud holds `events: []`, `[] ?? default` in
`loadFromCloud` keeps the wipe on every subsequent login.

### 1.3 Why the reference branch closed A but not B

`origin/claude/audit-authcontext-race` (commit `ddc4670`, do not merge) added a
`sessionRef = { uid, controller }` and:

- **Race A:** an `AbortController` per chain; a new chain aborts the prior; each
  chain checks `signal.aborted` after its await and bails. Plus `startSync`
  now calls `stopSync()` first. **This part is sound** and the plan keeps it.
- **Race B:** a dedup — `if (targetUid !== null && sessionRef.current.uid ===
  targetUid) return;` — meant to make a same-uid re-fire a no-op.

The branch's own commit `c2198ea` records: **"Race B NOT closed."** Its
diagnostic saw `events` go `1 → 0` within ~500 ms of the Add click in a
production build, fix present in the bundle. Three un-disambiguated hypotheses
were logged (sessionRef cleared between fires / a transient `null` fire / the
wipe origin not being `resetStore`), and the branch deferred to instrumentation.

The structural reason the dedup is fragile: **it is a deny-list keyed on one
ref.** The predicate suppresses only a fire whose `user.uid` exactly equals the
stored uid. It cannot suppress a `null` fire — `targetUid !== null` explicitly
excludes it — and a `null` fire still takes the destructive work path
(`resetStore()`), and clears the session uid, which **un-dedups the next
same-uid fire**. So `X → null → X` slips straight through: the `null` wipes,
or it resets the dedup key so the trailing `X` re-hydrates and wipes. Any one
Firebase emission pattern the deny-list does not anticipate re-opens Race B.

The fix below does not depend on perfectly enumerating Firebase's emission
patterns. It is robust to all three hypotheses (see §2.6).

---

## 2. The fix

A controller-only change in `AuthContext.tsx`. Five elements; the first four are
unconditional, the fifth (`§2.5`) is the null-fire handling.

### 2.1 `AbortController` per chain — closes Race A

Add `controllerRef = useRef<AbortController | null>(null)`. Every callback that
takes a work path:

- aborts the previous controller (`controllerRef.current?.abort()`),
- creates a fresh `AbortController`, stores it, captures `const { signal } =
  controller`,
- after the `await Promise.all([loads])` and **before every** subsequent store
  mutation / `startSync` / `setLoading`, checks `if (signal.aborted) return;`.

Of N overlapping chains, only the newest mutates a store. The `useEffect`
cleanup (`:194-197`) also aborts, so a StrictMode unmount kills the in-flight
chain before remount.

### 2.2 `auth.currentUser` re-validation — defense in depth

After the loads resolve, in addition to `signal.aborted`, assert
`auth.currentUser?.uid === user.uid` before `loadFromCloud`. `auth.currentUser`
is Firebase's own source of truth; this catches an auth transition that
happened during the await even if the generation/abort bookkeeping has a hole.
This is the `auth.currentUser?.uid` guard named in the documented fix shape.

### 2.3 Null-safe same-uid dedup — closes Race B

Add `establishedUidRef = useRef<string | null>(null)` — the uid of the session
currently owned (in-flight or completed).

- A callback whose `user` is non-null and `user.uid === establishedUidRef.current`
  **returns immediately** after `setCurrentUser` — the session is already
  owned; no reset, no load, no `startSync`. This is the clean same-uid re-fire.
- `establishedUidRef.current` is set at the **start** of a genuine work chain
  (so a re-fire that arrives while the chain is still mid-`await` also dedups —
  it does not start a duplicate chain).
- The `useEffect` cleanup resets `establishedUidRef.current = null`. **This is
  load-bearing:** a StrictMode cleanup aborts the in-flight chain (§2.1); if the
  ref still held that uid, the remount's fire would dedup-bail into a chain that
  never completes — stuck `<LoadingScreen/>` forever. Clearing the ref on
  cleanup makes the remount re-hydrate. (The reference branch discovered this
  too; see its cleanup comment.)

### 2.4 Unsubscribe before overwrite — closes the subscriber leak

`startSync` calls `stopSync()` as its first statement, and the work path calls
`stopSync()` before installing subscribers. No `unsub*Ref` is ever overwritten
while non-null. `stopSync` is already idempotent (null-checks at `:136-147`) so
repeated calls (callback + `logout` + `startSync`) are safe. (Keep the
reference branch's version of this — it was correct.)

### 2.5 Fuse `resetStore()` with `loadFromCloud()` after the await

Move the three `resetStore()` calls from *before* the `await` (`:156-158`) to
*after* it, immediately before the `loadFromCloud()` calls, with **no `await`
between reset and load**:

```
await Promise.all([loads])          // the only suspension point
if (signal.aborted) return;
if (auth.currentUser?.uid !== user.uid) return;
resetStore() x3                     // destructive phase begins
loadFromCloud() x3                  // ...and ends — one synchronous block
startSync(user.uid)
setLoading(false); establishedUidRef.current = user.uid
```

Zustand `set` and `subscribe` are synchronous, so reset → load → `startSync` is
one un-interruptible event-loop turn. Nothing — no user click, no other chain,
no cleanup — can interleave between "store emptied" and "store hydrated".

This also **eliminates the empty-state TOCTOU write** (§1.1): `resetStore()` no
longer sits exposed for ~2 s, and it now runs *after* `stopSync()` removed any
prior subscribers and *before* this chain's `startSync` installs new ones — so
`resetStore` never has a live subscriber to trip. The audit's alternative
("mute the subscribers with a `loadingRef`") becomes unnecessary; the ordering
does it structurally.

### 2.6 Null-fire handling (the Race B hardening)

A `null` from `onAuthStateChanged` is either a **genuine sign-out** or
**noise** (a transient emission, the reference branch's hypothesis 2). They are
indistinguishable from the callback argument alone. Today every `null` runs
`resetStore()` (`:186-188`) — which is the wipe vector if the `null` is noise.

In this app a genuine sign-out happens **only** through `AuthContext.logout()`
or `deleteAccount()`. So make intent explicit:

- Add `intentionalSignOutRef = useRef(false)`. `logout()` and `deleteAccount()`
  set it `true` immediately before calling `signOut(auth)` / `deleteUser(user)`.
- The callback's `null` branch:
  - **`intentionalSignOutRef.current === true`** → genuine sign-out:
    `stopSync()`, `resetStore()` x3, `establishedUidRef.current = null`, clear
    the flag. (Same observable behavior as today's logout.)
  - **otherwise** → unexpected `null` (transient, or an external session loss):
    do **nothing destructive**. `setCurrentUser(null)` already ran at the top of
    the callback, so the UI drops to `/login` regardless. Do **not** `resetStore`,
    do **not** clear `establishedUidRef`, do **not** `stopSync`.
- `setLoading(false)` runs on every callback path (so the first fire always
  clears the gate, including a cold load with no cached user).

Why this is robust to a transient `null`: `X → null → X` becomes
hydrate(X) → no-op → dedup(X). `establishedUidRef` stays `X` across the `null`,
so the trailing `X` dedups instead of re-hydrating. The store is never reset.
The newEvent survives.

Cost of the one deliberate behavior change: a genuine session loss that does
*not* go through the app's own logout button (e.g. a server-side token
revocation) leaves the Zustand subscribers installed on a now-unauthenticated
client. Subsequent debounced writes fail the Firestore rules and are swallowed
by `save*Data`'s `catch` (`firestoreSync.ts:47-49`). No data loss; mildly
untidy; rare for a single-owner app. Acceptable — and far better than wiping a
live session on every transient `null`.

**This §2.6 design is robust to all three of the reference branch's
hypotheses** — H1 (ref cleared between fires): only a real cleanup or a
confirmed logout clears `establishedUidRef`; H2 (transient null): the unexpected
`null` path is non-destructive; H3 (wipe origin is `loadFromCloud`, not
`resetStore`): a deduped/aborted chain reaches *neither*, and the owning chain
fuses them atomically (§2.5). Instrumentation (Phase 2 step 1) therefore
*confirms* the live mechanism rather than *driving* the design.

### 2.7 Optional — extract a pure transition helper

Extract the "what should this fire do?" decision into a pure function in a new
`src/contexts/authSession.ts` — e.g. `resolveAuthAction(incomingUid,
establishedUid, intentionalSignOut): 'dedup' | 'hydrate' | 'signout' | 'noop'`.
Pure ⇒ table-testable in isolation (cheap, exhaustive Race B coverage), and it
keeps `AuthContext.tsx` free of a non-component export (the file already needs
one `eslint-disable react-refresh/only-export-components` for `useAuth`).
Recommended but not required — the integration test (§5) covers the behavior
either way.

---

## 3. Files touched

### Phase 2 — code

| File | Change |
|---|---|
| `src/contexts/AuthContext.tsx` | The fix: new `controllerRef`, `establishedUidRef`, `intentionalSignOutRef`; rework the `onAuthStateChanged` callback (dedup → abort prior → `stopSync` → `await` loads → `signal`/`auth.currentUser` guards → fused `resetStore`+`loadFromCloud` → `startSync` → `setLoading`); null branch per §2.6; `startSync` calls `stopSync()` first; `logout`/`deleteAccount` set `intentionalSignOutRef`; cleanup aborts + clears `establishedUidRef`. Update the top-of-file `KNOWN ISSUE` comment to describe the now-fixed model. |
| `src/contexts/authSession.ts` *(new, optional — §2.7)* | Pure `resolveAuthAction` decision helper + its types. |

No change to the three stores, `firestoreSync.ts`, `firestore.rules`,
`functions/`, `scripts/`, or `main.tsx`. `<StrictMode>` stays — the fix makes
the code correct *under* it.

### Phase 2 — tests

| File | Change |
|---|---|
| `src/contexts/AuthContext.test.tsx` *(new)* | Integration test — mocks `firebase/auth`, `../lib/firebase`, `../lib/firestoreSync`, `../lib/siriToken`; drives multi-fire sequences against the real stores; asserts no wipe / no leak. See §5. |
| `src/contexts/authSession.test.ts` *(new, if §2.7 taken)* | Table test for `resolveAuthAction`. |
| `tests/e2e/calendar-location-roundtrip.spec.ts` | `test.fixme(` → `test(` at `:94`; trim the stale `BLOCKED` comment block to a one-line note. |

### Phase 2 — config & docs

| File | Change |
|---|---|
| `playwright.config.ts` | `webServer.command` → `npm run dev` (`:32`); update the comment (D-8 reversal trigger fired). |
| `tests/e2e/README.md` | Update "Currently blocked tests", "Why production build", remove the TODO. |
| `docs/sync-model.md` | "Known issue" section → resolved; describe the cancellation-safe model. |
| `docs/AUDIT_STATE.md` | "Cross-cutting blocker" → resolved; mark audit C-1 closed. |
| `docs/PROJECT_STATE.md` | Drop the AuthContext-race row from "Known risks"; refresh "Where to start". |
| `docs/DECISIONS.md` | Note D-8's reversal trigger fired; optionally add D-12 (cancellation-safe auth controller). |
| `CLAUDE.md` | "Known issues (active blockers)" — remove/mark resolved; drop the ⚠️ on the AuthContext map line and the critical-files row. |
| `docs/ARCHITECTURE.md` | Update the race reproduction note if present. |
| `CHANGELOG.md` | Add the landing. |

`docs/audits/2026-05-08-cross-module-audit.md` is a dated historical record —
left as-is; `AUDIT_STATE.md` carries the "resolved" status.

### Phase 1 — this deliverable

`docs/plans/fix-authcontext-race.md` (this file).

---

## 4. Invariant impact

The fix is contained to the auth controller. Walking every hard invariant and
both 5-place rules:

| Invariant / rule | Impact |
|---|---|
| **Persisted-slice 5-place rule** | **Not triggered.** No slice added or removed. `startSync`'s reference-equality slice lists (`AuthContext.tsx:96-106` / `:111-119` / `:124-129`) are kept **byte-identical** — the fix only adds a `stopSync()` call at the top of `startSync`, it does not touch the comparisons. Stores' types / `resetStore` / `getCloudSyncData` / `loadFromCloud` are untouched. |
| **Firestore-path 5-place rule** | **Not triggered.** No path changes. `firestoreSync.ts`, `firestore.rules`, `functions/`, `backup.cjs`, `restore.cjs` untouched. |
| #1 / #10 — no `undefined` to Firestore | Not touched — the fix never builds a Firestore payload; it controls *when* loads/syncs run. |
| #2 — `YYYY-MM-DD` date stamps | Not touched. |
| #3 — `dayOfWeek` 0=Sun..6=Sat | Not touched. |
| #4 — lean cloud projection | Not touched (`getCloudSyncData` unchanged). |
| #5 — ephemeral state not synced | Preserved — the equality-check lists are unchanged (see above). |
| #6 — **2 s debounce + logout flush** | `SYNC_DEBOUNCE_MS` and `firestoreSync.ts` are untouched. The `logout()` order — `stopSync()` → non-debounced `save*Data` flush → `signOut` (`:214-225`) — is **preserved**; the fix only *adds* `intentionalSignOutRef.current = true` immediately before `signOut(auth)`. No `await` is inserted, nothing is reordered. The fix in fact *strengthens* the debounce story by removing the empty-state TOCTOU write (§1.1). |
| #7 — calendar soft-delete | Not touched. |
| #8 — one doc per module | Not touched. |
| #9 — **persisted version + migrate** | **No store-shape change → no version bump, no `migrate()`.** The fix lives entirely in the controller; all three persisted shapes are byte-identical. |

No invariant is relaxed. The fix is purely additive to the controller's
lifecycle logic.

---

## 5. Test strategy

### 5.1 The e2e spec — yes, this fix un-blocks it

`tests/e2e/calendar-location-roundtrip.spec.ts` is `test.fixme()`'d **solely**
because of this race (the spec's own header comment and `tests/e2e/README.md`
say so). Once the fix lands, Phase 2:

1. flips `test.fixme(` → `test(` (`:94`),
2. reverts `playwright.config.ts` `webServer.command` to `npm run dev` (`:32`) —
   the D-8 reversal trigger. The fix makes the code correct under StrictMode's
   dev double-invoke, which was the reason e2e ran against the prod build.

**Verification caveat:** `npm run test:e2e` hits real Firebase and needs
`.env.test` (test-user creds) + `.env` (Vite `VITE_FIREBASE_*`) + network + the
`e2e-test@thetemple.test` user. **`.env.test` is not present in this
environment** — so Phase 2 may not be able to *run* the e2e here. The fix is
still correct to make and the spec correct to enable; if e2e cannot be executed
in-session, the integration test (§5.2) is the gating regression evidence and
the e2e-enable should be called out as unverified-locally in the commit body.

### 5.2 Unit / integration test — the regression net

New `src/contexts/AuthContext.test.tsx` (Vitest + jsdom + `@testing-library/react`
— all already in `devDependencies`; precedent: `src/pages/DietMealEditor.test.tsx`).
This reproduces the race **deterministically without Firebase or Playwright**.

**Mock surface (`vi.mock`):**
- `firebase/auth` — `onAuthStateChanged` stashes the callback so the test
  invokes it on demand with any `User | null` sequence; `signOut` is a spy.
- `../lib/firebase` — fake `auth` with a settable `currentUser`.
- `../lib/firestoreSync` — `load*Data` return deferred promises the test
  resolves manually (to stage overlap vs. serial timing); `debouncedSave*Data` /
  `save*Data` are spies.
- `../lib/siriToken` — `revokeSiriToken` no-op.
- The three Zustand stores are **not** mocked — real state, so assertions read
  real store contents.

**Cases:**

| # | Scenario | Assertion |
|---|---|---|
| 1 | Serial same-uid re-fire (Race B): fire `X`, resolve loads, chain completes; `useCalendarStore.getState().addEvent(...)`; fire `X` again | the added event still in `events` |
| 2 | `X → null → X` (transient null): complete chain `X`; add event; fire `null`; fire `X` | event survives; `resetStore` not applied |
| 3 | Concurrent overlap (Race A): fire `X` twice before resolving loads; resolve | one set of subscribers; an event added during the overlap survives |
| 4 | Subscriber leak: after two fires, one store mutation triggers each `debouncedSave*Data` **exactly once** (a leak ⇒ ≥2) |
| 5 | Genuine logout: complete `X`; `logout()`; assert `intentionalSignOutRef` path → `stopSync` + `resetStore` ran, `loading` false |
| 6 | User switch `X → Y`: assert `Y`'s data loaded, `X`'s subscribers gone |
| 7 | StrictMode: render inside `<StrictMode>` (Vitest uses React's dev build ⇒ effects double-invoke) — assert exactly one completed hydration, `loading` resolves to false, app not stuck |
| 8 | Cold load, no cached user: first fire `null` → `loading` false, no chain |

If §2.7 is taken, add `authSession.test.ts` — an exhaustive table over
`resolveAuthAction` inputs (`dedup` / `hydrate` / `signout` / `noop`).

### 5.3 Gate

Phase 2 ends with the standard gate (`docs/runbooks` / `/preflight`):
`npm run lint`, `npm run build`, `npm test` (expect the current 59 + the new
AuthContext cases, all green). `functions/` is untouched ⇒ its gate is not
required. Plus a manual smoke: cold load, reload-while-interacting, logout,
log back in, switch users.

---

## 6. Risks & rollback

### Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `AuthContext.tsx` is the highest-blast-radius file — every session boots through it. A logic error breaks login for everyone. | Med | Integration test §5.2 covers 8 lifecycle scenarios incl. StrictMode; manual smoke; e2e once runnable. Keep the diff to the one file. |
| A callback path that misses `setLoading(false)` ⇒ app stuck on `<LoadingScreen/>`. | Med | Every path ends at `setLoading(false)`; §5.2 cases 5/7/8 assert `loading` resolves. The cleanup-clears-`establishedUidRef` rule (§2.3) is the specific guard against the StrictMode stuck-spinner. |
| Transient-null hypothesis (H2) unconfirmed — fixing a phantom. | — | §2.6 is robust whether or not H2 is real; Phase 2 step 1 instruments to confirm. No downside if H2 is false. |
| Behavior change: an external (non-app-button) sign-out no longer resets the stores. | Low | Documented in §2.6; no data loss (failed writes are swallowed); rare for a single-owner app. Flag for reviewer (§Open decisions). |
| e2e can't be verified in-session (no `.env.test`). | High (this env) | Integration test is the gating evidence; commit body states e2e-enable is unverified-locally; reviewer/owner runs `npm run test:e2e` where creds exist. |
| Enabling the e2e exposes flakiness (real network, prod Firebase). | Low | `playwright.config.ts` already sets `retries`. Land the e2e-enable as its **own commit** so it can be reverted independently of the code fix. |

### Rollback

The fix touches **no persisted store shape, no Firestore path, no schema, no
`migrate()`** — so rollback is a clean `git revert` with nothing stranded (no
data migration to undo, no cloud docs in a half-state).

- Land the fix as a tight commit series on this branch: **(1)** the
  `AuthContext.tsx` fix + integration test, **(2)** the e2e-enable +
  `playwright.config.ts` revert, **(3)** the doc updates. Reverting commit (2)
  alone re-`fixme`s the e2e and restores the prod-build webServer without
  touching the code fix.
- Full rollback: `git revert` the merge (or the series). The app returns to
  exactly today's `e570c7e` behavior — the known race included.

---

## Phase 2 — execution checklist (ordered)

1. **Instrument & capture the baseline.** Temporary probes — a `console`/log at
   the top of the `onAuthStateChanged` callback (uid + `establishedUidRef`) and
   a `Storage.prototype.setItem` hook logging every `calendar-storage` write
   with stack frames (the reference branch's planned probes). Reproduce the
   wipe; record the real fire sequence + wipe origin. Confirms H1/H2/H3. Remove
   the probes before committing.
2. Implement §2.1–§2.6 in `AuthContext.tsx` (and §2.7 if approved).
3. Write `src/contexts/AuthContext.test.tsx` (§5.2); `authSession.test.ts` if §2.7.
4. Gate: `npm run lint && npm run build && npm test` — all green.
5. Enable the e2e: `test.fixme` → `test`; revert `playwright.config.ts` to
   `npm run dev`. Run `npm run test:e2e` **if** `.env.test` is available; else
   note unverified-locally.
6. Manual smoke (cold load, reload-mid-interaction, logout, re-login, switch).
7. Update docs (§3) — `sync-model.md`, `AUDIT_STATE.md`, `PROJECT_STATE.md`,
   `DECISIONS.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `CHANGELOG.md`,
   `tests/e2e/README.md`.
8. Commit series per §6 Rollback; do not open a PR unless asked.

---

## Open decisions for the reviewer

1. **Null-fire handling (§2.6).** Recommended: the `intentionalSignOutRef` flag —
   an unexpected `null` does only `setCurrentUser(null)`, nothing destructive.
   Alternative: a confirm-timer that defers the teardown ~250 ms to see if a
   user fire contradicts it. The flag is simpler and authoritative for the
   99 % app-initiated-logout case — **recommended**.
2. **Extract the pure helper (§2.7)?** Recommended: **yes** — cheap, makes Race
   B's dedup exhaustively table-testable, keeps `AuthContext.tsx` lint-clean.
3. **Re-gate `loading` on a same-session user switch?** Recommended: **no** for
   this fix — it would convert a pre-existing brief flash into a `<LoadingScreen/>`,
   a UX change beyond the race. Every auth transition in the e2e is preceded by
   a full page reload, so it is moot for the test. Leave as a possible
   follow-up.
4. **Commit type** — `fix(auth)` vs `audit(auth)` (this is audit finding C-1).
   `ROADMAP.md` calls for "a single targeted PR, not bundled." Recommended:
   `fix(auth)` for the code commit, with the e2e-enable as a separate commit on
   the same branch.
