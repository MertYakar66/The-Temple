import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Beef,
  Check,
  X,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { useDietStore } from '../store/useDietStore';
import { useStore } from '../store/useStore';

export function DietWeekly() {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const getDailyMacros = useDietStore((s) => s.getDailyMacros);
  const getLogEntriesForDate = useDietStore((s) => s.getLogEntriesForDate);
  const dietSettings = useDietStore((s) => s.dietSettings);
  const getWeeklyStats = useDietStore((s) => s.getWeeklyStats);

  const workoutSessions = useStore((s) => s.workoutSessions);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
  const stats = getWeeklyStats(weekStartStr);

  const targets = dietSettings.goals;
  const today = new Date();

  const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const isCurrentWeek = isSameDay(startOfWeek(today, { weekStartsOn: 1 }), currentWeekStart);

  // Calculate alignment score (how well intake matched training days)
  const calculateAlignment = () => {
    let alignedDays = 0;
    let trainingDays = 0;

    weekDates.forEach((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isTrainingDay = workoutSessions.some((ws) => ws.date === dateStr);
      if (isTrainingDay) {
        trainingDays++;
        const macros = getDailyMacros(dateStr);
        // Consider aligned if calories are within 10% of adjusted target
        const adjustedTarget = targets.dailyCalories + targets.trainingDayCalorieAdjustment;
        if (macros.calories >= adjustedTarget * 0.9 && macros.calories <= adjustedTarget * 1.1) {
          alignedDays++;
        }
      }
    });

    return { alignedDays, trainingDays };
  };

  const alignment = calculateAlignment();

  // Feedback messages
  const getFeedback = () => {
    const messages: string[] = [];

    if (stats.proteinHitDays < 3 && stats.totalDaysLogged >= 3) {
      messages.push('Protein target missed on multiple days. Consider adding more protein-rich foods.');
    } else if (stats.proteinHitDays >= 5) {
      messages.push('Strong protein adherence this week.');
    }

    if (stats.avgCalories > 0 && stats.avgCalories < targets.dailyCalories * 0.8) {
      messages.push('Average calories significantly below target. This may impact training recovery.');
    }

    if (alignment.trainingDays > 0 && alignment.alignedDays < alignment.trainingDays) {
      messages.push(`Nutrition not optimally aligned with ${alignment.trainingDays - alignment.alignedDays} training day(s).`);
    }

    if (stats.totalDaysLogged < 4) {
      messages.push('Incomplete logging this week. Consistency helps track progress accurately.');
    }

    return messages;
  };

  const feedback = getFeedback();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/diet')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="ml-4 font-semibold text-gray-900 dark:text-white">Weekly Summary</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={prevWeek} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold text-gray-900 dark:text-white">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </p>
            {isCurrentWeek && <span className="text-xs text-primary-600 dark:text-primary-400">This Week</span>}
          </div>
          <button
            onClick={nextWeek}
            disabled={isCurrentWeek}
            className={`p-2 rounded-lg text-gray-900 dark:text-white ${isCurrentWeek ? 'opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgCalories}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Calories</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Target: {targets.dailyCalories}</p>
          </div>
          <div className="card text-center">
            <Beef className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgProtein}g</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Protein</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Target: {targets.dailyProtein}g</p>
          </div>
          <div className="card text-center">
            <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.proteinHitDays}/7</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Protein Days</p>
          </div>
          <div className="card text-center">
            <Dumbbell className="w-6 h-6 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {alignment.alignedDays}/{alignment.trainingDays}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Training Aligned</p>
          </div>
        </div>

        {/* Day by Day */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Breakdown</h3>
          <div className="space-y-3">
            {weekDates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const entries = getLogEntriesForDate(dateStr);
              const macros = getDailyMacros(dateStr);
              const isTrainingDay = workoutSessions.some((ws) => ws.date === dateStr);
              const proteinHit = macros.protein >= targets.dailyProtein * 0.9;
              const isToday = isSameDay(date, today);
              const isFuture = date > today;

              return (
                <div
                  key={dateStr}
                  className={`flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                    isToday ? 'bg-primary-50 dark:bg-primary-900/20 -mx-4 px-4 rounded-lg' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{format(date, 'EEE')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{format(date, 'd')}</p>
                    </div>
                    {isTrainingDay && (
                      <Dumbbell className="w-4 h-4 text-primary-500" />
                    )}
                  </div>

                  {isFuture ? (
                    <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                  ) : entries.length === 0 ? (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Not logged</span>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {Math.round(macros.calories)} cal
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(macros.protein)}g protein
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          proteinHit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        }`}
                      >
                        {proteinHit ? (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {feedback.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Insights</h3>
            <div className="space-y-2">
              {feedback.map((msg, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{msg}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trend Comparison */}
        {stats.avgCalories > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">vs Target</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Calories</span>
                <div className="flex items-center gap-2">
                  {stats.avgCalories >= targets.dailyCalories * 0.95 &&
                  stats.avgCalories <= targets.dailyCalories * 1.05 ? (
                    <>
                      <Minus className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">On target</span>
                    </>
                  ) : stats.avgCalories < targets.dailyCalories ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400">
                        {Math.round(targets.dailyCalories - stats.avgCalories)} under
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400">
                        {Math.round(stats.avgCalories - targets.dailyCalories)} over
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Protein</span>
                <div className="flex items-center gap-2">
                  {stats.avgProtein >= targets.dailyProtein * 0.9 ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Meeting target</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">
                        {Math.round(targets.dailyProtein - stats.avgProtein)}g below
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
