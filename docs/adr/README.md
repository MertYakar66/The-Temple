# Architecture Decision Records (ADR)

An ADR captures one significant architectural decision: its context, the
decision itself, and the consequences. An ADR is immutable once accepted —
supersede it with a new ADR rather than editing it.

## Where decisions live in this repo

The Temple already has a **consolidated decision log**: `docs/DECISIONS.md`
(entries D-1 … D-11 — three-store design, localStorage persistence,
AuthContext-managed sync, the 2 s debounce, soft-delete, the null-emit pattern,
lean cloud projection, the e2e approach, Siri token auth, the
no-backend-server stance).

`docs/DECISIONS.md` is **not** being split into per-file ADRs — it is the
canonical record of the decisions made so far. Treat it as ADRs 0001–0011.

## Going forward

Record each **new** significant decision as its own file here:

```
docs/adr/NNNN-short-title.md
```

`NNNN` is the next zero-padded number. Since `docs/DECISIONS.md` covers
D-1 … D-11, the next new ADR is `0012-...`.

### Template

```markdown
# NNNN. <Short title>

- **Status:** Proposed | Accepted | Superseded by ADR-XXXX
- **Date:** YYYY-MM-DD

## Context
What forces are at play? What problem is being solved?

## Decision
What was decided, in active voice.

## Consequences
What becomes easier, what becomes harder, what is now constrained.
```

## What counts as "significant"

Anything a future agent must not silently undo: a new hard invariant, a
data-model change, a sync-model change, a new external dependency, or a
reversal of an existing decision in `docs/DECISIONS.md`. Day-to-day code
choices do not need an ADR.
