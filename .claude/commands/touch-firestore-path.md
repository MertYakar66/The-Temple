---
description: Walk the 5-place checklist for changing a Firestore path.
argument-hint: [the path change]
---

Help change a Firestore path: $ARGUMENTS

The app stores one document per module per user. A path change must be applied
in all five places, or it breaks reads, security, Siri, or backups — each
silently. Follow `docs/runbooks/touch-firestore-path.md`. Walk these and
confirm each:

1. **`src/lib/firestoreSync.ts`** — the `doc(db, 'users', uid, 'data', ...)`
   read/write calls (and `src/lib/siriToken.ts` for the Siri paths).
2. **`firestore.rules`** — the security rule for the path.
3. **`functions/src/index.ts`** — the Cloud Functions reads (Admin SDK).
4. **`scripts/backup.cjs`** — the backup enumeration.
5. **`scripts/restore.cjs`** — restore, mirroring backup exactly.

Finish with `npm run lint && npm run build && npm test`, then
`cd functions && npm run build && npm test`. Note: `firestore.rules` is not
unit-tested — it must be exercised live before deploy.
