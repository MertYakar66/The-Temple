import { Link } from 'react-router-dom';
import {
  Plus,
  Dumbbell,
  Calendar,
  TrendingUp,
  Trophy,
  ChevronRight,
  Play,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export function Dashboard() {
  const user = useStore((state) => state.user);
  const workoutSessions = useStore((state) => state.workoutSessions);
  const currentSession = useStore((state) => state.currentSession);
  const routines = useStore((state) => state.routines);
  const personalRecords = useStore((state) => state.personalRecords);
  const getWeeklyWorkoutCount = useStore((state) => state.getWeeklyWorkoutCount);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const weeklyCount = getWeeklyWorkoutCount();
  const totalWorkouts = workoutSessions.length;
  const recentPRs = personalRecords.slice(-3).reverse();

  // Calculate total volume this week
  const weeklyVolume = workoutSessions
    .filter((ws) => {
      const wsDate = new Date(ws.date);
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

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hey, {user?.name?.split(' ')[0] || 'Athlete'}!
        </h1>
        <p className="text-gray-600">
          {format(today, 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Current Session Banner */}
      {currentSession && (
        <Link
          to="/workout"
          className="block bg-primary-600 text-white rounded-xl p-4"
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
          className="card flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Start Workout</p>
            <p className="text-sm text-gray-500">Log a session</p>
          </div>
        </Link>
        <Link
          to="/routines"
          className="card flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-accent-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Routines</p>
            <p className="text-sm text-gray-500">{routines.length} saved</p>
          </div>
        </Link>
      </div>

      {/* Weekly Stats */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">This Week</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{weeklyCount}</p>
            <p className="text-sm text-gray-500">Workouts</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-success-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {weeklyVolume > 1000 ? `${(weeklyVolume / 1000).toFixed(1)}k` : weeklyVolume}
            </p>
            <p className="text-sm text-gray-500">Volume (kg)</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-warning-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6 text-warning-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{personalRecords.length}</p>
            <p className="text-sm text-gray-500">PRs</p>
          </div>
        </div>
      </div>

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent PRs</h2>
            <Link
              to="/progress"
              className="text-primary-600 text-sm font-medium flex items-center"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPRs.map((pr, index) => (
              <div
                key={`${pr.exerciseId}-${pr.reps}-${index}`}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{pr.exerciseName}</p>
                  <p className="text-sm text-gray-500">
                    {pr.weight} kg x {pr.reps} reps
                  </p>
                </div>
                <span className="text-sm text-gray-500">{pr.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Routines */}
      {routines.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Your Routines</h2>
            <Link
              to="/routines"
              className="text-primary-600 text-sm font-medium flex items-center"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {routines.slice(0, 3).map((routine) => (
              <Link
                key={routine.id}
                to={`/routines/${routine.id}`}
                className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{routine.name}</p>
                  <p className="text-sm text-gray-500">
                    {routine.exercises.length} exercises
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for New Users */}
      {totalWorkouts === 0 && routines.length === 0 && (
        <div className="card text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Ready to start your journey?
          </h3>
          <p className="text-gray-600 mb-4">
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
