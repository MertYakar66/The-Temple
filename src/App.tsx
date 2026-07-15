import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
// Eager — the auth/onboarding shell a logged-out or brand-new user sees first.
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
// Components (part of the shell, rendered on every authenticated route)
import { PRCelebration } from './components/PRCelebration';
import { Dumbbell } from 'lucide-react';

// Lazy-loaded authenticated route tree — split out of the initial bundle so a
// logged-out visitor hitting /login doesn't download the whole app (incl.
// recharts + firebase) before seeing the form. These pages use named exports,
// so each import is mapped to a `default` for React.lazy.
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Workout = lazy(() => import('./pages/Workout').then((m) => ({ default: m.Workout })));
const Exercises = lazy(() => import('./pages/Exercises').then((m) => ({ default: m.Exercises })));
const ExerciseDetailRoute = lazy(() => import('./pages/ExerciseDetailRoute').then((m) => ({ default: m.ExerciseDetailRoute })));
const Routines = lazy(() => import('./pages/Routines').then((m) => ({ default: m.Routines })));
const RoutineEditor = lazy(() => import('./pages/RoutineEditor').then((m) => ({ default: m.RoutineEditor })));
const RoutineDetail = lazy(() => import('./pages/RoutineDetail').then((m) => ({ default: m.RoutineDetail })));
const Progress = lazy(() => import('./pages/Progress').then((m) => ({ default: m.Progress })));
const History = lazy(() => import('./pages/History').then((m) => ({ default: m.History })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const WorkoutTemplates = lazy(() => import('./pages/WorkoutTemplates').then((m) => ({ default: m.WorkoutTemplates })));
const Blocks = lazy(() => import('./pages/Blocks').then((m) => ({ default: m.Blocks })));
// Diet Module
const Diet = lazy(() => import('./pages/Diet').then((m) => ({ default: m.Diet })));
const DietLog = lazy(() => import('./pages/DietLog').then((m) => ({ default: m.DietLog })));
const DietMeals = lazy(() => import('./pages/DietMeals').then((m) => ({ default: m.DietMeals })));
const DietMealEditor = lazy(() => import('./pages/DietMealEditor').then((m) => ({ default: m.DietMealEditor })));
const DietWeekly = lazy(() => import('./pages/DietWeekly').then((m) => ({ default: m.DietWeekly })));
const DietSettings = lazy(() => import('./pages/DietSettings').then((m) => ({ default: m.DietSettings })));
const DietFoodNew = lazy(() => import('./pages/DietFoodNew').then((m) => ({ default: m.DietFoodNew })));
const DietRecipeEditor = lazy(() => import('./pages/DietRecipeEditor').then((m) => ({ default: m.DietRecipeEditor })));
const TDEECalculator = lazy(() => import('./pages/TDEECalculator').then((m) => ({ default: m.TDEECalculator })));
// Calendar Module
const Calendar = lazy(() => import('./pages/Calendar').then((m) => ({ default: m.Calendar })));
const CalendarEventEditor = lazy(() => import('./pages/CalendarEventEditor').then((m) => ({ default: m.CalendarEventEditor })));
const CalendarEventDetail = lazy(() => import('./pages/CalendarEventDetail').then((m) => ({ default: m.CalendarEventDetail })));
const CalendarManage = lazy(() => import('./pages/CalendarManage').then((m) => ({ default: m.CalendarManage })));
const CalendarSearch = lazy(() => import('./pages/CalendarSearch').then((m) => ({ default: m.CalendarSearch })));
const CalendarSettingsPage = lazy(() => import('./pages/CalendarSettings').then((m) => ({ default: m.CalendarSettings })));
const CalendarInvitations = lazy(() => import('./pages/CalendarInvitations').then((m) => ({ default: m.CalendarInvitations })));
const SiriSetup = lazy(() => import('./pages/SiriSetup').then((m) => ({ default: m.SiriSetup })));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
      <div className="text-center text-white">
        <Dumbbell className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { currentUser, loading } = useAuth();
  const user = useStore((state) => state.user);
  const hasCompletedOnboarding = user?.onboardingCompleted;

  // Show loading while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Show login/signup if not authenticated
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* Main app routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/diet" element={<Diet />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/exercises/:exerciseId" element={<ExerciseDetailRoute />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/history" element={<History />} />
        <Route path="/blocks" element={<Blocks />} />
      </Route>

      {/* Routes without bottom nav */}
      <Route path="/routines" element={<Routines />} />
      <Route path="/routines/new" element={<RoutineEditor />} />
      <Route path="/routines/:id" element={<RoutineDetail />} />
      <Route path="/routines/:id/edit" element={<RoutineEditor />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/siri" element={<SiriSetup />} />
      <Route path="/templates" element={<WorkoutTemplates />} />

      {/* Calendar routes without bottom nav */}
      <Route path="/calendar/event" element={<CalendarEventDetail />} />
      <Route path="/calendar/event/edit" element={<CalendarEventEditor />} />
      <Route path="/calendar/manage" element={<CalendarManage />} />
      <Route path="/calendar/search" element={<CalendarSearch />} />
      <Route path="/calendar/settings" element={<CalendarSettingsPage />} />
      <Route path="/calendar/invitations" element={<CalendarInvitations />} />

      {/* TDEE Calculator */}
      <Route path="/tdee-calculator" element={<TDEECalculator />} />

      {/* Diet routes without bottom nav */}
      <Route path="/diet/log" element={<DietLog />} />
      <Route path="/diet/meals" element={<DietMeals />} />
      <Route path="/diet/meals/new" element={<DietMealEditor />} />
      <Route path="/diet/meals/:id/edit" element={<DietMealEditor />} />
      <Route path="/diet/weekly" element={<DietWeekly />} />
      <Route path="/diet/settings" element={<DietSettings />} />
      <Route path="/diet/food/new" element={<DietFoodNew />} />
      <Route path="/diet/recipes/new" element={<DietRecipeEditor />} />
      <Route path="/diet/recipes/:id/edit" element={<DietRecipeEditor />} />

      {/* Auth routes - redirect if already logged in */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />

      {/* Redirect to dashboard if onboarding is complete */}
      <Route path="/onboarding" element={<Navigate to="/" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <PRCelebration />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
