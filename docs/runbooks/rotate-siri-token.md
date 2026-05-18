# Runbook — Rotate the Siri token

The Siri token is the bearer credential in every Apple Shortcut URL
(`?token=...`). Rotate it if it leaks, or periodically. Rotation is an
**in-app action** — there is no CLI path.

> Code: `src/lib/siriToken.ts`. UI: `src/pages/SiriSetup.tsx`
> (Settings → Siri Integration, route `/settings/siri`).
> User-facing guide: `docs/siri-integration.md`.

## How tokens are stored

Generating a token writes two Firestore docs:

```
users/{uid}/data/siriConfig   — { token, createdAt, timezone }  (user's copy)
siriTokens/{token}            — { userId, createdAt }           (lookup index)
```

The Cloud Functions resolve a caller by looking up `siriTokens/{token}`.

## Rotate

1. Open the app → **Settings → Siri Integration**.
2. Tap **Regenerate**. `generateSiriToken()` first deletes the old
   `siriTokens/{oldToken}` doc, then writes a fresh token to both locations.
3. Copy the new token.
4. Update every Apple Shortcut URL (`siriDailyBriefing`, `siriSchedule`,
   `siriWorkout`, `siriNutrition`) — replace the old `?token=` value.

## Revoke (no replacement)

Tap **Revoke** in the same screen. `revokeSiriToken()` deletes both
`siriTokens/{token}` and `users/{uid}/data/siriConfig`. All Shortcuts stop
working until a new token is generated.

## Caveat — revocation lag

The Cloud Functions cache token lookups for ~60 s, so a revoked or rotated
token can still authorize for up to a minute after the change. For a hard
cutoff, wait 60 s before assuming the old token is dead. (Tracked as M-5 in
`docs/audits/2026-05-08-cross-module-audit.md`.)
