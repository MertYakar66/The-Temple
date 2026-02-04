import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ChevronRight,
  Dumbbell,
  Trash2,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { useDietStore } from '../store/useDietStore';
import { useStore } from '../store/useStore';
import type { MealType } from '../types';

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
};

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

export function Diet() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const getLogEntriesForDate = useDietStore((s) => s.getLogEntriesForDate);
  const getDailyMacros = useDietStore((s) => s.getDailyMacros);
  const dietSettings = useDietStore((s) => s.dietSettings);
  const deleteLogEntry = useDietStore((s) => s.deleteLogEntry);
  const streaks = useDietStore((s) => s.streaks);

  // Get workout data to determine if it's a training day
  const workoutSessions = useStore((s) => s.workoutSessions);
  const todaysWorkouts = workoutSessions.filter((ws) => ws.date === today);
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

  const entries = getLogEntriesForDate(today);
  const dailyMacros = getDailyMacros(today);

  // Adjust targets for training day
  const baseTargets = dietSettings.goals;
  const targets = {
    calories: baseTargets.dailyCalories + (isTrainingDay ? baseTargets.trainingDayCalorieAdjustment : 0),
    protein: baseTargets.dailyProtein + (isTrainingDay ? baseTargets.trainingDayProteinAdjustment : 0),
    carbs: baseTargets.dailyCarbs,
    fat: baseTargets.dailyFat,
  };

  // Group entries by meal type
  const entriesByMealType = mealTypeOrder.reduce((acc, mealType) => {
    acc[mealType] = entries.filter((e) => e.mealType === mealType);
    return acc;
  }, {} as Record<MealType, typeof entries>);

  const MacroBar = ({
    current,
    target,
    color,
    isPrimary = false,
  }: {
    current: number;
    target: number;
    color: string;
    isPrimary?: boolean;
  }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOver = current > target;

    return (
      <div className="w-full">
        <div className={`h-2 rounded-full bg-gray-200 overflow-hidden ${isPrimary ? 'h-3' : ''}`}>
          <div
            className={`h-full rounded-full transition-all ${color} ${isOver ? 'opacity-80' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrition</h1>
          <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <Link
          to="/diet/settings"
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <TrendingUp className="w-6 h-6" />
        </Link>
      </div>

      {/* Training Day Indicator */}
      {isTrainingDay && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-primary-900">Training Day</p>
            <p className="text-sm text-primary-700">
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
              <span className="font-semibold text-gray-900">Calories</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {Math.round(dailyMacros.calories)} / {targets.calories}
            </span>
          </div>
          <MacroBar current={dailyMacros.calories} target={targets.calories} color="bg-orange-500" />
          <p className="text-sm text-gray-500 mt-1">
            {targets.calories - Math.round(dailyMacros.calories) > 0
              ? `${targets.calories - Math.round(dailyMacros.calories)} remaining`
              : `${Math.round(dailyMacros.calories) - targets.calories} over target`}
          </p>
        </div>

        {/* Protein - Primary */}
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Beef className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-900">Protein</span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Priority</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
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
                <span className="text-sm text-gray-700">Carbs</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(dailyMacros.carbs)}g
              </span>
            </div>
            <MacroBar current={dailyMacros.carbs} target={targets.carbs} color="bg-amber-500" />
            <p className="text-xs text-gray-500 mt-1">/ {targets.carbs}g</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Droplet className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">Fat</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(dailyMacros.fat)}g
              </span>
            </div>
            <MacroBar current={dailyMacros.fat} target={targets.fat} color="bg-blue-500" />
            <p className="text-xs text-gray-500 mt-1">/ {targets.fat}g</p>
          </div>
        </div>
      </div>

      {/* Streaks */}
      {(streaks.proteinStreak > 1 || streaks.loggingStreak > 1) && (
        <div className="flex gap-3">
          {streaks.proteinStreak > 1 && (
            <div className="flex-1 card bg-red-50 border-red-100">
              <div className="flex items-center gap-2">
                <Beef className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-bold text-red-900">{streaks.proteinStreak} days</p>
                  <p className="text-xs text-red-700">Protein streak</p>
                </div>
              </div>
            </div>
          )}
          {streaks.loggingStreak > 1 && (
            <div className="flex-1 card bg-green-50 border-green-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-bold text-green-900">{streaks.loggingStreak} days</p>
                  <p className="text-xs text-green-700">Logging streak</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/diet/log"
          className="card flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Log Food</p>
            <p className="text-sm text-gray-500">Add to diary</p>
          </div>
        </Link>
        <Link
          to="/diet/meals"
          className="card flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-accent-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Meals</p>
            <p className="text-sm text-gray-500">Quick log</p>
          </div>
        </Link>
      </div>

      {/* Today's Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Today's Log</h2>
          <Link
            to="/diet/weekly"
            className="text-primary-600 text-sm font-medium flex items-center"
          >
            Weekly <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="card text-center py-8">
            <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No meals logged today</p>
            <Link to="/diet/log" className="btn-primary">
              Log First Meal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mealTypeOrder.map((mealType) => {
              const mealEntries = entriesByMealType[mealType];
              if (mealEntries.length === 0) return null;

              const mealMacros = mealEntries.reduce(
                (acc, e) => ({
                  calories: acc.calories + e.macros.calories,
                  protein: acc.protein + e.macros.protein,
                }),
                { calories: 0, protein: 0 }
              );

              return (
                <div key={mealType} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{mealTypeLabels[mealType]}</h3>
                    <span className="text-sm text-gray-500">
                      {Math.round(mealMacros.calories)} cal • {Math.round(mealMacros.protein)}g protein
                    </span>
                  </div>
                  <div className="space-y-2">
                    {mealEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="text-gray-900">
                            {entry.type === 'food' && entry.food?.name}
                            {entry.type === 'meal' && entry.meal?.name}
                            {entry.type === 'recipe' && entry.recipe?.name}
                          </p>
                          <p className="text-sm text-gray-500">
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
