import { Link } from 'react-router-dom';
import {
  Plus,
  Dumbbell,
  Calendar,
  TrendingUp,
  Trophy,
  ChevronRight,
  Play,
  Settings,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Calculator,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useDietStore } from '../store/useDietStore';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { kgToDisplay, getWeightUnit } from '../utils/weight';
import { getDateStamp } from '../utils/date';

export function Dashboard() {
  const user = useStore((state) => state.user);
  const workoutSessions = useStore((state) => state.workoutSessions);
  const currentSession = useStore((state) => state.currentSession);
  const routines = useStore((state) => state.routines);
  const personalRecords = useStore((state) => state.personalRecords);
  const getWeeklyWorkoutCount = useStore((state) => state.getWeeklyWorkoutCount);

  const getDailyMacros = useDietStore((state) => state.getDailyMacros);
  const dietSettings = useDietStore((state) => state.dietSettings);

  const unitSystem = user?.unitSystem || 'metric';
  const weightUnit = getWeightUnit(unitSystem);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const weeklyCount = getWeeklyWorkoutCount();
  const totalWorkouts = workoutSessions.length;
  const recentPRs = personalRecords.slice(-3).reverse();

  // Calculate total volume this week
  const weeklyVolume = workoutSessions
    .filter((ws) => {
      const wsDate = parseISO(ws.date);
      return wsDate >= weekStart && wsDate <= weekEnd;
    })
    .reduce((total, ws) => {
      return (
        total +
        ws.exercises.reduce((exerciseTotal, ex) => {
          return (
            exerciseTotal +
            ex.sets.reduce((setTotal, set) => {
              return setTotal + (set.completed ? set.weight * set.reps : 0);
            }, 0)
          );
        }, 0)
      );
    }, 0);

  // Daily nutrition progress
  const todayStr = getDateStamp();
  const todayMacros = getDailyMacros(todayStr);
  const goals = dietSettings.goals;
  const calPercent = goals.dailyCalories > 0 ? Math.min(100, Math.round((todayMacros.calories / goals.dailyCalories) * 100)) : 0;
  const proteinPercent = goals.dailyProtein > 0 ? Math.min(100, Math.round((todayMacros.protein / goals.dailyProtein) * 100)) : 0;
  const carbsPercent = goals.dailyCarbs > 0 ? Math.min(100, Math.round((todayMacros.carbs / goals.dailyCarbs) * 100)) : 0;
  const fatPercent = goals.dailyFat > 0 ? Math.min(100, Math.round((todayMacros.fat / goals.dailyFat) * 100)) : 0;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header with Settings */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hey, {user?.name?.split(' ')[0] || 'Athlete'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(today, 'EEEE, MMMM d')}
          </p>
        </div>
        <Link
          to="/settings"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Settings className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </Link>
      </div>

      {/* Current Session Banner */}
      {currentSession && (
        <Link
          to="/workout"
          className="block bg-primary-600 text-white rounded-xl p-4 shadow-lg animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Workout in progress</p>
              <p className="font-semibold text-lg">{currentSession.name}</p>
              <p className="text-primary-100 text-sm">
                {currentSession.exercises.length} exercises
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6" />
            </div>
          </div>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/workout"
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Start Workout</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Log a session</p>
            </div>
          </div>
        </Link>
        <Link
          to="/routines"
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Routines</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{routines.length} saved</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Weekly Stats */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">This Week</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Workouts</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-success-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(() => {
                const displayVolume = Math.round(kgToDisplay(weeklyVolume, unitSystem));
                return displayVolume > 1000 ? `${(displayVolume / 1000).toFixed(1)}k` : displayVolume;
              })()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Volume ({weightUnit})</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-warning-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6 text-warning-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{personalRecords.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">PRs</p>
          </div>
        </div>
      </div>

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent PRs</h2>
            <Link
              to="/progress"
              className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPRs.map((pr, index) => (
              <div
                key={`${pr.exerciseId}-${pr.reps}-${index}`}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{pr.exerciseName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(kgToDisplay(pr.weight, unitSystem) * 10) / 10} {weightUnit} x {pr.reps} reps
                  </p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{pr.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Nutrition Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Today's Nutrition</h2>
          <div className="flex items-center gap-2">
            <Link
              to="/tdee-calculator"
              className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center"
            >
              <Calculator className="w-4 h-4 mr-1" />
              TDEE
            </Link>
            <Link
              to="/diet"
              className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center"
            >
              Log <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Calorie summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories</span>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{Math.round(todayMacros.calories)}</span>
            {' / '}{goals.dailyCalories}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all ${
              calPercent >= 100 ? 'bg-orange-500' : 'bg-orange-400'
            }`}
            style={{ width: `${calPercent}%` }}
          />
        </div>

        {/* Macro bars */}
        <div className="grid grid-cols-3 gap-3">
          {/* Protein */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Beef className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Protein</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
              <div
                className="h-2 rounded-full bg-red-400 transition-all"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{Math.round(todayMacros.protein)}g</span>
              {' / '}{goals.dailyProtein}g
            </p>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Wheat className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Carbs</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
              <div
                className="h-2 rounded-full bg-amber-400 transition-all"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{Math.round(todayMacros.carbs)}g</span>
              {' / '}{goals.dailyCarbs}g
            </p>
          </div>

          {/* Fat */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Droplet className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Fat</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
              <div
                className="h-2 rounded-full bg-yellow-400 transition-all"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{Math.round(todayMacros.fat)}g</span>
              {' / '}{goals.dailyFat}g
            </p>
          </div>
        </div>
      </div>

      {/* Empty State for New Users */}
      {totalWorkouts === 0 && routines.length === 0 && (
        <div className="card text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Ready to start your journey?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Log your first workout or create a routine to get started!
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/workout" className="btn-primary">
              Start Workout
            </Link>
            <Link to="/routines/new" className="btn-outline">
              Create Routine
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
