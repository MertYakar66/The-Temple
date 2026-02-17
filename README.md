# TheTemple

A workout tracker and nutrition logger built with React, TypeScript, and Firebase.

**Live:** [thetemple.web.app](https://thetemple.web.app)

## Features

- **Workout Tracking** — Log sets, reps, and weight for each exercise. Supports custom routines and pre-built templates.
- **Personal Records** — Automatic PR detection with celebration animations when you hit a new best.
- **Body Weight Tracking** — Track weight over time with visual progress charts.
- **Nutrition Logging** — Log meals with calorie and macro tracking. Create custom foods and recipes.
- **Progress Dashboard** — View strength progression, volume trends, and body composition changes.
- **Cloud Sync** — Data syncs to Firebase per user account. Log in from any device.
- **Dark Mode** — Full dark mode support across all screens.
- **Unit System** — Toggle between metric (kg) and imperial (lbs).

## Tech Stack

- React 19 + TypeScript
- Zustand (state management with persistence)
- Firebase Auth + Firestore (authentication and cloud storage)
- Tailwind CSS
- Vite
- Recharts (data visualization)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting:myapp
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React context providers (Auth)
├── hooks/            # Custom hooks (dark mode, etc.)
├── lib/              # Firebase config and sync logic
├── pages/            # Route-level page components
├── store/            # Zustand stores (workout, diet)
├── types/            # TypeScript type definitions
└── utils/            # Utility functions (weight conversion, etc.)
```

## License

MIT
