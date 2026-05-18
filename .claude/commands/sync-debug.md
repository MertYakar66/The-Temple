---
description: Dump the AuthContext sync flow and the current race surface.
---

Produce a current, evidence-backed picture of the cloud-sync flow and its race
surface. Read these files and report from what they actually contain — cite
`file:line`, do not work from memory:

- `src/contexts/AuthContext.tsx` — the `onAuthStateChanged` callback,
  `startSync`, `stopSync`, `logout`, the `unsub*Ref`s.
- `src/lib/firestoreSync.ts` — `SYNC_DEBOUNCE_MS`, the debounced vs. immediate
  `save*Data`, `cancelPendingSyncs`.
- The three stores' `getCloudSyncData` / `loadFromCloud` / `resetStore`.

Report:

1. The login → reset → load → `startSync` sequence as the code has it now.
2. The `startSync` reference-equality slices, per store.
3. The race surface: is `onAuthStateChanged` cancellation-safe? Are prior
   `unsub*Ref` callbacks invoked before being overwritten? Can `resetStore`
   schedule an empty-state debounced write?
4. Whether the code still matches `docs/sync-model.md` and open finding C-1 in
   `docs/audits/2026-05-08-cross-module-audit.md` — flag any drift.

Read-only. Do not change code.
