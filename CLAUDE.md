# CLAUDE.md

Claude Code auto-loads this file as project memory. The full context lives in `AGENTS.md`
(orientation, invariants, conventions) — read that first. Recommended reading order for a
new agent:

1. `AGENTS.md` — orientation, critical files, hard invariants, branch convention.
2. `docs/PROJECT_STATE.md` — what the project is right now, what's deployed, what's in-flight.
3. `docs/AUDIT_STATE.md` — per-batch audit progress and current blockers.
4. `docs/ROADMAP.md` — what comes next.
5. `docs/ARCHITECTURE.md` — data flow, Firestore layout, sync lifecycle, Cloud Functions.
6. `docs/MODULES.md` — per-module file map and gotchas.
7. `docs/DATA_POLICY.md` — hard invariants expanded with rationale.
8. `docs/DECISIONS.md` — architectural decisions and why.
9. `docs/TESTING.md` — Vitest + Playwright + the blocked-test discipline.
10. `docs/COMMIT_STYLE.md` — commit/PR shape used in this repo.
11. `CHANGELOG.md` — recent landings in human-readable form.
12. `docs/CLAUDE_CODE_WEB.md` — Claude Code cloud-session reference (only relevant if a task is being handed off to a cloud session).
13. `SIRI_INTEGRATION.md` — user-facing Siri setup guide.
14. `README.md` — user-facing project description.

## Quick reminders for Claude Code sessions

- Develop on a feature branch named `claude/<topic>-<suffix>`. Don't push directly to `main`.
- Don't open PRs unless the user asks.
- Run `npm run lint` and `npm run build` before declaring a task done. `npm test` if logic changed.
- The repo's hard invariants (in `AGENTS.md`) are not optional — Firestore `undefined` rejection,
  date stamp format, sync-slice equality checks, soft-delete on calendar events, etc. Violating
  them causes silent data loss.
- Three Zustand stores (`useStore`, `useDietStore`, `useCalendarStore`) all sync to Firestore via
  `AuthContext.startSync`. Adding a persisted slice means updating five places: types,
  `loadFromCloud`, `getCloudSyncData`, `resetStore`, and the equality check in `startSync`.
