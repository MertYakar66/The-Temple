# Modules

Per-module file map and gotchas. For data flow see `ARCHITECTURE.md`.

## Workout

**Pages:** `Workout`, `Routines`, `RoutineEditor`, `RoutineDetail`, `Exercises`, `Progress`,
`History`, `WorkoutTemplates`, `Blocks`.

**Components:** `components/workout/{ExerciseSelector,RestTimer,SetRow,WorkoutExerciseCard,
RoutineGroupEditModal}.tsx`, `components/blocks/{BlockExerciseEditModal,BlockDayAddModal}.tsx`,
`components/exercises/ExerciseDetail.tsx`.

**Store:** `useStore` (the big one — 950 lines).

**Key concepts:**
- `WorkoutSession` — one logged session, has many `WorkoutExercise`s, each with many `WorkoutSet`s.
  `currentSession` is the in-progress session; `workoutSessions` is the completed history.
- `Routine` — template for a session. Optional `program` field groups routines (e.g., "PPL" or
  "Min Max"). `dayOfWeek: number[]` for scheduled days (0=Sun..6=Sat).
- `Block` — Jeff Nippard "Min Max" 12-week program in `src/data/minMaxProgram.ts`. Default program
  is read-only data, but users can override per-week via `BlockCustomizations.weekOverrides`
  keyed `${blockIdx}-${weekIdx}`. `getBlockWeekDays(blockIdx, weekIdx)` returns override or
  falls back to default.
- `PersonalRecord` keyed by `(exerciseId, reps)`. `checkAndUpdatePR` fires on workout end.
- `newPRs` is a buffer for the celebration modal (`<PRCelebration />` mounted in App.tsx). Cleared
  by `clearNewPRs()`. Not synced (ephemeral).
- `ExerciseGoal` — user-defined target weight/reps/RIR/notes for an exercise. Shown as a
  prescription in the workout card. `getLastWorkoutForExercise` shows the previous performance
  inline.
- Weights stored in **kg** internally always. Display unit comes from `user.unitSystem`. Convert
  via `src/utils/weight.ts`.

**Pitfall:** `addWeightEntry` deduplicates by date — adding a new entry on the same day replaces
the old one. `updateWeightEntry` if the user changes the date also dedupes.

## Diet

**Pages:** `Diet`, `DietLog`, `DietMeals`, `DietMealNew`, `DietWeekly`, `DietSettings`,
`DietFoodNew`, `DietRecipeEditor`, `TDEECalculator`.

**Store:** `useDietStore`.

**Key concepts:**
- `Food` — base item with macros per serving. Built-in (`src/data/foods.ts`) and custom.
- `Recipe` — combination of foods scaled by ingredient quantity, divided by `servings`. Macros
  are auto-calculated by `calculateMacros` helper on add/update.
- `Meal` — saved meal template (e.g., "My usual breakfast"), reusable in the log.
- `FoodLogEntry` — one logged item on a date with a `mealType`. `mealType` is a free string
  (custom meal names allowed), default reminders use `breakfast/lunch/dinner`.
- `DietGoals` — daily targets + training-day adjustments. Targets vary by training day via
  `getTargetMacrosForDate(date, isTrainingDay)`.
- `DietStreak` — protein hit + logging streaks, computed via `updateStreaks(date)`.
- `recentFoodIds` — MRU list to surface recently used foods in pickers.

**TDEE calculator** at `/tdee-calculator` is a Mifflin-St Jeor estimator, lives standalone.

## Calendar

**Pages:** `Calendar`, `CalendarEventDetail`, `CalendarEventEditor`, `CalendarManage`,
`CalendarSearch`, `CalendarSettings`, `CalendarInvitations`.

**Components:** `components/calendar/{DayView,WeekView,MonthView,UpcomingView,CalendarHeader,
EventChip,EventDetailPopover,QuickEventCreate,LocationAutocomplete}.tsx`.

**Store:** `useCalendarStore`.

**Key concepts:**
- `CalendarContainer` — a "calendar" (Personal, Work, Training default). User-created allowed.
  `isVisible` toggles display. `isReadOnly` for subscribed/holiday calendars.
- `CalendarEvent` — events belong to one calendar via `calendarId`. **Soft-deleted** with
  `isDeleted: true` — never hard-deleted. Always filter on read.
- Recurrence — `RecurrenceRule` supports daily/weekly/monthly/yearly with daysOfWeek, dayOfMonth,
  weekOfMonth (ordinal), and end conditions. Single-instance exceptions use `seriesMasterId` +
  `isRecurrenceException` + `originalDate`.
- `Attendee` + `Invitation` — invitation tracking, but actual delivery is not implemented
  (in-app only).
- `LocationAutocomplete` uses Google Places via `@googlemaps/js-api-loader`. Needs
  `VITE_GOOGLE_MAPS_API_KEY`. Falls back to free-text input if key missing.
- `DEFAULT_CALENDARS` array seeds three calendars on first load. `defaultCalendarId` in settings
  is `'cal-personal'`.
- Quick-create popover (`QuickEventCreate`) supports drag-to-create on MonthView/WeekView.
  `useFixed` positioning fix in commit `774de24` — popovers must use `position: fixed`, not
  `absolute`.

**Pitfall:** Memoize derived event lists per view. Commit `a0b971d` added memoization to all
three views — `DayView`, `WeekView`, `MonthView` — because filtering events on every render
on a month with many events caused jank.

## Siri

**Client:**
- `src/lib/siriToken.ts` — generate (32 random bytes → 4×8 char base62, dashed), revoke, load.
  Generation revokes any prior token first.
- `src/pages/SiriSetup.tsx` — UI to view/copy/regenerate/revoke. Auto-fills timezone in URLs
  shown to the user.

**Server:** `functions/src/index.ts`. Each endpoint:
1. `authenticateToken(req)` — token from header or query, regex-validated, cached.
2. Read `users/{uid}/data/{calendar,workout,diet}` via Admin SDK.
3. Format as conversational text.
4. Respond `{ text }` (Siri reads via "Get Dictionary Value" → "Speak Text" in the Shortcut).

**Pitfall:** All Firestore reads are defensive — `safeArray` returns `[]` for missing/wrong-type
fields. Don't assume any field exists. Users may have partial data.

**User docs:** `SIRI_INTEGRATION.md` at repo root walks through deployment + shortcut creation
in detail.

## Auth

**Page:** `Login`, `Signup`, `Settings` (account section), `ReauthModal` component.

**Module:** `src/contexts/AuthContext.tsx` (only place that calls Firebase Auth methods).

**Capabilities:**
- Email/password login + signup with email verification.
- Google OAuth via popup (mobile redirect was tried but had race conditions — see commits
  `724a713` → `a4b99c0` → `9866f34`).
- Password reset (`sendPasswordResetEmail`).
- Re-authentication required for sensitive ops (change password, delete account). Uses
  `ReauthModal` UI.
- Account deletion — re-auth → revoke Siri token → delete Firestore data → delete Auth user →
  clear localStorage. Order matters; the auth account must be the last thing deleted.

**Module:** `src/lib/authErrors.ts` maps Firebase error codes to user-friendly strings.
`src/lib/passwordValidation.ts` enforces password rules on signup.

## Onboarding

**Pages:** `Onboarding` (orchestrator).

**Components:** `components/onboarding/{Welcome,ProfileSetup,EquipmentSetup,ExperienceSetup,
GoalsSetup}.tsx`. Each is a step, `Onboarding` handles step state.

**Pitfall:** `user.onboardingCompleted` gates `<AppRoutes>`. Setting this true pushes the user
into the app. Don't set it true mid-flow.

## Layout / Navigation

`components/layout/{Layout,Header,BottomNav}.tsx`. `<Layout>` is an `<Outlet>` wrapper with
`<Header>` and `<BottomNav>`. Routes outside `<Layout>` (settings, editors, detail pages) get
no bottom nav — see `App.tsx` route structure.

Dark mode hook: `src/hooks/useDarkMode.ts`. Tailwind `dark:` classes throughout.

## Testing

Vitest + Testing Library. Tests are colocated `*.test.ts` next to source. Run `npm test`
(one-shot) or `npm run test:watch`. Coverage: `npm run test:coverage`. Setup file
`src/test/setup.ts`.

Existing tests: `src/utils/{date,weight,workoutMetrics}.test.ts`. Coverage is sparse — most
business logic in stores is untested.
