# CLAUDE.md

Claude Code auto-loads this file as project memory. The full context lives in `AGENTS.md`
(orientation, invariants, conventions) — read that first. Deeper docs:

- `AGENTS.md` — orientation, critical files, hard invariants, branch convention. Read first.
- `docs/ARCHITECTURE.md` — data flow, Firestore layout, sync lifecycle, Cloud Functions.
- `docs/MODULES.md` — per-module file map and gotchas.
- `SIRI_INTEGRATION.md` — user-facing Siri setup guide.
- `README.md` — user-facing project description.

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
