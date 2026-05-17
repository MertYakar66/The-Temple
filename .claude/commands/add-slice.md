---
description: Walk the 5-place checklist for adding a persisted store slice.
argument-hint: [slice name + which store]
---

Help add a new **persisted** store slice: $ARGUMENTS

A persisted slice must be wired into all five places, or it causes silent data
loss or Firestore write storms. Follow `docs/runbooks/add-persisted-slice.md`.
Walk these in order and confirm each:

1. **Type definition** — `src/types/index.ts` (or `src/types/calendar.ts`).
2. **`resetStore()`** — add the field with its empty/default value.
3. **`getCloudSyncData()`** — include it in the synced projection; keep it lean.
4. **`loadFromCloud(data)`** — restore it, with a fallback.
5. **`AuthContext.startSync` equality check** — add it to the correct store's
   `subscribe` comparison in `src/contexts/AuthContext.tsx`.

If the persisted shape changed, also bump the store `version` and add a
`migrate()`.

Finish by running `npm run lint && npm run build && npm test` — these are
decision-layer files, so run the full gate.
