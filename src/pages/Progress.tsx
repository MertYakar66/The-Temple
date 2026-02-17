import { useState } from 'react';
import {
  Trophy,
  TrendingUp,
  Calendar,
  Dumbbell,
  BarChart3,
  Flame,
  Beef,
  Scale,
  Target,
  Plus,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useStore } from '../store/useStore';
import { useDietStore } from '../store/useDietStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { isDateStampInRange } from '../utils/date';
import { getCompletedSetCount, getTotalVolume } from '../utils/workoutMetrics';
import type { WeightEntry } from '../types';

type TimeRange = '7d' | '30d' | '90d' | 'all';
type ProgressTab = 'workout' | 'nutrition' | 'body';

export function Progress() {
  const workoutSessions = useStore((state) => state.workoutSessions);
  const personalRecords = useStore((state) => state.personalRecords);
  const exercises = useStore((state) => state.exercises);
  const getExerciseHistory = useStore((state) => state.getExerciseHistory);
  const weightEntries = useStore((state) => state.weightEntries);
  const addWeightEntry = useStore((state) => state.addWeightEntry);
  const deleteWeightEntry = useStore((state) => state.deleteWeightEntry);

  const getDailyMacros = useDietStore((state) => state.getDailyMacros);
  const dietSettings = useDietStore((state) => state.dietSettings);

  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProgressTab>('workout');

  // Weight entry form state
  const [newWeight, setNewWeight] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [showWeightNotes, setShowWeightNotes] = useState(false);
  const [showWeightHistory, setShowWeightHistory] = useState(false);

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight);
    if (weight > 0) {
      addWeightEntry(weight, weightNotes.trim() || undefined);
      setNewWeight('');
      setWeightNotes('');
      setShowWeightNotes(false);
    }
  };

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

  // Calculate workout stats
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

  // Diet tracking data
  const dietTrackingData = (() => {
    const days = eachDayOfInterval({ start: rangeStart, end: today });
    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const macros = getDailyMacros(dayStr);
      const hasWorkout = workoutSessions.some(ws => ws.date === dayStr);
      const targets = {
        calories: dietSettings.goals.dailyCalories + (hasWorkout ? dietSettings.goals.trainingDayCalorieAdjustment : 0),
        protein: dietSettings.goals.dailyProtein + (hasWorkout ? dietSettings.goals.trainingDayProteinAdjustment : 0),
      };
      return {
        date: format(day, 'MMM d'),
        calories: Math.round(macros.calories),
        protein: Math.round(macros.protein),
        calorieTarget: targets.calories,
        proteinTarget: targets.protein,
        logged: macros.calories > 0,
      };
    });
  })();

  // Calculate diet stats
  const daysWithLogging = dietTrackingData.filter(d => d.logged).length;
  const avgCalories = daysWithLogging > 0
    ? Math.round(dietTrackingData.filter(d => d.logged).reduce((sum, d) => sum + d.calories, 0) / daysWithLogging)
    : 0;
  const avgProtein = daysWithLogging > 0
    ? Math.round(dietTrackingData.filter(d => d.logged).reduce((sum, d) => sum + d.protein, 0) / daysWithLogging)
    : 0;
  const proteinGoalDays = dietTrackingData.filter(d => d.logged && d.protein >= d.proteinTarget * 0.9).length;

  // Body weight tracking data
  const bodyWeightData = weightEntries
    .filter((entry: WeightEntry) => isDateStampInRange(entry.date, rangeStart, today))
    .sort((a: WeightEntry, b: WeightEntry) => a.date.localeCompare(b.date))
    .map((entry: WeightEntry) => ({
      date: format(new Date(entry.date), 'MMM d'),
      weight: entry.weight,
    }));

  const latestWeight = weightEntries.length > 0
    ? weightEntries[weightEntries.length - 1]?.weight
    : null;
  const earliestWeight = bodyWeightData.length > 0 ? bodyWeightData[0]?.weight : null;
  const weightChange = latestWeight && earliestWeight ? latestWeight - earliestWeight : null;

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('workout')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'workout'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span className="hidden sm:inline">Workout</span>
        </button>
        <button
          onClick={() => setActiveTab('nutrition')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'nutrition'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="hidden sm:inline">Nutrition</span>
        </button>
        <button
          onClick={() => setActiveTab('body')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'body'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span className="hidden sm:inline">Body</span>
        </button>
      </div>

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
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Workout Tab */}
      {activeTab === 'workout' && (
        <>
          {/* Stats overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalWorkouts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Workouts</p>
            </div>
            <div className="card text-center">
              <div className="w-10 h-10 bg-success-500/10 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-success-500 dark:text-success-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(0)}k` : totalVolume}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Volume (kg)</p>
            </div>
            <div className="card text-center">
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Dumbbell className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSets}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sets</p>
            </div>
          </div>

          {/* Workout frequency chart */}
          {filteredSessions.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Workout Frequency</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={workoutFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
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
              <h2 className="font-semibold text-gray-900 dark:text-white">Personal Records</h2>
              <Trophy className="w-5 h-5 text-warning-500" />
            </div>
            {personalRecords.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No PRs yet. Keep lifting!
              </p>
            ) : (
              <div className="space-y-3">
                {personalRecords.slice(-5).reverse().map((pr, index) => (
                  <div
                    key={`${pr.exerciseId}-${pr.reps}-${index}`}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{pr.exerciseName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pr.weight} kg × {pr.reps} reps
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{pr.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exercise Progress */}
          {loggedExercises.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Exercise Progress</h2>

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
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB',
                        }}
                      />
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
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No data for this exercise yet
                </p>
              )}
            </div>
          )}

          {/* Empty state */}
          {workoutSessions.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No data yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete some workouts to see your progress here
              </p>
            </div>
          )}
        </>
      )}

      {/* Nutrition Tab */}
      {activeTab === 'nutrition' && (
        <>
          {/* Diet Stats Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgCalories}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Calories/Day</p>
            </div>
            <div className="card text-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Beef className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgProtein}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Protein/Day</p>
            </div>
            <div className="card text-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{proteinGoalDays}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Protein Goal Days</p>
            </div>
            <div className="card text-center">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{daysWithLogging}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Days Logged</p>
            </div>
          </div>

          {/* Calorie Chart */}
          {daysWithLogging > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Calorie Intake</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dietTrackingData.filter(d => d.logged)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      stroke="#F97316"
                      fill="#F97316"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      name="Calories"
                    />
                    <Line
                      type="monotone"
                      dataKey="calorieTarget"
                      stroke="#9CA3AF"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Target"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Protein Chart */}
          {daysWithLogging > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Protein Intake</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dietTrackingData.filter(d => d.logged)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="protein"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      name="Protein (g)"
                    />
                    <Line
                      type="monotone"
                      dataKey="proteinTarget"
                      stroke="#9CA3AF"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Target"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Empty state */}
          {daysWithLogging === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No nutrition data yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start logging your meals to track your nutrition progress
              </p>
            </div>
          )}
        </>
      )}

      {/* Body Tab */}
      {activeTab === 'body' && (
        <>
          {/* Log Weight Card */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Log Weight</h2>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWeight()}
                  className="w-full pl-9 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Weight"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">kg</span>
              </div>
              <button
                onClick={() => setShowWeightNotes(!showWeightNotes)}
                className={`p-2.5 rounded-lg border transition-colors ${
                  showWeightNotes
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={handleAddWeight}
                disabled={!newWeight || parseFloat(newWeight) <= 0}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Log
              </button>
            </div>
            {showWeightNotes && (
              <textarea
                value={weightNotes}
                onChange={(e) => setWeightNotes(e.target.value)}
                className="w-full mt-2 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                placeholder="How are you feeling today? Any notes..."
                rows={2}
              />
            )}
          </div>

          {/* Weight Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Scale className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {latestWeight ? `${latestWeight} kg` : '--'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Weight</p>
            </div>
            <div className="card text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                weightChange !== null && weightChange < 0
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : weightChange !== null && weightChange > 0
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <TrendingUp className={`w-5 h-5 ${
                  weightChange !== null && weightChange < 0
                    ? 'text-green-500'
                    : weightChange !== null && weightChange > 0
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`} />
              </div>
              <p className={`text-2xl font-bold ${
                weightChange !== null && weightChange < 0
                  ? 'text-green-600 dark:text-green-400'
                  : weightChange !== null && weightChange > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '--'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Change ({timeRange})</p>
            </div>
          </div>

          {/* Weight Chart */}
          {bodyWeightData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Weight Trend</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyWeightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                      name="Weight (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Weight History */}
          <div className="card">
            <button
              onClick={() => setShowWeightHistory(!showWeightHistory)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="font-semibold text-gray-900 dark:text-white">Weight History</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {weightEntries.length} {weightEntries.length === 1 ? 'entry' : 'entries'}
              </span>
            </button>

            {showWeightHistory && weightEntries.length > 0 && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {weightEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {entry.weight} kg
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteWeightEntry(entry.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showWeightHistory && weightEntries.length === 0 && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                No entries yet. Log your first weight above!
              </p>
            )}
          </div>

          {/* Empty state for chart */}
          {bodyWeightData.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Log your weight to see trends on the chart
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
