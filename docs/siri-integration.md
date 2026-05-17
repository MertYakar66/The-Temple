# Siri Integration Guide — The Temple

Your personal daily assistant through Siri. Ask about your schedule, workout, and nutrition hands-free — even from the lock screen.

---

## Overview

The Temple connects to Siri through **Apple Shortcuts + Firebase Cloud Functions**. Here's how the chain works:

```
"Hey Siri, daily briefing"
        ↓
Apple Shortcut triggers
        ↓
HTTP request → Cloud Function (with your private token)
        ↓
Cloud Function reads your Firestore data
        ↓
Returns a spoken text summary
        ↓
Siri speaks it back to you
```

---

## Prerequisites

Before starting, make sure you have:

1. **The Temple app** — signed in and synced to the cloud
2. **Data in the app** — calendar events, workout routines with scheduled days, and nutrition goals set up
3. **An iPhone** with the Shortcuts app installed (comes pre-installed on iOS 13+)
4. **Cloud Functions deployed** — see Deployment section below

---

## Step 1: Deploy Cloud Functions

You only need to do this once (and again whenever you update the function code).

```bash
cd functions
npm install
npm run deploy
```

This deploys 4 endpoints to Firebase:

| Function | What It Does |
|---|---|
| `siriDailyBriefing` | Full summary: schedule + workout + nutrition |
| `siriSchedule` | Today's calendar events only |
| `siriWorkout` | Today's workout routine and exercises |
| `siriNutrition` | Calories, protein, macros consumed vs. goals |

---

## Step 2: Generate Your Siri Token

1. Open The Temple app
2. Go to **Settings → Siri Integration** (route: `/settings/siri`)
3. Tap **"Generate Siri Token"**
4. A token like `AbCdEfGh-IjKlMnOp-QrStUvWx-YzAbCdEf` will appear
5. **Copy the token** — you'll paste it into each Shortcut

> **Security note:** This token is your private key. Never share it publicly. You can regenerate or revoke it anytime from the same settings page.

---

## Step 3: Create Apple Shortcuts

You'll create up to 4 shortcuts — one per command. The most important one is **Daily Briefing** (it combines everything).

### Shortcut: Daily Briefing (Recommended — Start Here)

1. Open the **Shortcuts** app on your iPhone
2. Tap **+** (top right) to create a new shortcut
3. Tap **"Add Action"**
4. Search for **"Get Contents of URL"** and add it
5. In the URL field, paste:
   ```
   https://us-central1-the-temple-f195e.cloudfunctions.net/siriDailyBriefing?token=YOUR_TOKEN_HERE&tz=YOUR_TIMEZONE
   ```
   Replace `YOUR_TOKEN_HERE` with the token you copied.
   Replace `YOUR_TIMEZONE` with your timezone (e.g., `America/New_York`, `Europe/London`, `America/Los_Angeles`).

   > **Tip:** The app's Siri Setup page auto-fills your timezone in the URLs. Copy directly from there.

6. Add another action: search for **"Get Dictionary Value"**
   - Set the key to: `text`
   - Set input to: "Contents of URL"
7. Add another action: search for **"Speak Text"**
   - It should automatically connect to the dictionary value output
8. Tap the shortcut name at the top and rename it to **"Daily Briefing"**
9. Done! Now say: **"Hey Siri, daily briefing"**

### Shortcut: Today's Schedule

Same steps as above, but use this URL:
```
https://us-central1-the-temple-f195e.cloudfunctions.net/siriSchedule?token=YOUR_TOKEN_HERE&tz=YOUR_TIMEZONE
```
Name it: **"Today's Schedule"**
Trigger: **"Hey Siri, today's schedule"**

### Shortcut: Today's Workout

```
https://us-central1-the-temple-f195e.cloudfunctions.net/siriWorkout?token=YOUR_TOKEN_HERE&tz=YOUR_TIMEZONE
```
Name it: **"Today's Workout"**
Trigger: **"Hey Siri, today's workout"**

### Shortcut: Nutrition Check

```
https://us-central1-the-temple-f195e.cloudfunctions.net/siriNutrition?token=YOUR_TOKEN_HERE&tz=YOUR_TIMEZONE
```
Name it: **"Nutrition Check"**
Trigger: **"Hey Siri, nutrition check"**

---

## What Siri Will Say — Examples

### Daily Briefing
> "You have 3 events today: 9:00 AM — Team standup. 12:30 PM — Lunch with Alex at Chipotle. 3:00 PM — Dentist appointment. Today's workout: Push Day: Bench Press, Overhead Press, Incline Dumbbell Press, Tricep Pushdowns, Lateral Raises. Nutrition so far: 1,450 of 2,200 calories, 98g of 150g protein. You have 750 calories and 52g protein remaining."

### Today's Schedule
> "You have 2 events today. 10:00 AM — Doctor's appointment at 123 Main St. 2:00 PM — Coffee with Sarah."

### Today's Workout
> "Today's workout: Pull Day: Deadlifts, 4 sets of 5 reps. Barbell Rows, 3 sets of 8 reps. Pull-ups, 3 sets of 10 reps. Face Pulls, 3 sets of 15 reps."

### Nutrition Check (no food logged yet)
> "You haven't logged any food yet today. Your daily targets are 2,200 calories, 150g protein, 250g carbs, and 73g fat."

### Nutrition Check (with food logged)
> "Today's nutrition: 1,800 of 2,200 calories, 120g of 150g protein. 400 calories and 30g protein remaining. Breakdown: Breakfast: 500 cal, Lunch: 750 cal, Snack: 550 cal."

---

## Tips for Best Results

### Make sure your data is synced
Siri reads from **Firestore (the cloud)**, not your local device. Before asking Siri, ensure the app has synced. The app syncs automatically when you make changes while online.

### Schedule your routines by day
For the workout command to know what to tell you, your routines need **days assigned** (e.g., Push Day = Monday/Thursday). Set this up in the Routines section of the app.

### Set nutrition goals
The nutrition command needs daily calorie and macro goals configured. Go to **Diet → Settings** in the app and set your targets.

### Use "Hey Siri" hands-free
These shortcuts work from the lock screen, while driving, via AirPods, or on Apple Watch. Just say the trigger phrase.

### Rename shortcuts for natural phrasing
You can name your shortcut anything — "What's my day look like", "Am I working out today", "How are my macros". Siri matches the shortcut name.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Unauthorized" error | Your token is invalid or missing. Regenerate it in Settings → Siri. |
| Siri says "no events" but you have some | Make sure the app synced to the cloud. Open the app and wait a moment. |
| Workout says "rest day" but you have one scheduled | Check that the routine has the correct days assigned in the Routines editor. |
| Exercise names show as "Unknown" | Re-sync the app — open it and make any small change to trigger a cloud write. |
| Wrong event times | Make sure your timezone parameter (`tz=`) in the URL matches your actual timezone. |
| Shortcut doesn't respond | Verify Cloud Functions are deployed: run `cd functions && npm run deploy`. |
| "Something went wrong" | Server error — check Firebase Console → Functions → Logs for details. |

---

## Managing Your Token

| Action | How |
|---|---|
| **View token** | Settings → Siri Integration |
| **Copy token** | Tap the copy icon next to the token |
| **Regenerate** | Tap "Regenerate" — invalidates the old one, update your shortcuts with the new token |
| **Revoke** | Tap "Revoke" — immediately disables all shortcuts, no token active |

---

## Architecture Reference

```
┌─────────────────────────────────────────────────────┐
│  iPhone                                             │
│  ┌───────────┐    ┌──────────────────────┐         │
│  │   Siri    │───→│   Apple Shortcut      │         │
│  └───────────┘    │  "Get Contents of URL" │         │
│                   └──────────┬───────────┘         │
└──────────────────────────────┼──────────────────────┘
                               │ HTTPS + token
                               ▼
┌──────────────────────────────────────────────────────┐
│  Firebase Cloud Functions (us-central1)              │
│  ┌────────────────────┐                              │
│  │ authenticateToken() │ ← validates token           │
│  └────────┬───────────┘                              │
│           ▼                                          │
│  ┌────────────────────┐                              │
│  │ Read Firestore     │ ← users/{uid}/data/*         │
│  │ • calendar events  │                              │
│  │ • routines         │                              │
│  │ • exercises        │                              │
│  │ • food log         │                              │
│  │ • diet settings    │                              │
│  └────────┬───────────┘                              │
│           ▼                                          │
│  Return { text: "..." }  → Siri speaks it            │
└──────────────────────────────────────────────────────┘
```

### Firestore Data Paths

| Path | Contents |
|---|---|
| `siriTokens/{token}` | `{ userId, createdAt }` — token lookup index |
| `users/{uid}/data/siriConfig` | `{ token, createdAt, timezone }` — user's token reference |
| `users/{uid}/data/calendar` | `{ events: [...] }` — calendar events |
| `users/{uid}/data/workout` | `{ routines: [...], exercises: [...] }` — workout data |
| `users/{uid}/data/diet` | `{ foodLog: [...], dietSettings: { goals: {...} } }` — nutrition data |
