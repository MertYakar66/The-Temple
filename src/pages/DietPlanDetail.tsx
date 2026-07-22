import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Check, Plus, Target } from 'lucide-react';
import { useDietStore } from '../store/useDietStore';
import { getDietPlan } from '../data/diets';
import { getDateStamp } from '../utils/date';

export function DietPlanDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const plan = id ? getDietPlan(id) : undefined;

  const activeDietId = useDietStore((s) => s.activeDietId);
  const setActiveDiet = useDietStore((s) => s.setActiveDiet);
  const updateDietGoals = useDietStore((s) => s.updateDietGoals);
  const logDietMeal = useDietStore((s) => s.logDietMeal);

  // Per-meal transient "logged" confirmation, keyed by meal index.
  const [loggedIndexes, setLoggedIndexes] = useState<Record<number, boolean>>({});

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
          <button
            onClick={() => navigate('/diet/meals')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
        </header>
        <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
          Diet not found.
        </div>
      </div>
    );
  }

  const isActive = plan.id === activeDietId;

  const handleUseDiet = () => {
    setActiveDiet(plan.id);
    updateDietGoals({
      dailyCalories: Math.round(plan.totalMacros.calories),
      dailyProtein: Math.round(plan.totalMacros.protein),
      dailyCarbs: Math.round(plan.totalMacros.carbs),
      dailyFat: Math.round(plan.totalMacros.fat),
    });
  };

  const handleLogMeal = (index: number) => {
    const meal = plan.meals[index];
    logDietMeal(
      { name: meal.name, mealType: meal.mealType, macros: meal.macros },
      getDateStamp(new Date()),
    );
    setLoggedIndexes((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/diet/meals')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {/* Plan summary */}
        <div className="card">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {plan.name}
            </h1>
            {isActive && (
              <span className="text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {plan.description}
          </p>

          {/* Daily grand total */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg py-2 text-center">
              <p className="text-base font-semibold text-orange-600 dark:text-orange-400">
                {Math.round(plan.totalMacros.calories)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">cal</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg py-2 text-center">
              <p className="text-base font-semibold text-red-600 dark:text-red-400">
                {Math.round(plan.totalMacros.protein)}g
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">protein</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg py-2 text-center">
              <p className="text-base font-semibold text-amber-600 dark:text-amber-400">
                {Math.round(plan.totalMacros.carbs)}g
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">carbs</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg py-2 text-center">
              <p className="text-base font-semibold text-yellow-600 dark:text-yellow-400">
                {Math.round(plan.totalMacros.fat)}g
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">fat</p>
            </div>
          </div>

          <button
            onClick={handleUseDiet}
            className={isActive ? 'btn-secondary w-full mt-4' : 'btn-primary w-full mt-4'}
          >
            {isActive ? 'Re-apply goals' : 'Use this diet'}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            Sets this as your active diet and applies its daily macro targets.
          </p>
        </div>

        {/* Meals */}
        {plan.meals.map((meal, index) => {
          const logged = loggedIndexes[index];
          return (
            <div key={meal.label} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    {meal.label}
                  </p>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {meal.name}
                  </h2>
                </div>
                <button
                  onClick={() => handleLogMeal(index)}
                  className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    logged
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50'
                  }`}
                >
                  {logged ? (
                    <>
                      <Check className="w-4 h-4" />
                      Logged
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Log
                    </>
                  )}
                </button>
              </div>

              {/* Ingredients */}
              <ul className="mt-3 space-y-1">
                {meal.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span>{item.name}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-3 shrink-0">
                      {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Per-meal macros */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                {Math.round(meal.macros.calories)} cal •{' '}
                {Math.round(meal.macros.protein)}g P •{' '}
                {Math.round(meal.macros.carbs)}g C • {Math.round(meal.macros.fat)}g F
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
