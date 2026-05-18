# Sync model — AuthContext, the three stores, and Firestore

How local state reaches the cloud and back. This is the most race-prone area of
the app — read it before touching `AuthContext.tsx`, `firestoreSync.ts`, or any
store's `getCloudSyncData` / `loadFromCloud` / `resetStore`.

> Code: `src/contexts/AuthContext.tsx`, `src/lib/firestoreSync.ts`, the three
> Zustand stores in `src/store/`. Rationale: `docs/DECISIONS.md` D-3/D-4.
> Invariants: `docs/DATA_POLICY.md` §5–§8.

## The pieces

- **Three Zustand stores**, each with `persist` middleware to localStorage:
  - `useStore` — workout (`workout-tracker-storage`)
  - `useDietStore` — diet (`diet-tracker-storage`)
  - `useCalendarStore` — calendar (`calendar-storage`)
- **`AuthContext`** owns the cloud-sync lifecycle for all three, and is the
  only place that calls Firebase Auth methods.
- **`firestoreSync.ts`** performs the Firestore reads/writes — one document per
  module per user.

## Firestore layout

```
users/{uid}/data/workout      users/{uid}/data/calendar
users/{uid}/data/diet         users/{uid}/data/siriConfig
siriTokens/{token}            (top-level lookup index for the Cloud Functions)
```

## Login lifecycle

`onAuthStateChanged` fires with a `user`; the callback:

1. `setCurrentUser(user)`.
2. **Reset** — `resetStore()` on all three stores, clearing any prior user's
   in-memory data.
3. **Load** — `Promise.all([loadWorkoutData, loadDietData, loadCalendarData])`
   reads the three Firestore docs.
4. **Hydrate** — `loadFromCloud(data)` on each store that returned a document.
5. **Subscribe** — `startSync(uid)` installs one Zustand `subscribe` listener
   per store.
6. `setLoading(false)`.

## Steady-state sync (`startSync`)

A Zustand subscription fires on **every** state change, including ephemeral UI
state. To avoid write storms, each subscriber runs a **reference-equality
check** over only the synced slices and returns early if none changed:

- **workout:** `user, workoutSessions, currentSession, routines, exercises,
  personalRecords, weightEntries, exerciseGoals, blockCustomizations`
- **diet:** `customFoods, recipes, meals, foodLog, recentFoodIds, dietSettings,
  streaks`
- **calendar:** `events, calendars, settings, invitations`

If something changed, the subscriber calls
`debouncedSave*Data(uid, getCloudSyncData())`.

## The 2-second debounce

`firestoreSync.ts` sets `SYNC_DEBOUNCE_MS = 2000`. Each `debouncedSave*Data`
resets a per-store timer; the write fires 2 s after the last change, so rapid
edits collapse into one write.

Writes use `setDoc(ref, data, { merge: true })`. **Merge semantics matter:**
`{ field: undefined }` *preserves* the prior cloud value; `{ field: null }`
clears it. Hence the **null-emit on clear** rule — editor fields emit `null`,
not `undefined`, when cleared (`docs/DATA_POLICY.md` §1/§3).

## Logout

`logout()` order is deliberate — **flush before sign-out**:

1. `stopSync()` — cancel pending debounced writes, remove subscriptions.
2. `Promise.all([saveWorkoutData, saveDietData, saveCalendarData])` — a
   **non-debounced** immediate flush of current state.
3. `signOut(auth)`.
4. Clear the three localStorage keys.

The flush must happen while still authenticated (Firestore rules require
auth). Skipping it loses the last up-to-2 s of edits.

## Account deletion

`deleteAccount()`: re-authenticate → `stopSync()` → `revokeSiriToken` →
`deleteUserCloudData` (deletes the three docs) → `deleteUser` (the auth account
— point of no return) → clear localStorage. The auth account is deleted last.

## The 5-place persisted-slice invariant

A slice that must sync has to appear in **all five** places: the type
definition, `resetStore`, `getCloudSyncData`, `loadFromCloud`, and the
`startSync` equality check. Step-by-step: `docs/runbooks/add-persisted-slice.md`.
`getCloudSyncData` ships a **lean projection** — `useStore` strips static
`exercises` to `{id, name}`; never ship seed data to the cloud.

## Known issue — the AuthContext race (unfixed)

`onAuthStateChanged` is **not cancellation-safe**. Firebase emits the listener
more than once on a cold load (a cached-user fire, then a verified fire). Each
chain runs `resetStore()` before awaiting its cloud loads. Failure modes:

- **Interaction wipe** — if a chain's `resetStore` lands *after* the user has
  interacted, it wipes the local write; the wipe propagates to cloud on the
  next debounced save.
- **Leaked subscribers** — `startSync` overwrites `unsubWorkoutRef.current`
  (etc.) without calling the previous unsub, so a second fire orphans the
  first chain's three subscriptions; they keep firing.
- **Empty-state TOCTOU** — the synchronous `resetStore` can schedule a
  debounced empty-state write that races a slow `loadFromCloud`.

This blocks the e2e harness — `tests/e2e/calendar-location-roundtrip.spec.ts`
is `test.fixme()`'d until it is fixed. Full reproduction and proposed fix
shape: `docs/AUDIT_STATE.md` ("Cross-cutting blocker") and
`docs/audits/2026-05-08-cross-module-audit.md` (C-1). Until then, e2e runs
against the production build, not dev, because React Strict Mode's
double-invoke amplifies the race — see `docs/DECISIONS.md` D-8.
