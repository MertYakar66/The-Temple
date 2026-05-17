# Repo Reorganization — Execution Report

**Branch:** `claude/repo-reorg-20260517-084217`
**Base:** `main` @ `10f21a0`
**Date:** 2026-05-17
**Phases 2 (Execute) + 3 (Report): complete.**
**Plan:** `docs/reorg/PLAN.md`.

Phase 2 executed commits C2–C12 from the plan. C4 was skipped per decision D-1.
Zero functional change: every commit passed `lint` + `build`, and `test` passed
at the C7 and C12 checkpoints.

## Commits

| Commit | SHA | Summary |
|---|---|---|
| C1 | `6a71fc3` | docs(reorg): propose repo reorganization plan |
| C2 | `5211515` | docs: archive 2026-05-08 audit under docs/audits/ |
| C3 | `b8728e9` | docs: move SIRI_INTEGRATION.md into docs/ |
| C4 | — | *skipped (D-1 — no kebab rename of the existing docs)* |
| C5 | `bf34b92` | docs: add runbooks under docs/runbooks/ |
| C6 | `45a53ed` | docs: add ADR scaffold under docs/adr/ |
| C7 | `c5a5afa` | docs: add docs/sync-model.md |
| C8 | `d6c5aa9` | chore(claude): add .claude/commands/ slash commands |
| C9 | `e5b9f72` | docs: rewrite CLAUDE.md as the canonical agent front door |
| C10 | `72859a6` | docs: reduce AGENTS.md to a pointer to CLAUDE.md |
| C11 | `48001c1` | docs: refresh README.md structure and cross-links |
| C12 | *(this commit)* | docs(reorg): add execution report |

## Diff summary

### Moves (2) — all `git mv`, history preserved
- `SIRI_INTEGRATION.md` → `docs/siri-integration.md` (C3)
- `docs/AUDIT_2026-05-08.md` → `docs/audits/2026-05-08-cross-module-audit.md` (C2)

### Deletions (0)
None. `public/vite.svg` was evaluated and kept — it is the live favicon
(`index.html:5`). No other scaffold candidate (`src/App.css`,
`src/assets/react.svg`, root scratch files) existed.

### New files (14)
- `docs/reorg/PLAN.md` (C1), `docs/reorg/REPORT.md` (this file)
- `docs/audits/README.md`, `docs/adr/README.md`, `docs/sync-model.md`
- `docs/runbooks/`: `add-persisted-slice.md`, `touch-firestore-path.md`,
  `release.md`, `rotate-siri-token.md`
- `.claude/commands/`: `audit.md`, `add-slice.md`, `touch-firestore-path.md`,
  `preflight.md`, `sync-debug.md`

### Rewritten in place (3) + reference updates (3)
- `CLAUDE.md` — rewritten as the canonical front door (C9, isolated commit).
- `AGENTS.md` — reduced from 144 lines to a 26-line pointer (C10).
- `README.md` — Project Structure block fixed; Documentation links added (C11).
- Reference updates: `.claude/verification-workflow.md` (2 audit-path refs),
  `functions/src/sumMacros.test.ts` (1 comment ref), `docs/MODULES.md` (1 ref).

### Deferred / not done
- **C4 — kebab-case rename of the 11 existing docs.** Skipped per D-1; the
  `UPPERCASE_SNAKE` docs are kept, new files are kebab-case — `docs/` is
  intentionally mixed-case.
- **`tests/e2e → e2e/`** — not done; e2e is already consolidated and the move
  would edit the `playwright.config.ts` contract.
- **Root ≤ 15 entries** — not achievable (16 root files are tooling-contract
  configs). Root went 21 → 20 tracked files (only `SIRI_INTEGRATION.md` left).

## Final structure (changed subtrees)

```
CLAUDE.md          ← canonical agent front door (rewritten)
AGENTS.md          ← thin pointer to CLAUDE.md
README.md          ← refreshed

.claude/
├── commands/      ← NEW: audit, add-slice, touch-firestore-path, preflight, sync-debug
├── project-profile.md
└── verification-workflow.md

docs/
├── ARCHITECTURE.md  AUDIT_STATE.md  CLAUDE_CODE_WEB.md  COMMIT_STYLE.md
├── DATA_POLICY.md  DECISIONS.md  MODULES.md  PROJECT_STATE.md
├── ROADMAP.md  TESTING.md          ← 10 living docs, unchanged (UPPERCASE)
├── siri-integration.md             ← moved from repo root
├── sync-model.md                   ← NEW
├── adr/README.md                   ← NEW
├── audits/
│   ├── README.md                   ← NEW
│   └── 2026-05-08-cross-module-audit.md   ← moved from docs/
├── reorg/
│   ├── PLAN.md
│   └── REPORT.md                   ← this file
└── runbooks/                       ← NEW (add-persisted-slice, touch-firestore-path,
                                       release, rotate-siri-token)
```

## Verification log (all 2026-05-17)

Zero-functional-change was enforced commit-by-commit.

| After | `lint` | `build` | `test` |
|---|---|---|---|
| C2 | PASS | PASS | — |
| C3 | PASS | PASS | — |
| C5 | PASS | PASS | — |
| C6 | PASS | PASS | — |
| C7 (checkpoint, ~12:12) | PASS | PASS | PASS — 7 files, 54/54 |
| C8 | PASS | PASS | — |
| C9 | PASS | PASS | — |
| C10 | PASS | PASS | — |
| C11 | PASS | PASS | — |
| C12 (final gate, ~12:24) | PASS | PASS | PASS |

Final C12 gate: root `lint` PASS · root `build` PASS · root `test` 54/54 PASS ·
`functions/` `build` PASS · `functions/` `test` 8/8 PASS.

The `build` step emits Vite's pre-existing ">500 kB chunk" advisory — a
warning, not an error, and unchanged by this reorg.

## C9 — the CLAUDE.md rewrite (the one high-risk commit)

Committed in isolation (`e5b9f72`, `CLAUDE.md` only). The new file is a strict
content UNION of the prior `CLAUDE.md`, `AGENTS.md`, and
`.claude/project-profile.md`. R1 "no info dropped" check:

- All 10 `AGENTS.md` hard invariants — carried, verbatim in meaning.
- The 13-row critical-files table — carried.
- The 4-step boot flow — carried.
- The repo / branch / when-changing conventions — carried.

One deliberate non-change: invariant #5 keeps `AGENTS.md`'s "currentSession in
some contexts" wording. The audit (H-4) notes `currentSession` is in fact
synced — that doc-vs-code drift is a tracked finding and was **not** corrected
here, because C9 is a faithful merge, not a correctness fix.

## Cleanup notes — review before merge

1. **Spot-check C9** (`git show e5b9f72`) — the `CLAUDE.md` rewrite is the only
   judgement-heavy change.
2. **`README.md` Features list** still omits the Calendar and Siri modules. Left
   unchanged (C11 was scoped to structure + links). Worth a follow-up.
3. **`.claude/project-profile.md`** now overlaps the new `CLAUDE.md`. It was
   kept (it is referenced by `.claude/verification-workflow.md`) — consider
   consolidating later. Not deleted.
4. **`docs/` is mixed-case** by design (D-1). A later kebab normalization is a
   self-contained follow-up.
5. **`serviceAccountKey.json`** sits untracked at the repo root — verified never
   committed, correctly gitignored, and required there by `scripts/backup.cjs` /
   `restore.cjs`. Informational; no action.
6. **Favicon** is still the default Vite logo (`public/vite.svg`).

## Suggested follow-up branches

- `claude/docs-kebab-normalize` — rename the 11 `UPPERCASE_SNAKE` docs to
  kebab-case (touches ~9 source-comment references; cosmetic).
- `claude/readme-features` — add the Calendar and Siri modules to the README
  features list.
- `claude/authcontext-cancellation-tokens` — fix the AuthContext race (audit
  C-1); unblocks the e2e harness. Pre-existing, out of reorg scope.
- A real brand favicon to replace `public/vite.svg`.

## Branch status

11 commits ahead of `main` (C1–C12, C4 skipped). `main` untouched. Not merged;
no PR opened.
