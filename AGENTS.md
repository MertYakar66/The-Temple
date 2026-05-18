# AGENTS.md

**The canonical agent context for this repo is [`CLAUDE.md`](CLAUDE.md). Read
it first.** It has the stack, architecture map, critical files, the boot flow,
the 10 hard invariants, conventions, and a guide to `docs/`.

This file is a thin pointer, kept for cross-tool compatibility — Cursor, Aider,
Codex, and other agents that look for `AGENTS.md`. There is one source of
truth, and it is `CLAUDE.md`.

## The non-negotiables (abridged — full detail and the other invariants in `CLAUDE.md`)

- **Never write `{ field: undefined }` to Firestore** — omit the key or use
  `null`. On clear, null-emit (don't leave `undefined`).
- **Date stamps are `YYYY-MM-DD`** via `getDateStamp()` from `src/utils/date.ts`
  — never `new Date().toISOString().split('T')[0]`.
- **Adding a persisted store slice = update 5 places**; **changing a Firestore
  path = update 5 places.** See `CLAUDE.md` ("the two 5-place invariants").
- **Calendar events are soft-deleted** (`isDeleted`), never hard-deleted.
- Develop on a `claude/<topic>-<suffix>` branch; **never push to `main`**; no
  PRs unless asked.
- Pre-finish gate: `npm run lint && npm run build && npm test` (plus
  `cd functions && npm run build && npm test` if `functions/` changed).

Everything else — the full 10 invariants, critical files, the sync model,
runbooks, slash commands — is in `CLAUDE.md`, `.claude/commands/`, and `docs/`.
