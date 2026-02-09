import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Layout } from './components/layout/Layout';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Workout } from './pages/Workout';
import { Exercises } from './pages/Exercises';
import { Routines } from './pages/Routines';
import { RoutineEditor } from './pages/RoutineEditor';
import { RoutineDetail } from './pages/RoutineDetail';
import { Progress } from './pages/Progress';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { WorkoutTemplates } from './pages/WorkoutTemplates';
// Diet Module
import { Diet } from './pages/Diet';
import { DietLog } from './pages/DietLog';
import { DietMeals } from './pages/DietMeals';
import { DietMealNew } from './pages/DietMealNew';
import { DietWeekly } from './pages/DietWeekly';
import { DietSettings } from './pages/DietSettings';
import { DietFoodNew } from './pages/DietFoodNew';
// Components
import { PRCelebration } from './components/PRCelebration';

function AppRoutes() {
  const user = useStore((state) => state.user);
  const hasCompletedOnboarding = user?.onboardingCompleted;

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
    <Routes>
      {/* Main app routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/diet" element={<Diet />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/history" element={<History />} />
      </Route>

      {/* Routes without bottom nav */}
      <Route path="/routines" element={<Routines />} />
      <Route path="/routines/new" element={<RoutineEditor />} />
      <Route path="/routines/:id" element={<RoutineDetail />} />
      <Route path="/routines/:id/edit" element={<RoutineEditor />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/templates" element={<WorkoutTemplates />} />

      {/* Diet routes without bottom nav */}
      <Route path="/diet/log" element={<DietLog />} />
      <Route path="/diet/meals" element={<DietMeals />} />
      <Route path="/diet/meals/new" element={<DietMealNew />} />
      <Route path="/diet/weekly" element={<DietWeekly />} />
      <Route path="/diet/settings" element={<DietSettings />} />
      <Route path="/diet/food/new" element={<DietFoodNew />} />

      {/* Redirect to dashboard if onboarding is complete */}
      <Route path="/onboarding" element={<Navigate to="/" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <PRCelebration />
    </BrowserRouter>
  );
}

export default App;
