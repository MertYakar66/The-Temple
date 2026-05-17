# Runbook — Release / deploy

The Temple is one Firebase project: static hosting for the React app + Cloud
Functions for Siri. No backend server.

- **Firebase project:** `the-temple-f195e`
- **Hosting target:** `myapp` → site `thetemple` → https://thetemple.web.app
- **Functions region:** `us-central1` (Node 20)

There is no CI — run these steps manually from a trusted machine signed in via
`firebase login`.

## Pre-flight (always)

```bash
npm run lint && npm run build && npm test
```

All three must be green. `npm run build` writes the production bundle to
`dist/` — the hosting `public` directory.

## Deploy the web app (hosting)

```bash
npm run build
```

**Verify the build carries Firebase config — before deploying.**
`npm run build` succeeds even when the `VITE_FIREBASE_*` env vars are missing
(no `.env` at the repo root, or an empty one): Vite silently bakes
`apiKey: undefined` into the bundle, and the deployed site loads to a blank
page (`auth/invalid-api-key`). `npm run lint` / `npm run build` cannot catch
this. Confirm the config is actually in the built bundle:

```bash
grep -c "firebaseapp.com" dist/assets/*.js   # must be > 0  (authDomain baked in)
grep -c "apiKey:void 0"   dist/assets/*.js   # must be 0    (apiKey real, not undefined)
```

If `firebaseapp.com` is `0`, or `apiKey:void 0` is non-zero, the build has no
Firebase config — `.env` is missing or empty. **STOP — do not deploy.** Fix
`.env` at the repo root, rebuild, and re-check.

Only when both checks pass:

```bash
firebase deploy --only hosting:myapp
```

## Deploy the Cloud Functions (Siri)

Only when `functions/` changed:

```bash
cd functions
npm install
npm run build && npm test
npm run deploy            # = firebase deploy --only functions
```

## Deploy Firestore security rules

Only when `firestore.rules` changed:

```bash
firebase deploy --only firestore:rules
```

## Notes

- `firebase deploy` regenerates `.firebase/` (a gitignored deploy cache) —
  leave it alone.
- The Siri function URLs are stable across deploys
  (`https://us-central1-the-temple-f195e.cloudfunctions.net/siri*`); a redeploy
  does not require users to re-pair Shortcuts.
