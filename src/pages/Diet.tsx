import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Settings,
  Target,
  Utensils,
} from 'lucide-react';
import { useDietStore } from '../store/useDietStore';
import type { MealType } from '../types';

// Anchor slots — always rendered, with empty-state "ADD FOOD" button.
// MyFitnessPal-style. Lowercase to match stored mealType values.
const ANCHOR_SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

// Known display labels. Custom mealType strings (anything not listed here)
// are humanized at render time via humanizeMealType.
const KNOWN_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
};

function humanizeMealType(mt: MealType): string {
  if (KNOWN_LABELS[mt]) return KNOWN_LABELS[mt];
  return mt
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function Diet() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const getLogEntriesForDate = useDietStore((s) => s.getLogEntriesForDate);
  const getDailyMacros = useDietStore((s) => s.getDailyMacros);
  const dietSettings = useDietStore((s) => s.dietSettings);
  const deleteLogEntry = useDietStore((s) => s.deleteLogEntry);

  const entries = getLogEntriesForDate(dateStr);
  const dailyMacros = getDailyMacros(dateStr);
  const targets = dietSettings.goals;

  // Anchor slots first (always shown, with ADD FOOD), then any custom
  // mealTypes present on this date appended in first-appearance order.
  // Cheap to recompute every render — entries is small (one day's log).
  const customSeen = new Set<string>(ANCHOR_SLOTS);
  const customMealTypes: MealType[] = [];
  for (const e of entries) {
    if (!customSeen.has(e.mealType)) {
      customSeen.add(e.mealType);
      customMealTypes.push(e.mealType);
    }
  }
  const visibleMealTypes: MealType[] = [...ANCHOR_SLOTS, ...customMealTypes];

  const entriesByMeal = visibleMealTypes.reduce((acc, slot) => {
    acc[slot] = entries.filter((e) => e.mealType === slot);
    return acc;
  }, {} as Record<string, typeof entries>);

  // Calculate remaining
  const remaining = {
    calories: targets.dailyCalories - Math.round(dailyMacros.calories),
    protein: targets.dailyProtein - Math.round(dailyMacros.protein),
  };

  const goToDate = (date: Date) => setSelectedDate(date);
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diary</h1>
        <Link
          to="/diet/settings"
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Settings className="w-6 h-6" />
        </Link>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
        <button
          onClick={() => goToDate(subDays(selectedDate, 1))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={() => !isToday && goToDate(new Date())}
          className="text-center"
        >
          <p className="font-semibold text-gray-900 dark:text-white">
            {isToday ? 'Today' : format(selectedDate, 'EEEE')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </button>
        <button
          onClick={() => goToDate(addDays(selectedDate, 1))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Daily Summary - Simple like MyFitnessPal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-4 text-center divide-x divide-gray-200 dark:divide-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Goal</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{targets.dailyCalories}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Food</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(dailyMacros.calories)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Remaining</p>
            <p className={`text-lg font-bold ${remaining.calories >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {remaining.calories}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Protein</p>
            <p className={`text-lg font-bold ${remaining.protein >= 0 ? 'text-gray-900 dark:text-white' : 'text-green-600 dark:text-green-400'}`}>
              {Math.round(dailyMacros.protein)}g
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              dailyMacros.calories > targets.dailyCalories ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((dailyMacros.calories / targets.dailyCalories) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Quick actions — entry points to the Meals page (Saved Meals,
          Recipes, and goal-based Diet plans). */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/diet/meals?tab=diets"
          className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm flex items-center gap-2 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <Target className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium leading-tight">Diets</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Goal-based plans</p>
          </div>
        </Link>
        <Link
          to="/diet/meals"
          className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm flex items-center gap-2 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <Utensils className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium leading-tight">Meals</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Saved meals & recipes</p>
          </div>
        </Link>
      </div>

      {/* Meal Sections */}
      {visibleMealTypes.map((mealSlot) => {
        const mealEntries = entriesByMeal[mealSlot] || [];
        const mealCalories = mealEntries.reduce((sum, e) => sum + e.macros.calories, 0);

        return (
          <div key={mealSlot} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {/* Meal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">{humanizeMealType(mealSlot)}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(mealCalories)} cal
              </span>
            </div>

            {/* Meal Entries */}
            {mealEntries.length > 0 && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {mealEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white truncate">
                        {entry.type === 'food' && entry.food?.name}
                        {entry.type === 'meal' && entry.meal?.name}
                        {entry.type === 'recipe' && entry.recipe?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.servings !== 1 && `${entry.servings} servings · `}
                        {Math.round(entry.macros.protein)}g protein
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {Math.round(entry.macros.calories)}
                      </span>
                      <button
                        onClick={() => deleteLogEntry(entry.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Food Button */}
            <button
              onClick={() => navigate(`/diet/log?date=${dateStr}&meal=${encodeURIComponent(mealSlot)}`)}
              className="w-full px-4 py-3 flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">ADD FOOD</span>
            </button>
          </div>
        );
      })}

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Macros</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(dailyMacros.protein)}g</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">/ {targets.dailyProtein}g</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(dailyMacros.carbs)}g</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">/ {targets.dailyCarbs}g</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(dailyMacros.fat)}g</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">/ {targets.dailyFat}g</p>
          </div>
        </div>
      </div>
    </div>
  );
}
