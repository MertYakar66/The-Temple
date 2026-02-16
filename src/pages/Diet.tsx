import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import {
  Plus,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Trash2,
  TrendingUp,
  Utensils,
  Settings,
  Target,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useDietStore } from '../store/useDietStore';
import { useStore } from '../store/useStore';

// MacroBar component - extracted outside Diet to avoid lint warnings
function MacroBar({
  current,
  target,
  color,
  isPrimary = false,
}: {
  current: number;
  target: number;
  color: string;
  isPrimary?: boolean;
}) {
  const percentage = Math.min((current / target) * 100, 100);
  const isOver = current > target;

  return (
    <div className="w-full">
      <div className={`h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ${isPrimary ? 'h-3' : ''}`}>
        <div
          className={`h-full rounded-full transition-all ${color} ${isOver ? 'opacity-80' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function Diet() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const getLogEntriesForDate = useDietStore((s) => s.getLogEntriesForDate);
  const getDailyMacros = useDietStore((s) => s.getDailyMacros);
  const dietSettings = useDietStore((s) => s.dietSettings);
  const deleteLogEntry = useDietStore((s) => s.deleteLogEntry);
  const streaks = useDietStore((s) => s.streaks);

  // Get workout data to determine if it's a training day
  const workoutSessions = useStore((s) => s.workoutSessions);
  const todaysWorkouts = workoutSessions.filter((ws) => ws.date === dateStr);
  const isTrainingDay = todaysWorkouts.length > 0;

  // Calculate workout intensity based on volume
  const getWorkoutIntensity = () => {
    if (!isTrainingDay) return null;
    const totalVolume = todaysWorkouts.reduce((total, ws) => {
      return total + ws.exercises.reduce((exTotal, ex) => {
        return exTotal + ex.sets.reduce((setTotal, set) => {
          return setTotal + (set.completed ? set.weight * set.reps : 0);
        }, 0);
      }, 0);
    }, 0);
    if (totalVolume > 10000) return 'heavy';
    if (totalVolume > 5000) return 'moderate';
    return 'light';
  };

  const workoutIntensity = getWorkoutIntensity();

  const entries = getLogEntriesForDate(dateStr);
  const dailyMacros = getDailyMacros(dateStr);

  // Adjust targets for training day
  const baseTargets = dietSettings.goals;
  const targets = {
    calories: baseTargets.dailyCalories + (isTrainingDay ? baseTargets.trainingDayCalorieAdjustment : 0),
    protein: baseTargets.dailyProtein + (isTrainingDay ? baseTargets.trainingDayProteinAdjustment : 0),
    carbs: baseTargets.dailyCarbs,
    fat: baseTargets.dailyFat,
  };

  // Group entries by meal name
  const entriesByMealName = entries.reduce((acc, entry) => {
    const mealName = entry.mealType || 'Other';
    if (!acc[mealName]) {
      acc[mealName] = [];
    }
    acc[mealName].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();

  // Check if a day has logged entries
  const getDayStatus = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEntries = getLogEntriesForDate(dayStr);
    return dayEntries.length > 0;
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header with Calendar Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nutrition</h1>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>{format(selectedDate, 'EEEE, MMMM d')}</span>
            {!isToday && (
              <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                {format(selectedDate, 'yyyy')}
              </span>
            )}
          </button>
        </div>
        <div className="flex gap-2">
          <Link
            to="/diet/weekly"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <TrendingUp className="w-6 h-6" />
          </Link>
          <Link
            to="/diet/settings"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Settings className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Calendar */}
      {showCalendar && (
        <div className="card">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400 font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of month */}
            {daysInMonth.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isSameDay(day, new Date());
              const hasEntries = getDayStatus(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowCalendar(false);
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : isTodayDate
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {format(day, 'd')}
                  {hasEntries && !isSelected && (
                    <div className="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setCurrentMonth(new Date());
                setShowCalendar(false);
              }}
              className="flex-1 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Edit Goals Button - Prominent */}
      <Link
        to="/diet/settings"
        className="block bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl p-4 hover:from-primary-600 hover:to-primary-700 transition-all shadow-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Set Your Goals</p>
              <p className="text-sm text-primary-100">
                Target: {targets.calories} cal • {targets.protein}g protein
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </div>
      </Link>

      {/* Training Day Indicator */}
      {isTrainingDay && (
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-primary-900 dark:text-primary-100">Training Day</p>
            <p className="text-sm text-primary-700 dark:text-primary-300">
              {workoutIntensity === 'heavy' && 'Heavy session - targets adjusted +300 cal, +20g protein'}
              {workoutIntensity === 'moderate' && 'Moderate session - targets adjusted'}
              {workoutIntensity === 'light' && 'Light session - targets adjusted'}
            </p>
          </div>
        </div>
      )}

      {/* Main Macros Card */}
      <div className="card">
        {/* Calories */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-gray-900 dark:text-white">Calories</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(dailyMacros.calories)} / {targets.calories}
            </span>
          </div>
          <MacroBar current={dailyMacros.calories} target={targets.calories} color="bg-orange-500" />
          <p className={`text-sm mt-1 ${dailyMacros.calories > targets.calories ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {targets.calories - Math.round(dailyMacros.calories) > 0
              ? `${targets.calories - Math.round(dailyMacros.calories)} remaining`
              : `${Math.round(dailyMacros.calories) - targets.calories} over target`}
          </p>
        </div>

        {/* Protein - Primary */}
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Beef className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-900 dark:text-white">Protein</span>
              <span className="text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">Priority</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(dailyMacros.protein)}g / {targets.protein}g
            </span>
          </div>
          <MacroBar current={dailyMacros.protein} target={targets.protein} color="bg-red-500" isPrimary />
        </div>

        {/* Carbs & Fat */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Wheat className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Carbs</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {Math.round(dailyMacros.carbs)}g
              </span>
            </div>
            <MacroBar current={dailyMacros.carbs} target={targets.carbs} color="bg-amber-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">/ {targets.carbs}g</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Droplet className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Fat</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {Math.round(dailyMacros.fat)}g
              </span>
            </div>
            <MacroBar current={dailyMacros.fat} target={targets.fat} color="bg-yellow-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">/ {targets.fat}g</p>
          </div>
        </div>
      </div>

      {/* Streaks */}
      {(streaks.proteinStreak > 1 || streaks.loggingStreak > 1) && (
        <div className="flex gap-3">
          {streaks.proteinStreak > 1 && (
            <div className="flex-1 card bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800">
              <div className="flex items-center gap-2">
                <Beef className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-bold text-red-900 dark:text-red-300">{streaks.proteinStreak} days</p>
                  <p className="text-xs text-red-700 dark:text-red-400">Protein streak</p>
                </div>
              </div>
            </div>
          )}
          {streaks.loggingStreak > 1 && (
            <div className="flex-1 card bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-bold text-green-900 dark:text-green-300">{streaks.loggingStreak} days</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Logging streak</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/diet/log?date=${dateStr}`}
          className="card flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Log Food</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Add to diary</p>
          </div>
        </Link>
        <Link
          to="/diet/meals"
          className="card flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-accent-600 dark:text-accent-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Meals</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quick log</p>
          </div>
        </Link>
      </div>

      {/* Day's Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {isToday ? "Today's Log" : `Log for ${format(selectedDate, 'MMM d')}`}
          </h2>
          <Link
            to="/diet/weekly"
            className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center"
          >
            Weekly <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="card text-center py-8">
            <Utensils className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No meals logged {isToday ? 'today' : 'this day'}</p>
            <Link to={`/diet/log?date=${dateStr}`} className="btn-primary">
              Log First Meal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(entriesByMealName).map(([mealName, mealEntries]) => {
              const mealMacros = mealEntries.reduce(
                (acc, e) => ({
                  calories: acc.calories + e.macros.calories,
                  protein: acc.protein + e.macros.protein,
                }),
                { calories: 0, protein: 0 }
              );

              return (
                <div key={mealName} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">{mealName}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(mealMacros.calories)} cal • {Math.round(mealMacros.protein)}g protein
                    </span>
                  </div>
                  <div className="space-y-2">
                    {mealEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div>
                          <p className="text-gray-900 dark:text-white">
                            {entry.type === 'food' && entry.food?.name}
                            {entry.type === 'meal' && entry.meal?.name}
                            {entry.type === 'recipe' && entry.recipe?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {entry.servings !== 1 && `${entry.servings}x • `}
                            {Math.round(entry.macros.calories)} cal • {Math.round(entry.macros.protein)}g P
                          </p>
                        </div>
                        <button
                          onClick={() => deleteLogEntry(entry.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
