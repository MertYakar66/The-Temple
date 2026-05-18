# Agent Verification Workflow — TheTemple

This document describes the three-party verification workflow used when an
agent's findings about the TheTemple codebase need to be audited for accuracy
before they are acted upon. Any agent joining mid-stream should read this file
first, along with `.claude/project-profile.md` and `AGENTS.md`.

The goal is simple: separate the **production** of findings from the
**verification** of findings, so that hallucinated, unsupported, or internally
inconsistent claims are caught before they drive a decision. TheTemple has
already been bitten by stale context — the `docs/audits/2026-05-08-cross-module-audit.md` pass
found that `AGENTS.md`'s "Known issues" entry for the AuthContext race
understated the bug (it missed the leaked-subscriber and reset-driven
empty-state-write failure modes), and that `AGENTS.md` §5 hedges `currentSession`
as "ephemeral ... in some contexts" when the code actually syncs it. The
workflow exists to catch exactly that kind of doc-vs-repo drift.

## 1. The three parties

**Executor — Claude Code CLI (terminal on the user's main computer).**
The agent with direct access to the local working tree. It reads files, runs
commands, runs `npm run lint` / `npm run build` / `npm test` (and, for
`functions/`, `npm run build` + `npm test`), and produces findings. It holds
ground truth for what the *local* repo contains: when a question is about what
a file contains, what a test does, or what a function returns, the executor's
reading is authoritative. The executor is the brain of the group — it decides
and acts.

**Verifier — the partner agent (this chat / the Claude Code cloud session).**
Audits the executor's output. Its job is not to redo the executor's work or
overrule it on facts. Its job is to check that every substantive claim is:

- backed by a `file:line` citation or quoted command output,
- actually supported by that evidence (not merely adjacent to it),
- internally consistent with the executor's earlier statements, and
- consistent with the project profile and foundation docs (`AGENTS.md`,
  `docs/`), treating those as evidence, not as infallible ground truth.

**Relay — the human.**
Routes messages between the two agents and resolves deadlocks. When the two
agents disagree and neither has decisive evidence, the human makes the call.

## 2. Repo-access model

**Mode B — verifier with independent check.** The verifier has read access to
the **GitHub remote** (`mertyakar66/the-temple`) via the GitHub MCP tools and
audits the executor's pasted output against it when doing so is cheap. Findings
are reported as, e.g., "Executor reports X; verified against
`functions/src/index.ts:141`, holds" or "...contradicts what that file shows."

Critical caveat specific to this project: **the verifier sees the GitHub
remote; the executor sees the local machine. These can differ.** Unpushed local
branches, uncommitted work, and stale local clones are invisible to the
verifier. When a claim depends on local-only state, the verifier must probe for
it rather than assume the remote reflects reality. The verifier's own cloud
sandbox checkout is itself potentially stale — the GitHub remote, not the
sandbox, is the verifier's reference.

Mode A — strict verifier (audit only the pasted text, ignore independent
access) — is the fallback if remote access is unavailable. The current
engagement runs in Mode B.

## 3. Authority model

The verifier never overrules the executor on a fact about the repo. If the
verifier suspects a factual claim is wrong, it probes for evidence; if the
evidence contradicts the claim, that is recorded as a **finding**, not an
overrule.

The verifier **does** override the executor on:

- logical inconsistencies between the executor's own statements across turns,
- claims unsupported by any evidence the executor has shown,
- suggested actions that would violate a hard invariant (`AGENTS.md`) or a
  recorded design decision (`docs/DECISIONS.md`).

Independent verification (Mode B) does not change this: when the verifier reads
a file directly and it contradicts the executor, that is still framed as a
finding for the relay to resolve, not a unilateral overrule.

## 4. Per-turn verification procedure

For each executor output, the verifier produces, in order:

1. **Verdict** — `PASS`, `FLAG`, or `PROBE-NEEDED`, with a one-line reason.
2. **Claim audit** — for each substantive claim: is there a citation or quoted
   output; does the evidence actually support the claim; is it consistent with
   earlier turns; is it consistent with the project profile.
3. **Hallucination flags** — explicit list of tells (see §5). An empty list is
   a good outcome.
4. **Next message to the executor** — only when the verdict is `PROBE-NEEDED`:
   the exact text for the relay to paste back, asking for the smallest
   sufficient evidence. One targeted probe beats five vague ones; a probe
   should take the executor well under a minute to run.
5. **Status read** — one to three sentences: what is resolved, what is still
   open, what the next forward step looks like.

## 5. Hallucination tells the verifier watches for

- Architectural claims with no grep or import evidence.
- Hedging language — "looks fine", "appears to", "should work" — with no quoted
  code.
- Plausible-sounding API names, signatures, or library behaviour that may not
  exist as stated.
- Numbers (line counts, test counts, assertion counts) presented without the
  command output that produced them.
- Claims about files the executor has not shown it read this session.
- Contradictions with earlier turns.
- Claims that match a stale brief (`AGENTS.md`, `docs/`) but not the current
  branch or current code (see §8 — doc-vs-repo drift).

## 6. Output format (verifier)

```
## Verdict
PASS | FLAG | PROBE-NEEDED — <one-line reason>

## Claim audit
| Claim (paraphrased) | Evidence shown? | Verdict | Concern |
|---|---|---|---|
| ... | yes / no / partial | ok / weak / contradicted / unverified | ... |

## Hallucination flags
- ... (empty list is fine and good)

## Next message to Claude Code
(omit this section if verdict is PASS)
<exact text for the relay to paste into the terminal>

## Status
<1-3 sentences>
```

## 7. Operating rules

- Do not invent file contents, line numbers, or behaviour that has not been
  seen or verified.
- Attribute clearly: "Executor reports X", not "X is the case" — unless the
  verifier has independently confirmed X, in which case say so explicitly.
- Do not speculate about repo state in a way the relay could mistake for
  verified fact.
- Once the executor produces direct contradicting evidence, the question is
  resolved — record it and move on; do not hold a position.
- Tie every concern, where possible, to a specific hard invariant (`AGENTS.md`)
  or recorded design decision (`docs/DECISIONS.md`) — those are the testable
  contract.
- No verification theater. If an output is clean, say `PASS` in one line and
  let the work continue.
- Keep probes short. A probe that takes the executor more than ~30 seconds to
  execute breaks the loop.

## 8. Project-specific anchors

When auditing claims about TheTemple, the verifier checks them against the
load-bearing invariants in `.claude/project-profile.md`, `AGENTS.md`, and
`docs/DECISIONS.md`:

- **Firestore rejects `undefined`.** Never write `{ field: undefined }` — omit
  the key or use `null`. Firebase JS SDK v12 defaults `ignoreUndefinedProperties`
  to `false`, so an `undefined` write throws. Any suggested change that writes
  a possibly-`undefined` field into a synced object is an automatic `FLAG`.
- **Null-emit on clear, not undefined.** When an optional editor field is
  emptied, write `null` (editor-controlled fields) or omit the key
  (non-editor pass-through fields). `setDoc({merge:true})` preserves keys whose
  value is `undefined`, so undefined-on-clear silently keeps the stale cloud
  value.
- **Date stamps are `YYYY-MM-DD` strings** via `getDateStamp()` /
  `parseDateStamp()` from `src/utils/date.ts`. Any `new Date().toISOString()
  .split('T')[0]` is a `FLAG` — it uses UTC and breaks for non-UTC users.
- **`Routine.dayOfWeek`: 0=Sun..6=Sat** (matches `Date.getDay()`). The Siri
  Cloud Functions rely on this; an off-by-one is a `FLAG`.
- **The 5-place persisted-slice rule (TheTemple's MIRROR contract).** Adding a
  persisted store slice means updating *all five*: the type definitions,
  `loadFromCloud`, `getCloudSyncData`, `resetStore`, and the reference-equality
  check in `AuthContext.startSync`. A change that touches one or two of these
  but not all five is a `FLAG` — missing any causes silent data loss or
  Firestore write storms.
- **`getCloudSyncData()` ships a lean projection.** `useStore.getCloudSyncData()`
  strips the static `exercises` array to `{id, name}`. Reintroducing the full
  list to the cloud doc is a `FLAG`.
- **Ephemeral state is not synced.** Adding ephemeral state (e.g. `currentView`,
  `selectedDate`, `newPRs`) to the `startSync` equality check causes Firestore
  write storms; leaving a new *persisted* slice out of it causes silent
  no-sync. Either mismatch is a `FLAG`.
- **Sync is debounced 2s; logout flushes immediately.** `firestoreSync.ts` sets
  `SYNC_DEBOUNCE_MS = 2000`. On logout `AuthContext` flushes via the
  non-debounced `saveWorkoutData` / `saveDietData` / `saveCalendarData`. A
  change that removes the logout flush is a `FLAG` (users lose data).
- **Soft-delete for calendar events.** `CalendarEvent.isDeleted`, never
  hard-delete; filter on read. A hard-delete path is a `FLAG`.
- **One Firestore doc per module per user.** Paths: `users/{uid}/data/workout`,
  `.../diet`, `.../calendar`, `.../siriConfig`; lookup index `siriTokens/{token}`.
  Touching any path must also update `firestoreSync.ts`, `firestore.rules`,
  `functions/src/index.ts`, and `scripts/backup.cjs` / `scripts/restore.cjs` —
  a partial update is a `FLAG`.
- **Persisted store version migrations** live in the store options
  (`version`, `migrate()`). A change to persisted shape with no version bump +
  migration is a `FLAG`.
- **No `firebase-admin` in frontend deps.** It belongs only to `functions/` and
  `scripts/`. Reintroducing it to the root `package.json` is a `FLAG`.
- **Auth flow goes through `AuthContext` only.** A `signIn` / `signOut` /
  `onAuthStateChanged` call outside `src/contexts/AuthContext.tsx` is a `FLAG`.
- **Decision-layer files.** Changes touching `src/contexts/AuthContext.tsx`,
  `src/lib/firestoreSync.ts`, the three Zustand stores (`useStore`,
  `useDietStore`, `useCalendarStore`), or `functions/src/index.ts` are expected
  to be accompanied by the full `npm run lint && npm run build && npm test`
  (and `npm run build && npm test` inside `functions/` when that package
  changed), not a single targeted check.
- **Branch reality.** `main` is the live trunk and is not stale. Feature
  branches are named `claude/<topic>-<suffix>` and are not merged to `main`
  unless the relay asks. A claim must be checked against the branch the
  executor is actually on — a finding true on one branch may be false on
  another. `docs/audits/2026-05-08-cross-module-audit.md` is the current open-findings list;
  unfixed items there (C-1, C-3, C-4, H-1…) are expected, not regressions.

These anchors are evidence, not ground truth. If the executor shows the repo
has diverged from `.claude/project-profile.md` or the foundation docs, the repo
wins and the divergence is itself a finding worth surfacing.
