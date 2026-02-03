import { useState } from 'react';
import {
  Trophy,
  TrendingUp,
  Calendar,
  Dumbbell,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../store/useStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { isDateStampInRange } from '../utils/date';
import { getCompletedSetCount, getTotalVolume } from '../utils/workoutMetrics';

type TimeRange = '7d' | '30d' | '90d' | 'all';

export function Progress() {
  const workoutSessions = useStore((state) => state.workoutSessions);
  const personalRecords = useStore((state) => state.personalRecords);
  const exercises = useStore((state) => state.exercises);
  const getExerciseHistory = useStore((state) => state.getExerciseHistory);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Calculate date range
  const today = new Date();
  const getRangeStart = () => {
    switch (timeRange) {
      case '7d':
        return subDays(today, 7);
      case '30d':
        return subDays(today, 30);
      case '90d':
        return subDays(today, 90);
      case 'all':
        return new Date('2000-01-01');
    }
  };

  const rangeStart = getRangeStart();
  const filteredSessions = workoutSessions.filter((ws) =>
    isDateStampInRange(ws.date, rangeStart, today)
  );

  // Calculate stats
  const totalWorkouts = filteredSessions.length;
  const totalVolume = filteredSessions.reduce(
    (total, ws) => total + getTotalVolume(ws.exercises),
    0
  );

  const totalSets = filteredSessions.reduce(
    (total, ws) => total + getCompletedSetCount(ws.exercises),
    0
  );

  // Workout frequency data for chart
  const workoutFrequencyData = (() => {
    const days = eachDayOfInterval({ start: rangeStart, end: today });
    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = filteredSessions.filter((ws) => ws.date === dayStr).length;
      return {
        date: format(day, 'MMM d'),
        workouts: count,
      };
    });
  })();

  // Get unique exercises that have been logged
  const loggedExerciseIds = new Set(
    workoutSessions.flatMap((ws) => ws.exercises.map((e) => e.exerciseId))
  );
  const loggedExercises = exercises.filter((e) => loggedExerciseIds.has(e.id));

  // Get exercise progress data
  const exerciseHistory = selectedExercise
    ? getExerciseHistory(selectedExercise)
    : [];

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Progress</h1>

      {/* Time range filter */}
      <div className="flex gap-2">
        {([
          { id: '7d', label: '7 Days' },
          { id: '30d', label: '30 Days' },
          { id: '90d', label: '90 Days' },
          { id: 'all', label: 'All Time' },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTimeRange(id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              timeRange === id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalWorkouts}</p>
          <p className="text-xs text-gray-500">Workouts</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-success-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(0)}k` : totalVolume}
          </p>
          <p className="text-xs text-gray-500">Volume (kg)</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Dumbbell className="w-5 h-5 text-accent-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSets}</p>
          <p className="text-xs text-gray-500">Sets</p>
        </div>
      </div>

      {/* Workout frequency chart */}
      {filteredSessions.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Workout Frequency</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workoutFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="workouts"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Personal Records */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Personal Records</h2>
          <Trophy className="w-5 h-5 text-warning-500" />
        </div>
        {personalRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No PRs yet. Keep lifting!
          </p>
        ) : (
          <div className="space-y-3">
            {personalRecords.slice(-5).reverse().map((pr, index) => (
              <div
                key={`${pr.exerciseId}-${pr.reps}-${index}`}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{pr.exerciseName}</p>
                  <p className="text-sm text-gray-500">
                    {pr.weight} kg × {pr.reps} reps
                  </p>
                </div>
                <span className="text-sm text-gray-500">{pr.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Progress */}
      {loggedExercises.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Exercise Progress</h2>

          {/* Exercise selector */}
          <select
            value={selectedExercise || ''}
            onChange={(e) => setSelectedExercise(e.target.value || null)}
            className="input mb-4"
          >
            <option value="">Select an exercise</option>
            {loggedExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>

          {selectedExercise && exerciseHistory.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exerciseHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Max Weight (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedExercise && exerciseHistory.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No data for this exercise yet
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {workoutSessions.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No data yet</h3>
          <p className="text-gray-600">
            Complete some workouts to see your progress here
          </p>
        </div>
      )}
    </div>
  );
}
