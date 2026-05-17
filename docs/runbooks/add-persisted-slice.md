# Runbook — Add a persisted store slice

Adding a new field to a Zustand store that must survive reload **and** sync to
Firestore. Miss one step and you get silent data loss or Firestore write
storms. Touch all five places.

> Invariant: `CLAUDE.md` ("persisted-slice 5-place rule"), `docs/DATA_POLICY.md` §5.

## The 5 places

1. **Type definition** — add the field to the store's state interface in
   `src/types/index.ts` (or `src/types/calendar.ts` for calendar state).

2. **`resetStore()`** — add the field with its empty/default value. Runs on
   login (before cloud load) and logout. Missing it = stale data leaks across
   users.

3. **`getCloudSyncData()`** — include the field in the projection written to
   Firestore. Missing it = the field never syncs. Keep the projection lean —
   `useStore.getCloudSyncData()` strips static `exercises` to `{id, name}`;
   don't ship static seed data.

4. **`loadFromCloud(data)`** — restore the field from the cloud document, with
   a fallback to the current/default value. Missing it = the field never
   returns on a new device.

5. **The reference-equality check in `AuthContext.startSync`**
   (`src/contexts/AuthContext.tsx`) — add the field to the correct store's
   `subscribe` comparison. Today the checks compare:
   - **workout:** `user, workoutSessions, currentSession, routines, exercises,
     personalRecords, weightEntries, exerciseGoals, blockCustomizations`
   - **diet:** `customFoods, recipes, meals, foodLog, recentFoodIds,
     dietSettings, streaks`
   - **calendar:** `events, calendars, settings, invitations`

   A **persisted** slice missing here never triggers a sync write. An
   **ephemeral** slice wrongly added here causes a Firestore write storm.

## If the persisted shape changed

6. Bump `version` in the store's `persist` options and add a `migrate()` that
   maps old persisted state to the new shape. No bump = old localStorage
   payloads deserialize wrong.

## Verify

```bash
npm run lint && npm run build && npm test
```

The stores and `AuthContext.tsx` are decision-layer files — run the full gate,
not a targeted check.
