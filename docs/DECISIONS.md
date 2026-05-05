# Architectural Decisions

One entry per significant architectural decision. Each entry is concise — the goal is to
capture the *why* so a future agent can judge whether the decision still holds, not to
re-explain the whole design.

When you make a decision worth recording, add it here with a date and a one-sentence
rationale. When a prior decision is reversed, mark the original as superseded and link the
new one.

---

## D-1 — Three Zustand stores instead of one

**Date:** before the audit. Established by `useStore` / `useDietStore` / `useCalendarStore`.

**Decision:** workout, diet, and calendar each get their own Zustand store. They are
*independent* — actions in one don't touch the others; subscriptions are per-store.

**Why:**
- Three Firestore docs (`users/{uid}/data/{workout,diet,calendar}`) match three stores
  one-to-one. Sync subscriptions stay simple — one Zustand subscriber per store, one debounced
  Firestore write per store.
- `localStorage` quota is per-key. Three smaller persist keys (`workout-tracker-storage`,
  `diet-tracker-storage`, `calendar-storage`) hit quota less often than one giant blob.
- Reasoning about state changes is cheaper when subscriber callbacks only fire for relevant
  changes.

**Trade-off:** code that touches more than one module (e.g. dashboard widgets) has to import
multiple stores. Acceptable.

---

## D-2 — Persistence via Zustand `persist` to localStorage

**Date:** before the audit.

**Decision:** Zustand `persist` middleware on each store, key per store, no IndexedDB.

**Why:** localStorage is synchronous and survives reload. Stores rehydrate before the first
React render, which means the UI never flashes empty content while waiting for an async
load. IndexedDB would require an async hydration step and a "loading" state in the UI.

**Trade-off:** localStorage quota (~5 MB per origin in most browsers). The lean
`getCloudSyncData()` projection (D-7) keeps payloads inside this; large media uploads would
need to move off localStorage.

---

## D-3 — AuthContext-managed sync (not in-store)

**Date:** before the audit.

**Decision:** sync wiring lives in `src/contexts/AuthContext.tsx`. The stores expose
`loadFromCloud(data)` / `getCloudSyncData()` / `resetStore()` but don't subscribe to anything
themselves.

**Why:** the lifecycle is auth-bound — login starts sync, logout stops it, account deletion
revokes it. Putting the lifecycle in a React context means it's tied to the React tree
(unmounts cleanly) and to the auth state (one source of truth for "am I signed in").

**Trade-off:** `AuthContext.startSync` has to enumerate the slices to compare for equality
checks (see `DATA_POLICY.md` invariant 5). Adding a new persisted slice requires editing
this file. Documented; live with it.

**Status:** the controller has a known cancellation-unsafe race (see `AUDIT_STATE.md`).
Decision still holds; race fix is a refinement, not a re-architecture.

---

## D-4 — 2-second debounce on cloud writes

**Date:** efficiency pass `a0b971d`.

**Decision:** `firestoreSync.SYNC_DEBOUNCE_MS = 2000`. Per-store independent timers.

**Why:**
- Calendar drag-to-create and rapid set-logging produce bursts of state changes. Debouncing
  coalesces them.
- 2 s is short enough that a user who navigates away or refreshes within seconds usually
  flushes (the unmount-time flush in logout covers the explicit case; the timer's
  natural firing covers idle).
- Independent timers per store mean a calendar burst doesn't block a workout save.

**Trade-off:** if the browser tab is killed within 2 s of a write, the write is lost. The
risk is bounded — it would need to land within the debounce window of an unflushed save,
and the user would have to kill the tab rather than navigate.

**Reference:** `SYNC_DEBOUNCE_MS` in `src/lib/firestoreSync.ts`. Equality-check coupling
in `startSync` in `src/contexts/AuthContext.tsx`.

---

## D-5 — Soft-delete for calendar events

**Date:** before the audit. Established by `CalendarEvent.isDeleted`.

**Decision:** `useCalendarStore.deleteEvent` sets `isDeleted: true`; never removes from the
array. All reads filter `e => !e.isDeleted`.

**Why:** with multi-device sync (in principle — currently single-user but devices), soft
deletes propagate as state transitions. A hard delete from device A wouldn't reach device B
if B was offline — its local copy still has the event, and the next sync would *re-add* it
to the cloud doc.

**Trade-off:** the events array grows monotonically. There's no compaction yet. Acceptable
for a personal app — a heavy user adds maybe 1000 events/year. Revisit if the calendar doc
ever pushes against Firestore's 1 MB document limit.

**See also:** `DATA_POLICY.md` §4.

---

## D-6 — Null-emit on clear (not omit-on-clear)

**Date:** Batch 1. Established by `b484873`.

**Decision:** when the user clears an optional editor field, the store action writes `null`.
Omit-the-key is reserved for fields the editor doesn't own.

**Why:** `setDoc({merge:true})` preserves keys whose value is `undefined`, which means an
omit-on-clear silently keeps the prior value. `null` writes the cleared state explicitly.
We considered switching cloud writes to `setDoc({merge:false})` to avoid this, but that
would require shipping the full doc on every change, killing partial-update efficiency.

**Alternative considered:** "clean" the payload before write (walk and strip undefineds).
Rejected because:
- it relocates the discipline from the editor (where the type system can help) to a
  pre-write sanitizer (silent if it ever drops a key it shouldn't).
- it produces the same semantics as omit-on-clear, which has the merge bug.

**See also:** `DATA_POLICY.md` §1, §3. Reference: `b484873`.

---

## D-7 — Lean cloud projection — strip static `exercises` to `{id, name}`

**Date:** efficiency pass `a0b971d`.

**Decision:** `useStore.getCloudSyncData()` projects `exercises` to `{id, name}`.

**Why:**
- `defaultExercises` (`src/data/exercises.ts`) is bundled with the app. Every user's client
  has the full data; shipping it to Firestore would 10x the workout doc.
- Cloud Functions only need `name` for Siri text composition. They build a `Map<id, name>`
  on demand.

**Trade-off:** if a "custom exercise" feature ever ships, custom exercises *do* need full
payloads in cloud. The projection rule would become "lean for built-ins, full for custom".
Today everything is built-in — keep the rule simple.

**See also:** `DATA_POLICY.md` §6.

---

## D-8 — E2E tests run against the production build, not dev

**Date:** e2e harness setup `35cb018`.

**Decision:** `playwright.config.ts` `webServer.command = 'npm run build && npx vite preview'`.

**Why:** React 18 Strict Mode in dev intentionally double-invokes effects. The
`AuthContext.onAuthStateChanged` callback begins with `resetStore()`, so the second invocation
wipes any local writes that happened between the two mounts — every test fails for a reason
unrelated to the invariant under test. Production matches what users at `thetemple.web.app`
actually run.

**Trade-off:** ~3-5 s build time on a cold run. Subsequent runs reuse the running preview
(`reuseExistingServer: !process.env.CI`). Acceptable.

**Reversal trigger:** when the AuthContext race is fixed (it's the deeper bug here — Strict
Mode just exposed it), revert `webServer.command` to `npm run dev` for faster local
iteration. See the `webServer.command` comment in `playwright.config.ts` and
`tests/e2e/README.md`.

---

## D-9 — Test users live in the production Firebase project

**Date:** e2e harness setup.

**Decision:** the `e2e-test@thetemple.test` test user is in `the-temple-f195e` (the
production project), not a separate staging project.

**Why:** the product is single-owner. Spinning up a staging Firebase project would 2x
infrastructure and need to be kept in sync with production rules / function deploys / data
shape. The cost/benefit doesn't pencil for one user.

**Trade-off:** destructive scripts (backup, restore, account deletion) operate against the
same project as the live data. Discipline: never run destructive scripts as the test user
without thinking; never run them as the owner's UID for testing.

**Reversal trigger:** if the product ever adds users beyond the owner, this needs to flip.
Until then it's intentional.

---

## D-10 — Token-based Siri auth (not OAuth)

**Date:** Siri integration `99a8538`.

**Decision:** Siri Cloud Functions use a per-user random-string token, validated server-side
against `siriTokens/{token}`. No Firebase ID tokens.

**Why:** Apple Shortcuts can't run an OAuth flow. The `Get Contents of URL` action only
supports static headers and query params. A long-lived bearer token is the only auth that
fits the Shortcut's capability surface. The trade-off is leaked-token risk; mitigated by:
- regex-validated format (`^[A-Za-z0-9]{8}-...{4 segments}$`),
- one token per user, one user per token,
- in-app revoke / regenerate UI,
- Cloud Functions are read-only-ish (compose Siri text from data); a leaked token can't
  delete or write user data.

**See also:** `firestore.rules` (`siriTokens/{token}` rules + `hasOnly` validation),
`src/lib/siriToken.ts`, `functions/src/index.ts:authenticateToken`.

---

## D-11 — No backend server; Firestore + Cloud Functions only

**Date:** before the audit.

**Decision:** all client → cloud is direct (Firebase SDKs). Server-side logic lives in
Cloud Functions, invoked only by the Apple Shortcut.

**Why:** the product is a PWA for one owner. A backend would add an ops surface (running,
deploying, logging, monitoring) and a failure mode (the backend is down) without any
feature it would enable.

**Trade-off:** business logic that needs to be authoritative (e.g. server-side recurrence
expansion for Siri) lives in Cloud Functions, which can drift from client logic. Batch 5
is exactly this drift — the client has recurrence expansion in `src/utils/calendar.ts`; the
Cloud Function doesn't, and reads stored events raw.

**Reversal trigger:** unlikely. If we ever need server-side validation or push delivery for
invitations, Cloud Functions can absorb that.

---

## When to update this file

- A new architectural decision is made (one entry).
- A prior decision is reversed (mark superseded; add a new entry; cross-link).
- The trade-off in an entry changes materially (rare; usually means a new entry).

Don't:
- Edit the rationale of a past decision because the context changed. Add a new entry; the
  history matters.
- Use this file for invariants — those go in `DATA_POLICY.md`.
- Use this file for project-state — that's `PROJECT_STATE.md`.
