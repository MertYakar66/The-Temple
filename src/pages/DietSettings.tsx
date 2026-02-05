import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Bell,
  Dumbbell,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  Calculator,
} from 'lucide-react';
import { useDietStore } from '../store/useDietStore';
import type { DietGoalType, MealType } from '../types';

const goalTypeOptions: { id: DietGoalType; label: string; description: string }[] = [
  { id: 'cut', label: 'Cut', description: 'Calorie deficit for fat loss' },
  { id: 'maintenance', label: 'Maintenance', description: 'Maintain current weight' },
  { id: 'bulk', label: 'Bulk', description: 'Calorie surplus for muscle gain' },
];

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
};

export function DietSettings() {
  const navigate = useNavigate();

  const dietSettings = useDietStore((s) => s.dietSettings);
  const updateDietGoals = useDietStore((s) => s.updateDietGoals);
  const updateMealReminder = useDietStore((s) => s.updateMealReminder);
  const addMealReminder = useDietStore((s) => s.addMealReminder);
  const deleteMealReminder = useDietStore((s) => s.deleteMealReminder);

  const [editingGoals, setEditingGoals] = useState(false);
  const [localGoals, setLocalGoals] = useState(dietSettings.goals);

  // Calculate calories from macros: protein×4 + carbs×4 + fat×9
  const calculatedCalories = useMemo(() => {
    const protein = editingGoals ? localGoals.dailyProtein : dietSettings.goals.dailyProtein;
    const carbs = editingGoals ? localGoals.dailyCarbs : dietSettings.goals.dailyCarbs;
    const fat = editingGoals ? localGoals.dailyFat : dietSettings.goals.dailyFat;
    return (protein * 4) + (carbs * 4) + (fat * 9);
  }, [editingGoals, localGoals, dietSettings.goals]);

  const targetCalories = editingGoals ? localGoals.dailyCalories : dietSettings.goals.dailyCalories;
  const calorieDifference = calculatedCalories - targetCalories;
  const macrosMatch = Math.abs(calorieDifference) <= 50; // Allow 50 cal tolerance

  const handleSaveGoals = () => {
    updateDietGoals(localGoals);
    setEditingGoals(false);
  };

  const handleAddReminder = () => {
    addMealReminder({
      mealType: 'snack',
      time: '15:00',
      enabled: true,
    });
  };

  // Auto-balance macros based on calories (useful presets)
  const autoBalanceMacros = () => {
    const calories = localGoals.dailyCalories;
    // Balanced split: 30% protein, 40% carbs, 30% fat
    const proteinCals = calories * 0.3;
    const carbsCals = calories * 0.4;
    const fatCals = calories * 0.3;

    setLocalGoals({
      ...localGoals,
      dailyProtein: Math.round(proteinCals / 4),
      dailyCarbs: Math.round(carbsCals / 4),
      dailyFat: Math.round(fatCals / 9),
    });
  };

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
          <h1 className="ml-4 font-semibold text-gray-900 dark:text-white">Diet Settings</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Goal Type */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Goal Type
          </h2>
          <div className="card p-0">
            {goalTypeOptions.map((option, index) => (
              <button
                key={option.id}
                onClick={() => updateDietGoals({ goalType: option.id })}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  index !== goalTypeOptions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    dietSettings.goals.goalType === option.id
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {dietSettings.goals.goalType === option.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Daily Targets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Daily Targets
            </h2>
            {!editingGoals ? (
              <button
                onClick={() => {
                  setLocalGoals(dietSettings.goals);
                  setEditingGoals(true);
                }}
                className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Edit Goals
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLocalGoals(dietSettings.goals);
                    setEditingGoals(false);
                  }}
                  className="text-gray-600 dark:text-gray-400 text-sm font-medium px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGoals}
                  className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="card p-0 divide-y divide-gray-100 dark:divide-gray-700">
            {/* Calories */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-gray-900 dark:text-white">Calories</span>
              </div>
              {editingGoals ? (
                <input
                  type="number"
                  value={localGoals.dailyCalories}
                  onChange={(e) =>
                    setLocalGoals({ ...localGoals, dailyCalories: parseInt(e.target.value) || 0 })
                  }
                  className="w-24 text-right input py-1"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300">{dietSettings.goals.dailyCalories}</span>
              )}
            </div>

            {/* Protein */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Beef className="w-5 h-5 text-red-500" />
                <span className="text-gray-900 dark:text-white">Protein (g)</span>
              </div>
              {editingGoals ? (
                <input
                  type="number"
                  value={localGoals.dailyProtein}
                  onChange={(e) =>
                    setLocalGoals({ ...localGoals, dailyProtein: parseInt(e.target.value) || 0 })
                  }
                  className="w-24 text-right input py-1"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300">{dietSettings.goals.dailyProtein}g</span>
              )}
            </div>

            {/* Carbs */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Wheat className="w-5 h-5 text-amber-500" />
                <span className="text-gray-900 dark:text-white">Carbs (g)</span>
              </div>
              {editingGoals ? (
                <input
                  type="number"
                  value={localGoals.dailyCarbs}
                  onChange={(e) =>
                    setLocalGoals({ ...localGoals, dailyCarbs: parseInt(e.target.value) || 0 })
                  }
                  className="w-24 text-right input py-1"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300">{dietSettings.goals.dailyCarbs}g</span>
              )}
            </div>

            {/* Fat */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Droplet className="w-5 h-5 text-blue-500" />
                <span className="text-gray-900 dark:text-white">Fat (g)</span>
              </div>
              {editingGoals ? (
                <input
                  type="number"
                  value={localGoals.dailyFat}
                  onChange={(e) =>
                    setLocalGoals({ ...localGoals, dailyFat: parseInt(e.target.value) || 0 })
                  }
                  className="w-24 text-right input py-1"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300">{dietSettings.goals.dailyFat}g</span>
              )}
            </div>
          </div>

          {/* Macro Sum-Up Box */}
          <div className={`mt-4 p-4 rounded-xl border-2 ${
            macrosMatch
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className={`w-5 h-5 ${macrosMatch ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
              <span className={`font-semibold ${macrosMatch ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
                Macro Calculator
              </span>
            </div>

            {/* Visual calculation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                <div className="flex items-center gap-1">
                  <Beef className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {editingGoals ? localGoals.dailyProtein : dietSettings.goals.dailyProtein}g
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">× 4</span>
                </div>
                <span className="text-gray-400">+</span>
                <div className="flex items-center gap-1">
                  <Wheat className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {editingGoals ? localGoals.dailyCarbs : dietSettings.goals.dailyCarbs}g
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">× 4</span>
                </div>
                <span className="text-gray-400">+</span>
                <div className="flex items-center gap-1">
                  <Droplet className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {editingGoals ? localGoals.dailyFat : dietSettings.goals.dailyFat}g
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">× 9</span>
                </div>
                <span className="text-gray-400">=</span>
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{calculatedCalories}</span>
                  <span className="text-gray-500 dark:text-gray-400">cal</span>
                </div>
              </div>
            </div>

            {/* Status */}
            {macrosMatch ? (
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Macros match your calorie target!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {calorieDifference > 0
                      ? `Macros exceed target by ${calorieDifference} cal`
                      : `Macros are ${Math.abs(calorieDifference)} cal below target`
                    }
                  </span>
                </div>
                {editingGoals && (
                  <button
                    onClick={autoBalanceMacros}
                    className="w-full bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                  >
                    Auto-balance macros (30/40/30 split)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Training Day Adjustments */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Training Day Adjustments
          </h2>
          <div className="card p-0 divide-y divide-gray-100 dark:divide-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-primary-500" />
                <div>
                  <span className="text-gray-900 dark:text-white">Extra Calories</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Added on training days</p>
                </div>
              </div>
              {editingGoals ? (
                <input
                  type="number"
                  value={localGoals.trainingDayCalorieAdjustment}
                  onChange={(e) =>
                    setLocalGoals({
                      ...localGoals,
                      trainingDayCalorieAdjustment: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-24 text-right input py-1"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300">
                  +{dietSettings.goals.trainingDayCalorieAdjustment}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Beef className="w-5 h-5 text-red-500" />
                <div>
                  <span className="text-gray-900 dark:text-white">Extra Protein (g)</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Added on training days</p>
                </div>
              </div>
              {editingGoals ? (
                <input
                  type="number"
                  value={localGoals.trainingDayProteinAdjustment}
                  onChange={(e) =>
                    setLocalGoals({
                      ...localGoals,
                      trainingDayProteinAdjustment: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-24 text-right input py-1"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300">
                  +{dietSettings.goals.trainingDayProteinAdjustment}g
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meal Reminders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Meal Reminders
            </h2>
            <button
              onClick={handleAddReminder}
              className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="card p-0 divide-y divide-gray-100 dark:divide-gray-700">
            {dietSettings.mealReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Bell className={`w-5 h-5 ${reminder.enabled ? 'text-primary-500' : 'text-gray-400'}`} />
                  <div>
                    <span className="text-gray-900 dark:text-white">{mealTypeLabels[reminder.mealType]}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{reminder.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateMealReminder(reminder.id, { enabled: !reminder.enabled })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      reminder.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                        reminder.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => deleteMealReminder(reminder.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {dietSettings.mealReminders.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                No reminders set
              </div>
            )}
          </div>
        </div>

        {/* Quick Calculator */}
        <div className="card bg-gray-100 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Reference</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p>
              <strong>Rest Day:</strong> {dietSettings.goals.dailyCalories} cal,{' '}
              {dietSettings.goals.dailyProtein}g protein
            </p>
            <p>
              <strong>Training Day:</strong>{' '}
              {dietSettings.goals.dailyCalories + dietSettings.goals.trainingDayCalorieAdjustment} cal,{' '}
              {dietSettings.goals.dailyProtein + dietSettings.goals.trainingDayProteinAdjustment}g protein
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
