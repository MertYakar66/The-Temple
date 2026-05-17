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
