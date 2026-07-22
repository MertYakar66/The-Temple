# TheTemple

**Your workouts, your nutrition, and your calendar — together in one mobile-first app.**

[**Live at thetemple.web.app**](https://thetemple.web.app)

---

TheTemple is a personal fitness and life-management app. It brings the things worth tracking day to day into one place — what you trained, what you ate, and what's coming up next — so none of it has to live in a scattered pile of notes and separate apps.

It's a progressive web app: it installs to your phone's home screen and feels like a native app, but updates instantly like a website. Everything you log is saved on your device first and synced to the cloud when you sign in, so the app stays fast and follows you to whatever device you pick up.

TheTemple is built and maintained by a single developer — it's a personal project, and nothing here is trying to sell you anything. This page is simply a friendly tour of what the app does and how it's put together.

## What TheTemple does

The app is organized into three modules — Workout, Diet, and Calendar — plus a hands-free Siri integration. They share one account, one design language, and one synced source of truth, so moving between them feels like one app, not several.

### Workout

Log each training session set by set — exercise, weight, reps, and rest. Save the routines you come back to, and start a session from one in a tap. TheTemple watches for personal records as you train and celebrates them the moment you hit one. Body weight gets its own tracker, with progress charts that show the trend over weeks and months.

For structured training, the app includes two Jeff Nippard block programs — the twelve-week "Min Max" plan and a "PowerBuilding" plan — that you can follow exactly, or customize week by week to match your own equipment and schedule, ticking off each workout as you go. Every past session stays browsable day by day in a full workout history, right down to the notes and effort on a single set.

### Diet

Log meals with full calorie and macro tracking. Build a personal library of custom foods, recipes, and reusable saved meals, so logging the things you eat often takes seconds rather than minutes. Set daily macro goals — with separate targets for training days — keep a logging streak going, and size up your calorie needs with the built-in TDEE calculator. Prefer a ready-made plan? Pick a goal-based diet from the built-in menu, set it as your active plan, and log its meals to the diary with a single tap.

### Calendar

A complete calendar, with day, week, month, and upcoming views. Keep separate calendars for the different parts of life — personal, work, training — and add recurring events with details like location (with address autocomplete). Training works best when it fits around everything else, so everything else has a home here too.

### Siri

The most useful fitness app is the one you barely have to open. TheTemple connects to Apple Shortcuts, so you can ask Siri for a morning briefing, today's schedule, today's workout, or a quick read on your nutrition — and hear it back, even from the lock screen.

## How it's built

TheTemple is a client-and-serverless app — there's no traditional backend server to run, monitor, or keep alive.

- The app runs entirely in the browser, or as an installed PWA. State lives in lightweight stores and is persisted to local storage, which keeps the app quick and resilient to a shaky connection.
- Signing in syncs your data to Firebase (Authentication and Firestore), so every device you log in on shows the same, current picture.
- The Siri features are the one piece of server-side code: a small set of Firebase Cloud Functions that Apple Shortcuts call to read your data and hand back a spoken summary.

It's mobile-first by design, supports light and dark mode throughout, and works in either metric or imperial units.

## Tech stack

- **React 19 + TypeScript** — the app and its interface
- **Vite** — build tooling and dev server
- **Zustand** — state management, with local-storage persistence
- **Firebase** — Authentication and Firestore, for accounts and cloud sync
- **Firebase Cloud Functions** (Node 20) — the Siri integration
- **Tailwind CSS** — styling
- **Recharts** — progress and trend charts
- **React Router v7** — navigation

## Getting started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting:myapp
```

Quality is held to a simple gate — `npm run lint`, `npm run build`, and `npm test` — which also runs automatically in CI on every pull request.

## Project structure

```
src/
├── components/   # Reusable UI — workout, calendar, blocks, and more
├── contexts/     # React context providers (auth + cloud sync)
├── data/         # Default seed data (exercises, foods, programs)
├── hooks/        # Custom React hooks
├── lib/          # Firebase config and Firestore sync
├── pages/        # Route-level screens
├── store/        # Zustand stores (workout, diet, calendar)
├── types/        # TypeScript definitions
└── utils/        # Dates, unit conversion, and other helpers
functions/        # Firebase Cloud Functions — the Siri endpoints
docs/             # Architecture, data policy, runbooks, audits
scripts/          # Firestore backup and restore tooling
```

## Documentation

If you'd like to look under the hood:

- **[`CLAUDE.md`](CLAUDE.md)** — the working guide for contributors: architecture, the hard invariants, conventions, and pointers to everything else.
- **[`docs/`](docs/)** — deeper reference: architecture, the data policy, design decisions, the sync model, testing, runbooks, and audit reports.

## License

TheTemple is released under the MIT License.
