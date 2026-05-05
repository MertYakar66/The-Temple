# Data Policy

The hard invariants that bind every store, page, component, and Cloud Function. Each one
exists for a specific reason — break it and the breakage is silent and remote (data loss
on the next sync, wrong-day records for non-UTC users, write storms, etc.).

`AGENTS.md` lists the invariants tersely. This file is the rationale + edge cases. When the
two disagree, this file is authoritative.

## 1. Firestore rejects `undefined`

**Rule:** never write `{ field: undefined }` to Firestore. Either omit the key or use `null`.

**Why:** Firebase v9+ rejects `undefined` outright on new-doc writes (`addDoc` / first
`setDoc`). Worse, `setDoc({merge: true})` *preserves* keys whose value is `undefined`:
the prior value silently survives the write. So an `undefined`-on-clear from an editor field
either rejects the entire write or leaves a stale value in the cloud doc — both bad.

**How to apply:**
- Editor-controlled fields that the user can clear → emit `null`. See `b484873`
  (CalendarEvent location/notes/...) and `90ade3a` (ExerciseGoal targetRIR/targetSets) for
  reference shape.
- Pass-through fields the editor doesn't control → omit the key. The merge will preserve any
  prior value, which is what we want.
- New-doc writes → never include any `undefined` value at any depth. Build the object
  conditionally.

**Tests:** `src/store/useStore.test.ts` and `src/store/useCalendarStore.test.ts` walk
`getCloudSyncData()` recursively for any `undefined` paths.

## 2. Date stamps are `'YYYY-MM-DD'` strings, produced by `getDateStamp()`

**Rule:** any "what day is it" string in storage uses `getDateStamp(date)` from
`src/utils/date.ts`. Banned: `new Date().toISOString().split('T')[0]`.

**Why:** `toISOString` yields the date in UTC. For a user in `America/Los_Angeles` at
8 PM PST on Tuesday, `toISOString().split('T')[0]` returns Wednesday — and the food log /
weight entry / streak counter records the wrong day. `getDateStamp` uses `date-fns format`
which respects the local timezone.

**How to apply:**
- All store actions that key by date → `getDateStamp(date)`.
- Range filters → `isDateStampInRange(stamp, start, end)`.
- Calendar events store full ISO datetimes (`startDate`, `endDate`), not date stamps —
  recurrence math needs the time-of-day component.
- Cloud Functions are server-side and cannot use the client's `getDateStamp`. They use
  `Intl.DateTimeFormat` with the `?tz=` query param. The fallback path at
  `functions/src/index.ts:99` *currently uses* the banned pattern when `tz` is missing — that's
  Batch 5 territory, not a license to do this elsewhere.

**Active violations** (will be cleaned up — don't add more):
- `src/store/useDietStore.ts:441` and `:494` — Batch 3.
- `src/pages/Settings.tsx:211` — data-export filename. Batch 6.
- `functions/src/index.ts:99` — Cloud Functions tz fallback. Batch 5.

## 3. Null-emit on clear, omit on pass-through

**Rule:** when the user clears an optional field in an editor, the store action writes
`null`. When the editor passes a field through that it doesn't own, the action omits the
key entirely.

**Why:** `setDoc({merge: true})`. `null` writes the cleared state to the cloud doc; omitting
the key preserves whatever was there. Both are useful — but the editor must pick the right
one for each field.

**Reference shape** (from `b484873`):
- `CalendarEventEditor` builds the event object with explicit `null`s for fields the user can
  clear (`location: locationInput.trim() || null`).
- For inner objects whose shape is replaced wholesale (`recurrenceRule`), use omit-pattern
  inside the object — `setDoc({merge:true})` only deep-merges top-level keys.
- For fields the editor doesn't own (`organizer` on a calendar event), build the object
  with a conditional spread (`...(existingEvent.organizer ? { organizer: ... } : {})`).

## 4. Soft-delete on calendar events

**Rule:** `useCalendarStore.deleteEvent` flips `isDeleted: true`; never hard-deletes. All
read sites filter `events.filter(e => !e.isDeleted)`.

**Why:** soft-delete preserves the event in the cloud doc, so other devices syncing later
see the deletion as a state transition rather than a missing key. It also enables
"recently deleted" recovery if we ever add it.

**How to apply:**
- New read sites must filter `isDeleted` — easy to forget.
- Series deletion: `deleteEventSeries` flips both the master (`seriesMasterId`) and any
  exception-instance children.
- Hard-delete is acceptable on logout / account deletion paths (we drop the whole doc), and
  in the e2e cleanup helper (we want the test user's calendar empty between runs).

## 5. Sync-slice equality checks in `AuthContext.startSync`

**Rule:** `AuthContext.startSync` subscribes each Zustand store with a callback that returns
early if all relevant slices are reference-equal between `state` and `prevState`. Adding a
new persisted slice means adding it to the equality check.

**Why:** Zustand fires the subscriber on **every** state change, including ephemeral UI state
(`currentView`, `selectedDate`, `newPRs`, `currentSession` in some flows). Without the early
return, paging through the calendar caused a Firestore write per click. The fix landed in
`a0b971d`; the discipline is to keep extending the check as the stores grow.

**How to apply:**
- New persisted slice (e.g. `events`) → add to the check (`state.events === prevState.events`).
- New ephemeral slice (e.g. a UI flag) → leave it out, otherwise you cause write storms.
- New computed/derived state — usually ephemeral; case-by-case.

## 6. Lean cloud projection in `useStore.getCloudSyncData()`

**Rule:** `useStore.getCloudSyncData()` strips the static `exercises` array down to
`{id, name}` only.

**Why:** the full exercise objects (with descriptions, instructions, tips) are huge and
identical for every user — they live in `src/data/exercises.ts` and are bundled with the
app. Shipping the full array to Firestore would 10x the workout doc size for no value.
The lean projection is enough for Cloud Functions to look up exercise names by id; the
client merges the full data back from `defaultExercises` on `loadFromCloud`.

**How to apply:**
- Don't reintroduce the full `Exercise` shape into the cloud projection.
- If you add a custom-exercise feature later, custom exercises do need the full payload —
  but the static defaults stay lean.

## 7. Persisted vs ephemeral state

Each store has a `partialize` (or implicit one through which slices are read at sync time)
that decides what's persisted to localStorage and what's shipped to Firestore. Three
categories:

| Category | Persist to localStorage? | Ship to Firestore? | Examples |
|---|---|---|---|
| Domain data | Yes | Yes | `workoutSessions`, `routines`, `events`, `foodLog` |
| Settings | Yes | Yes | `dietSettings`, `calendarSettings`, `user` |
| UI / ephemeral | No (or yes, but not synced) | No | `currentView`, `selectedDate`, `newPRs` |

`getCloudSyncData()` returns only the first two. The persist middleware decides
localStorage. If you add state that should reload across page refresh but not sync to other
devices, persist it locally but exclude from `getCloudSyncData()`.

## 8. Sync is debounced 2 s; logout flushes immediately

**Rule:** `firestoreSync.ts` debounces writes by 2 s. On logout (and account deletion),
`AuthContext` flushes via the non-debounced `saveWorkoutData` / `saveDietData` /
`saveCalendarData` before signing out.

**Why:** debouncing lets a burst of edits coalesce into one cloud write — important for
calendar drag-to-create and rapid set-logging. But debouncing on logout drops pending
writes if the user signs out mid-debounce (timer cleared). The flush is required.

**Order matters:** flush *before* `signOut`. Once `signOut` returns, the rules require
auth and the writes fail.

## 9. Persisted store version migrations

**Rule:** if you change persisted shape, bump `version` in the `persist` options and write a
`migrate(persistedState, version)` that transforms older shapes forward.

**Why:** users have stale localStorage from older app versions. Without a migration, the
store reads the old shape into the new types and silently misbehaves (TypeScript can't help
at runtime).

**Reference:** `useStore` is at `version: 2`. The `migrate` forces `routines` back to
`defaultRoutines` for v0/v1 because old localStorage had Turkish/legacy routine names from
an even earlier shape.

## 10. One Firestore doc per module per user

**Rule:** Firestore layout is fixed:
```
users/{uid}/data/workout      ← useStore.getCloudSyncData()
users/{uid}/data/diet         ← useDietStore.getCloudSyncData()
users/{uid}/data/calendar     ← useCalendarStore.getCloudSyncData()
users/{uid}/data/siriConfig   ← { token, createdAt, timezone }
siriTokens/{token}            ← { userId, createdAt }   (top-level lookup)
```

**Why:** simple, fast, and matches the three-store partition. `siriTokens` is a top-level
index because Cloud Functions need to look up `token → userId` without knowing the uid.

**How to apply:**
- Touching the layout: update `firestoreSync.ts`, `firestore.rules`,
  `functions/src/index.ts`, and `scripts/backup.cjs` / `scripts/restore.cjs` together.
  Missing any of these breaks reads, security, Siri, or backups.

## 11. Cloud Functions bypass Firestore rules via Admin SDK

**Rule:** `firestore.rules` only let users read/write their own subtree. Cloud Functions
use Admin SDK and bypass rules entirely.

**Why:** Cloud Functions need to read `siriTokens/{token}` to resolve a token without an
authenticated user (the Apple Shortcut is unauthenticated from Firebase's POV — the token
*is* the auth). Admin SDK is how that works.

**Implication:** any new Cloud Function endpoint can read or write anywhere in Firestore
without rule enforcement. Treat Cloud Function code with the same care as you'd treat
admin endpoints elsewhere — input validation matters.

## When to update this file

- A new invariant is established (e.g., a new pattern for handling a class of bug).
- An invariant changes (e.g., we move off `setDoc({merge:true})` and the null-emit rule
  evolves).
- A new active violation is found in code (add to the relevant section).
- A violation is fixed (remove from "active violations").
- A reference commit is identified for a pattern (anchor it).

If a new invariant lacks a clear "why", don't add it — invariants without rationale rot.
