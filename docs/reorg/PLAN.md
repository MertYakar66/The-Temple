# Repo Reorganization Plan — TheTemple

**Branch:** `claude/repo-reorg-20260517-084217`
**Base:** `main` @ `10f21a0`
**Date:** 2026-05-17
**Phase:** 1 (Plan). No files moved or deleted yet — this document is the only change.
**Goal:** A fresh AI agent opening this repo finds the right context, conventions, and runbooks within seconds — with **zero functional change** (`lint` + `build` + `test` green at the end).

---

## 1. Current state summary

### 1.1 Tree snapshot (tracked files, condensed)

```
The_Temple/
├─ Root tooling-contract files (16, pinned — see §5):
│   package.json  package-lock.json  tsconfig.json  tsconfig.app.json
│   tsconfig.node.json  vite.config.ts  eslint.config.js  postcss.config.js
│   tailwind.config.js  firebase.json  firestore.rules  .firebaserc
│   index.html  .gitignore  .env.example  playwright.config.ts
├─ Root markdown:
│   CLAUDE.md (32 L)  AGENTS.md (144 L)  README.md (59 L)
│   CHANGELOG.md (169 L)  SIRI_INTEGRATION.md (227 L)
├─ serviceAccountKey.json   (untracked, gitignored — secret; see §5/§6)
├─ .claude/
│   ├─ project-profile.md         (48 L)
│   └─ verification-workflow.md   (218 L)
│   (no commands/ ; no settings.json)
├─ docs/   (11 files, flat, UPPERCASE_SNAKE naming)
│   ARCHITECTURE.md  AUDIT_2026-05-08.md  AUDIT_STATE.md  CLAUDE_CODE_WEB.md
│   COMMIT_STYLE.md  DATA_POLICY.md  DECISIONS.md  MODULES.md
│   PROJECT_STATE.md  ROADMAP.md  TESTING.md
├─ functions/   (Cloud Functions — Siri endpoints; self-contained npm package)
│   src/index.ts (486 L)  src/sumMacros.test.ts  package.json  tsconfig.json
│   vitest.config.ts  .gitignore
├─ public/   vite.svg   (← app favicon, wired in index.html)
├─ scripts/  backup.cjs  restore.cjs   (referenced by package.json + load serviceAccountKey.json)
├─ src/   (React app)
│   App.tsx  main.tsx  index.css
│   components/{workout,calendar,blocks,onboarding,exercises,layout}/ + 3 top-level
│   contexts/AuthContext.tsx   data/ (5 seed files)   hooks/   lib/ (5 files)
│   pages/ (38 files)   store/ (useStore, useDietStore, useCalendarStore + tests)
│   test/setup.ts   types/ (index.ts, calendar.ts)   utils/ (+ colocated *.test.ts)
└─ tests/e2e/   README.md  calendar-location-roundtrip.spec.ts  helpers/auth.ts
```

Code: ~21,600 LOC across 124 `.ts/.tsx` files. The 3 Zustand stores + `AuthContext.tsx` + `firestoreSync.ts` + `functions/src/index.ts` are the decision-layer / load-bearing files.

### 1.2 Root surface count

| Bucket | Count |
|---|---|
| Tracked root files | 21 |
| Tracked root dirs | 7 (`.claude docs functions public scripts src tests`) |
| Untracked present | 1 (`serviceAccountKey.json`, gitignored) |
| **Meaningful root entries an agent sees** | **~28** |

Target is ≤ 15. **This is not achievable** without violating hard-constraint #7 — see Risk **R4**. 16 of the 21 root files are tooling-contract configs/dotfiles that must stay at root (auto-discovered by their tools or pinned by #7). The realistic, honest win is **−1 file** (`SIRI_INTEGRATION.md` → `docs/`) and, critically, **adding zero new root files** — all new structure lands under `docs/` and `.claude/`.

### 1.3 AI-agent front-door status

| Front door | Exists? | Assessment |
|---|---|---|
| `CLAUDE.md` (root) | ✅ Yes (32 L) | **Thin / inverted.** It defers *outward* — "the full context lives in `AGENTS.md` — read that first." Has a 14-item reading list + 6 reminders. Should be the comprehensive source of truth, not a pointer. |
| `AGENTS.md` (root) | ✅ Yes (144 L) | **Comprehensive.** Has stack, critical-files table, the **10 hard invariants** (= the "10 gotchas"), known issues, conventions, boot flow. Currently the *de facto* front door. Should become the thin pointer. |
| `README.md` (root) | ✅ Yes (59 L) | Human-first, decent, **slightly stale**: "Project Structure" omits `calendar` store, `functions/`, Siri, Calendar module. No links to `CLAUDE.md` or `docs/`. |
| `.claude/` | ✅ Exists | Has 2 context docs. **No `commands/`** — the biggest single ergonomics gap. No `settings.json`. |
| `docs/` | ✅ Exists | 11 living/dated docs, **flat, no subdirectories** (`audits/`, `runbooks/`, `adr/` all missing). |

**Net:** the foundation is unusually good (rich `docs/`, an invariant list, decision log). The gaps are: (a) `CLAUDE.md`↔`AGENTS.md` roles inverted, (b) no `.claude/commands/`, (c) no `docs/` subdivision, (d) no copy-pasteable runbooks, (e) one dated audit report sitting among living docs.

---

## 2. Proposed moves

Recommended path. All moves use `git mv` (history preserved). **No `.ts/.tsx` files move** — so there is no code import graph to rebuild; cross-referencing is limited to markdown links, doc-path mentions in code *comments*, and the favicon asset.

| # | From | To | Reason | Refs to update (verified by grep) |
|---|---|---|---|---|
| M1 | `SIRI_INTEGRATION.md` | `docs/siri-integration.md` | Non-front-door user doc; trim root surface; group with other docs | `docs/MODULES.md:108` (path + "at repo root" wording); `CLAUDE.md:19` & `AGENTS.md:17` (both rewritten anyway in C9/C10) |
| M2 | `docs/AUDIT_2026-05-08.md` | `docs/audits/2026-05-08-cross-module-audit.md` | Dated one-off audit report; belongs in an archive, not among living docs | `.claude/verification-workflow.md:11` & `:213`; `functions/src/sumMacros.test.ts:7` (a **code comment** — zero functional change, but the only non-markdown edit in the recommended plan) |

**Not moved (considered, deliberately kept):**

- **`docs/AUDIT_STATE.md`** — *living* per-batch tracker, not a dated report. Stays in `docs/`.
- **`docs/CLAUDE_CODE_WEB.md`** — dated external snapshot (Claude Code web docs, captured 2026-05-04), but referenced by both front-door files as a handoff reference. Stays in `docs/`; not an "audit". Flagged R-note only.
- **`CHANGELOG.md`** — root is the universal convention; tooling expects it there. Stays.
- **`tests/e2e/`** — Playwright e2e is already consolidated (not scattered); moving `tests/e2e → e2e/` would edit the `playwright.config.ts` `testDir` contract for ~zero gain. Kept as-is (matches your "stays in its current location").
- **`scripts/`** — referenced by `package.json` (`backup`/`restore`) and the scripts `require('../serviceAccountKey.json')`. Stays.
- **`serviceAccountKey.json`** — see §5; must not move.

### Decision D-1 — `docs/` filename casing (needs your call)

The 11 existing docs use `UPPERCASE_SNAKE.md`. Your spec names new files in `kebab-case` (`architecture.md`, `sync-model.md`, `add-persisted-slice.md`, …).

- **Recommended default (this plan): keep the 11 existing docs UPPERCASE; create all new files in kebab-case.** Your `docs/architecture.md` is satisfied by the existing `docs/ARCHITECTURE.md` (already a deep, current architecture doc). Result: a *mixed-case* `docs/` — an accepted cosmetic wart.
  - *Why default to this:* a full kebab rename would `git mv` 11 files **and** edit doc-path mentions in **~9 source files** — `useStore.ts`, `useDietStore.ts`, `useCalendarStore.ts`, `firestoreSync.ts`, `AuthContext.tsx`, `utils/date.ts`, `utils/calendar.ts`, `functions/src/index.ts`, `firestore.rules` (comments referencing `DATA_POLICY.md` / `AUDIT_STATE.md` / `DECISIONS.md`). Comment-only = zero functional change, but it reaches into decision-layer files for a purely cosmetic gain — against your "prefer additive over disruptive" calibration.
- **Opt-in alternative:** full kebab normalization as one isolated commit (see C4, currently marked optional). Say the word and it's included.

---

## 3. Proposed deletions

**Zero deletions.** Every named scaffold candidate was checked against the four-part deletion test:

| Candidate | Size | Exists? | Evidence | Verdict |
|---|---|---|---|---|
| `public/vite.svg` | 1497 B | ✅ Yes | **Referenced** — `index.html:5` `<link rel="icon" href="/vite.svg">`. It is the live favicon. | **KEEP** — in use. Removing it changes site output + needs editing pinned `index.html`. |
| `src/App.css` | — | ❌ No | Not in `git ls-files`; only `src/index.css` exists | N/A — nothing to delete |
| `src/assets/react.svg` | — | ❌ No | `src/assets/` directory absent | N/A — nothing to delete |
| Root `NOTES.md` / `TODO.md` / `SCRATCH.md` | — | ❌ No | Not present; `git status` clean (no stray untracked files) | N/A — nothing to delete |

The only Vite-scaffold leftover that exists (`vite.svg`) is wired up as the favicon, so it fails the "unused" test. See Risk **R6** — replacing the default logo with a real brand icon is a *product* decision, out of scope for a zero-functional-change reorg.

---

## 4. Proposed new files

All additive. None at repo root (surface stays flat). Lowercase-kebab per your spec.

### 4.1 `.claude/commands/` — slash commands

| Path | Purpose | Seed content sketch |
|---|---|---|
| `.claude/commands/audit.md` | `/audit` — run the correctness-review rubric | Severity-tiered findings (Critical→High→Medium→Low), the landmine checklist, and the output format reused from `docs/AUDIT_2026-05-08.md`; cross-check every hard invariant from CLAUDE.md. |
| `.claude/commands/add-slice.md` | `/add-slice` — add a persisted store slice safely | Walks the **5-place** checklist: (1) type defs, (2) `loadFromCloud`, (3) `getCloudSyncData`, (4) `resetStore`, (5) `startSync` reference-equality check. Bump store `version` + `migrate()`. |
| `.claude/commands/touch-firestore-path.md` | `/touch-firestore-path` — change a Firestore path safely | Walks the **5-place** checklist: `firestoreSync.ts`, `firestore.rules`, `functions/src/index.ts`, `scripts/backup.cjs`, `scripts/restore.cjs`. |
| `.claude/commands/preflight.md` | `/preflight` — pre-finish gate | `npm run lint && npm run build && npm test` at root; `npm run build && npm test` in `functions/`; report pass/fail per gate. |
| `.claude/commands/sync-debug.md` | `/sync-debug` — dump the auth-sync race surface | Read `AuthContext.tsx` + `firestoreSync.ts`; print the `onAuthStateChanged → resetStore → loadFromCloud → startSync` flow, the 2s debounce, and the known cancellation-unsafe race. |

### 4.2 `docs/` new files

| Path | Purpose | Seed content sketch |
|---|---|---|
| `docs/sync-model.md` | The auth-sync model in depth | `onAuthStateChanged` lifecycle, `resetStore`→`loadFromCloud`→`startSync`, 2s debounce + logout flush, the 5-place persisted-slice invariant, the known race. Sourced from `ARCHITECTURE.md`, `AGENTS.md` boot section, `DATA_POLICY.md` §5/6/8, `AuthContext.tsx`. |
| `docs/runbooks/add-persisted-slice.md` | Copy-paste runbook | Imperative version of the 5-place slice checklist. |
| `docs/runbooks/touch-firestore-path.md` | Copy-paste runbook | Imperative version of the 5-place Firestore-path checklist. |
| `docs/runbooks/release.md` | Copy-paste runbook | `lint`/`build`/`test` → `firebase deploy --only hosting:myapp` (project `the-temple-f195e`, target `myapp`→`thetemple`); functions deploy note. |
| `docs/runbooks/rotate-siri-token.md` | Copy-paste runbook | Revoke/regen Siri token via `src/lib/siriToken.ts`; `siriTokens/{token}` lookup doc; re-pair the Shortcut. |
| `docs/adr/README.md` | ADR convention | Explains the ADR format and that the **existing consolidated decision log is `docs/DECISIONS.md`** (D-1…D-11); new significant decisions get individual `NNNN-title.md` files here. `DECISIONS.md` is **not** split (too churny). |
| `docs/audits/README.md` | Audits archive index | One-line convention note (`YYYY-MM-DD-<slug>.md`) + index of archived audits. |

### 4.3 Rewritten-in-place (not moved, not new — existing files restructured)

| Path | Change | Notes |
|---|---|---|
| `CLAUDE.md` | **Merge-rewrite** into the canonical front door | Union of current `AGENTS.md` (10 invariants, critical-files table, boot flow, conventions) + `.claude/project-profile.md` (architecture map) + current `CLAUDE.md` (pre-finish gates, branch rules), restructured to your spec: stack · pre-finish gates · branch rules · architecture map (1 line/module) · the two 5-place invariants · domain conventions (`dayOfWeek`, date stamps) · the 10 gotchas · "never do" list. **Diff-merge — no information dropped.** |
| `AGENTS.md` | **Reduce to a pointer** | ~6–10 lines: "All agent context lives in `CLAUDE.md`." Kept as a real file (not a symlink — symlinks are unreliable on Windows + across git checkouts) for Cursor/Aider/Codex compatibility. |
| `README.md` | **Light refresh** | Fix the "Project Structure" block (add `store/useCalendarStore`, `functions/`, Siri); add links to `CLAUDE.md` and `docs/`. Human-first content unchanged otherwise. |

---

## 5. Files that must NOT move or be rewritten (Phase-2 guardrails)

Per hard-constraint #7 + tool auto-discovery — re-stated so Phase 2 cannot drift:

- **#7 pinned:** `firebase.json`, `firestore.rules`, `package.json`, `package-lock.json`, `tsconfig*.json` (×3), `vite.config.ts`, `index.html`, the `functions/` root, the `public/` root, `dist/` convention. (`firestore.indexes.json` — not present in this repo.)
- **Auto-discovered config (moving breaks the toolchain):** `eslint.config.js`, `postcss.config.js`, `tailwind.config.js`, `playwright.config.ts`, `.firebaserc`.
- **`serviceAccountKey.json`** — untracked secret, **load-bearing**: `scripts/backup.cjs:15` and `scripts/restore.cjs:16` both `require('../serviceAccountKey.json')`. Moving it breaks backup/restore. Leave exactly where it is.
- **`.env*`** — never move/commit (none present except `.env.example`).

---

## 6. Risk register

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | `CLAUDE.md`/`AGENTS.md` merge-rewrite drops information | Med | Diff old→new; treat as a content *union*; checklist every section of old `AGENTS.md` + `project-profile.md` into the new `CLAUDE.md` before committing. |
| R2 | (Only if D-1 opt-in chosen) kebab rename edits comments in ~9 decision-layer source files | Med | Isolated single commit; comment-text only = zero functional change; full `lint`+`build`+`test` after. Default plan avoids this entirely. |
| R3 | M2 edits a comment in `functions/src/sumMacros.test.ts` — the only non-markdown edit in the recommended plan | Low | Comment-only; verified by `functions/` build+test in the C2 checkpoint. |
| R4 | **≤15 root entries is infeasible** — ~16 root files are tooling-contract configs | Info | Do not fight it. Documented honestly; the ergonomic win is structure (`.claude/commands`, `docs/` subtrees, a real `CLAUDE.md`), not raw entry count. A `config/` folder was considered and rejected (breaks ESLint/PostCSS/Tailwind/Vite auto-discovery). |
| R5 | `serviceAccountKey.json` present at repo root | Low (verified) | **Verified:** `git log --all -- serviceAccountKey.json` is empty → never committed. Gitignored at `.gitignore:32`. Required at root by the backup scripts. No action; noted for your awareness. Same check on `.env*` → also never committed. |
| R6 | App favicon is the default Vite logo (`public/vite.svg`) | Low | Not dead code — it is wired in `index.html:5`. Replacing it with a TheTemple icon is a product/branding decision, out of scope here. Flagged for you. |
| R7 | `.claude/project-profile.md` overlaps the new `CLAUDE.md` (future duplication) | Low | Keep it — it is referenced by `.claude/verification-workflow.md`. Do **not** delete. Note as a candidate for a later consolidation pass. |
| R8 | `AGENTS.md`-as-pointer: a tool might expect full content there | Low | Pointer file still names the key invariants in one line each and points clearly to `CLAUDE.md`; sufficient for Cursor/Aider/Codex. |

---

## 7. Order of operations

Phase 2 commits, in order. Each is atomic and conventional-commit styled. `npm run lint` + `npm run build` after every commit; `npm test` checkpoint every 3–5 commits. Almost every change is markdown, so lint/build/test should be unaffected throughout — but the gates run regardless.

| Commit | Message | Content | Rollback |
|---|---|---|---|
| **C1** *(this commit)* | `docs(reorg): propose repo reorganization plan` | Add `docs/reorg/PLAN.md` | `git revert C1` |
| C2 | `docs: archive 2026-05-08 audit under docs/audits/` | M2: `git mv` audit doc; add `docs/audits/README.md`; update refs in `verification-workflow.md` + the `sumMacros.test.ts` comment | `git revert C2`; `git mv` back |
| C3 | `docs: move SIRI_INTEGRATION.md into docs/` | M1: `git mv`; update `docs/MODULES.md:108` | `git revert C3` |
| C4 *(optional — D-1)* | `docs: normalize docs/ filenames to kebab-case` | Only if you opt in: `git mv` 11 docs; update all inter-doc links + ~9 source-comment refs | `git revert C4` |
| C5 | `docs: add runbooks under docs/runbooks/` | 4 new runbook files | delete files / `git revert` |
| C6 | `docs: add ADR scaffold under docs/adr/` | `docs/adr/README.md` | `git revert C6` |
| C7 | `docs: add docs/sync-model.md` | New sync-model deep-dive | `git revert C7` |
| — | *(checkpoint: `npm test` after ~C7)* | | |
| C8 | `chore(claude): add .claude/commands/ slash commands` | 5 new command files | `git revert C8` |
| C9 | `docs: rewrite CLAUDE.md as the canonical agent front door` | Merge-rewrite `CLAUDE.md` (R1 checklist applied) | `git revert C9` |
| C10 | `docs: reduce AGENTS.md to a pointer to CLAUDE.md` | Shrink `AGENTS.md` | `git revert C10` |
| C11 | `docs: refresh README.md structure and cross-links` | Update `README.md` | `git revert C11` |
| C12 | `docs(reorg): add execution report` | Phase-3 `docs/reorg/REPORT.md`; final `lint`+`build`+`test`(+`functions/`) | n/a |

**Global rollback:** the entire effort is isolated on `claude/repo-reorg-20260517-084217`; `main` is never touched. Worst case, abandon the branch — `main` is unaffected.

**Sequencing rationale:** archive + moves first (C2–C4) so paths are final; new structure next (C5–C8); the `CLAUDE.md`/`AGENTS.md`/`README.md` rewrites **last** (C9–C11) so they can reference every new path that now exists.

---

## 8. Coverage check vs. the brief

- Front door (`CLAUDE.md`/`README.md`/`AGENTS.md`) → C9/C10/C11. ✅
- `.claude/commands/` (5 commands) → C8. ✅  `.claude/settings.local.json` → not invented (gitignored; no need). ✅
- `docs/` (`architecture.md`, `sync-model.md`, `runbooks/`, `adr/`, `audits/`) → C2/C5/C6/C7 + D-1. ✅
- `src/components/{…}/`, colocated tests, `tests/e2e/`, `src/data/`, `src/types/`, `scripts/` → all kept as-is per brief. ✅
- Dead scaffolding → checked, none deletable (§3). ✅
- Duplicate configs → none exist (single `eslint.config.js`, no prettier config; the 3 tsconfigs are a standard project-references set, not duplicates). ✅
- `≤15` root entries → infeasible; see R4. ⚠️ flagged.
- `tests/ → e2e/` → not done; e2e already consolidated. ⚠️ flagged.
- Type consolidation → `src/types/` already exists; left alone per brief. ✅

---

## 9. Open decisions for the user

1. **D-1 — `docs/` casing.** Default = keep existing docs UPPERCASE, new files kebab-case (mixed). Opt in to C4 for full kebab normalization (touches ~9 source-file comments).
2. **Favicon (R6)** — out of scope here; raise separately if you want a real brand icon.
3. **`tests/e2e → e2e/`** — not in this plan; say so if you want it (it edits `playwright.config.ts`).
