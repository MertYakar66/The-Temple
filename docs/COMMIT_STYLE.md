# Commit & PR Style

Practical convention for commit messages, branch names, and PR bodies. Codifies the shape
the audit-batch commits already use; future commits should match.

The audit batch commits in `git log` (Batches 1 and 2, plus the e2e harness) are the
reference style — read a few before writing your own.

## Commit message

### Subject

```
type(scope): concise summary under 70 chars
```

- Lowercase type, lowercase scope, no trailing period.
- Imperative mood: "Add", "Fix", "Update" — not "Added" / "Fixes".
- 70 chars is the soft cap; treat as a goal, not a hard limit.

### Body

```
Changed:
- bullet list of concrete changes, one per file or logical edit

Why:
- reason for the change, anchored to a finding / decision / batch where applicable
- include behavior change (read-path traces, before/after) when the change is non-obvious

Tested:
- npm run lint, npm run build, npm test results
- any manual verification (e.g. e2e is fixme'd, store-layer test added)

Tried but rejected: (only when relevant)
- alternative approach considered and why it was not taken

Unresolved: (only when relevant)
- TODOs / side findings flagged for a future batch

AI handoff: (one line, optional)
- pointer for the next agent picking up the thread
```

Sections that are empty get omitted entirely. The minimum useful body is `Changed`, `Why`,
`Tested`.

### Types

| Type | Use for |
|---|---|
| `feat` | New user-visible feature |
| `fix` | Bug fix |
| `audit` | Audit-batch change (a fix made under the structured audit, not random) |
| `refactor` | Behavior-preserving structural change |
| `test` | Test-only change |
| `docs` | Documentation only |
| `chore` | Tooling, dependencies, gitignore, etc. |
| `build` | Vite / TypeScript / Tailwind config |
| `ci` | (Reserved — no CI today) |
| `e2e` | Playwright harness change |

### Scopes

Pick the most specific scope that fits the change.

| Scope | Covers |
|---|---|
| `store` | `src/store/*` — workout/diet/calendar Zustand actions |
| `auth` | `src/contexts/AuthContext.tsx`, `src/lib/firebase.ts`, `src/lib/authErrors.ts` |
| `sync` | `src/lib/firestoreSync.ts` |
| `calendar` | `src/pages/Calendar*`, `src/components/calendar/*`, `src/utils/calendar.ts`, `src/types/calendar.ts` |
| `diet` | `src/pages/Diet*`, `src/store/useDietStore.ts` |
| `workout` | `src/pages/Workout*`, `src/components/workout/*`, `src/store/useStore.ts` |
| `blocks` | `src/pages/Blocks.tsx`, `src/components/blocks/*`, `src/data/minMaxProgram.ts` |
| `onboarding` | `src/pages/Onboarding.tsx`, `src/components/onboarding/*` |
| `siri` | `src/lib/siriToken.ts`, `src/pages/SiriSetup.tsx` |
| `functions` | `functions/**` |
| `scripts` | `scripts/**` |
| `docs` | Documentation files |
| `infra` | Configuration, gitignore, hooks, tooling |
| `e2e` | Playwright harness, `tests/e2e/**` |

If the change spans scopes, pick the dominant one or use `infra`. Don't write
`store/sync/auth` — pick one and explain in the body.

## Reference example

```
audit(store): emit null for cleared CalendarEvent optional fields in editor

Changed:
- CalendarEventEditor.handleSave: write null for cleared editor-controlled
  fields (location, locationPlaceId, videoCallUrl, notes, travelTime,
  recurrenceRule). Inner recurrenceRule fields use omit-pattern.
- CalendarEvent type: location/locationPlaceId/videoCallUrl/notes/organizer
  widened to string|null; travelTime number|null; recurrenceRule
  RecurrenceRule|null.
- getGoogleMapsUrl: placeId param widened to string|null|undefined.

Why:
- setDoc({merge:true}) preserves keys whose value is undefined, so
  {field:undefined} on clear silently kept the prior value. addEvent rejected
  outright. Read paths all use truthy/optional-chain so null/undefined are
  display-equivalent — see read-path trace in commit b484873.

Tested:
- npm run lint clean. npm run build clean. npm test 38/38.
- e2e equivalent (calendar-location-roundtrip.spec.ts) is fixme'd; store-layer
  invariant test added in a follow-up commit.

AI handoff:
- Pattern: editor-controlled → null; pass-through → omit-key. Documented in
  docs/DATA_POLICY.md §1, §3.
```

## Submitting via HEREDOC

When committing through Bash, always pass the message via HEREDOC:

```sh
git commit -m "$(cat <<'EOF'
type(scope): subject

Body...

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

This preserves blank lines and avoids shell-escaping problems. The
`Co-Authored-By` trailer signals which model produced the commit.

## Branch naming

```
claude/<topic>-<suffix>
```

- `<topic>` is short and dash-separated (`audit-batch3-diet-ux`,
  `repo-foundation-pass`).
- `<suffix>` is a random alphanumeric tag when the topic alone is ambiguous;
  omit otherwise.
- Direct pushes to `main` are forbidden. Merge via PR or `git merge --no-ff`
  (the `--no-ff` preserves the batch grouping in `git log --graph`, which
  matters for audit traceability).

Active branches at time of writing:
- `main` — shipped state.
- `claude/setup-playwright-e2e` — e2e harness; not yet merged.
- `claude/repo-foundation-pass` — this branch.

## Pull request body

PRs are rare in this repo (most batches merge locally via `--no-ff`). When you
do open one, the body matches the commit body shape:

```markdown
## Summary
1-3 bullets describing what landed.

## Why
Anchor to the audit batch / finding / decision.

## Tested
- lint, build, test pass.
- Specific test coverage notes.
- E2E status if relevant.

## Tried but rejected (optional)
- Alternative approach considered and why.

## Unresolved (optional)
- Side findings / TODOs.

## Test plan (when human review wants to reproduce)
- Repro steps for each behavior change.
```

Don't open a PR unless the user explicitly asks.

## When to update this file

- A new commit type or scope is regularly needed (add to the table).
- The submission ritual changes (e.g. Co-Authored-By format).
- Branch convention changes.
- Human review process changes (e.g. CI gate added).
