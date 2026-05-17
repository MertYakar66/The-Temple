# Runbook — Change a Firestore path

The app stores **one document per module per user**. A path change that misses
a site breaks reads, security, Siri, or backups — each silently.

> Invariant: `CLAUDE.md` ("Firestore-path 5-place rule"), `docs/DATA_POLICY.md` §10.

## Current layout

```
users/{uid}/data/workout      — workout store
users/{uid}/data/diet         — diet store
users/{uid}/data/calendar     — calendar store
users/{uid}/data/siriConfig   — Siri token + timezone
siriTokens/{token}            — top-level token lookup index (Cloud Functions)
```

## The 5 places

1. **`src/lib/firestoreSync.ts`** — the `doc(db, 'users', uid, 'data', '<x>')`
   read/write calls (`load*Data`, `save*Data`, `deleteUserCloudData`). The Siri
   paths additionally live in **`src/lib/siriToken.ts`**.

2. **`firestore.rules`** — the security rules scoping each subtree to its
   owner. A new path with no rule = permission-denied at runtime.

3. **`functions/src/index.ts`** — the Siri Cloud Functions read user data via
   the Admin SDK (which bypasses rules). Update every `users/{uid}/data/...`
   reference here.

4. **`scripts/backup.cjs`** — enumerates the per-module docs. A path it doesn't
   know about is silently not backed up.

5. **`scripts/restore.cjs`** — writes the same paths back; must mirror
   `backup.cjs` exactly.

## Verify

```bash
npm run lint && npm run build && npm test
cd functions && npm run build && npm test
```

Then exercise a real read/write path (login → edit → reload) before deploying.
`firestore.rules` is not covered by unit tests — deploy and test it live.
