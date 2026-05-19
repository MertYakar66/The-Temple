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

## Cancellation-safe `onAuthStateChanged` (audit C-1 fixed)

`onAuthStateChanged` is cancellation-safe. Firebase can emit the listener more
than once for one cold load (a cached-user emission, then a verified emission),
and React StrictMode double-invokes the effect in dev — so the callback is
guarded:

- **Same-uid dedup** — `resolveAuthAction` (`src/contexts/authSession.ts`)
  classifies each emission from (owned uid, incoming uid, intentional-sign-out
  flag). A re-fire for the uid already owned is a no-op — no reset, no reload.
- **Cancellation** — each `establish` chain owns an `AbortController`; a newer
  chain aborts the older, which bails after its `await` instead of clobbering.
- **Fused destructive phase** — `resetStore()` runs *after* the cloud-load
  await, fused with `loadFromCloud()` as one synchronous block; nothing can
  interleave between the stores being emptied and being hydrated. (No
  empty-state write — `resetStore` no longer sits exposed for ~2 s.)
- **Unsubscribe before overwrite** — `startSync` calls `stopSync()` first, so
  a prior chain's three subscriptions never leak.
- **Transient null** — a `null` emission resets the stores only when it
  follows an in-app `logout()` / `deleteAccount()` (tracked by an
  intentional-sign-out flag); an unexpected `null` does nothing destructive.

Fixed in `fix(auth): close AuthContext cloud-sync race` — design and rationale
in `docs/plans/fix-authcontext-race.md`; audit finding C-1 in
`docs/audits/2026-05-08-cross-module-audit.md`.
