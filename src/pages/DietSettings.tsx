import { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/diet')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="ml-4 font-semibold text-gray-900">Diet Settings</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Goal Type */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Goal Type
          </h2>
          <div className="card p-0">
            {goalTypeOptions.map((option, index) => (
              <button
                key={option.id}
                onClick={() => updateDietGoals({ goalType: option.id })}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                  index !== goalTypeOptions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    dietSettings.goals.goalType === option.id
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300'
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
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Daily Targets
            </h2>
            {!editingGoals ? (
              <button
                onClick={() => setEditingGoals(true)}
                className="text-primary-600 text-sm font-medium"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLocalGoals(dietSettings.goals);
                    setEditingGoals(false);
                  }}
                  className="text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGoals}
                  className="text-primary-600 text-sm font-medium"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="card p-0 divide-y divide-gray-100">
            {/* Calories */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-gray-900">Calories</span>
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
                <span className="text-gray-600">{dietSettings.goals.dailyCalories}</span>
              )}
            </div>

            {/* Protein */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Beef className="w-5 h-5 text-red-500" />
                <span className="text-gray-900">Protein (g)</span>
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
                <span className="text-gray-600">{dietSettings.goals.dailyProtein}g</span>
              )}
            </div>

            {/* Carbs */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Wheat className="w-5 h-5 text-amber-500" />
                <span className="text-gray-900">Carbs (g)</span>
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
                <span className="text-gray-600">{dietSettings.goals.dailyCarbs}g</span>
              )}
            </div>

            {/* Fat */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Droplet className="w-5 h-5 text-blue-500" />
                <span className="text-gray-900">Fat (g)</span>
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
                <span className="text-gray-600">{dietSettings.goals.dailyFat}g</span>
              )}
            </div>
          </div>
        </div>

        {/* Training Day Adjustments */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Training Day Adjustments
          </h2>
          <div className="card p-0 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-primary-500" />
                <div>
                  <span className="text-gray-900">Extra Calories</span>
                  <p className="text-xs text-gray-500">Added on training days</p>
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
                <span className="text-gray-600">
                  +{dietSettings.goals.trainingDayCalorieAdjustment}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Beef className="w-5 h-5 text-red-500" />
                <div>
                  <span className="text-gray-900">Extra Protein (g)</span>
                  <p className="text-xs text-gray-500">Added on training days</p>
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
                <span className="text-gray-600">
                  +{dietSettings.goals.trainingDayProteinAdjustment}g
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meal Reminders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Meal Reminders
            </h2>
            <button
              onClick={handleAddReminder}
              className="text-primary-600 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="card p-0 divide-y divide-gray-100">
            {dietSettings.mealReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Bell className={`w-5 h-5 ${reminder.enabled ? 'text-primary-500' : 'text-gray-400'}`} />
                  <div>
                    <span className="text-gray-900">{mealTypeLabels[reminder.mealType]}</span>
                    <p className="text-sm text-gray-500">{reminder.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateMealReminder(reminder.id, { enabled: !reminder.enabled })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      reminder.enabled ? 'bg-primary-600' : 'bg-gray-300'
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
              <div className="px-4 py-6 text-center text-gray-500">
                No reminders set
              </div>
            )}
          </div>
        </div>

        {/* Quick Calculator */}
        <div className="card bg-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2">Quick Reference</h3>
          <div className="text-sm text-gray-600 space-y-1">
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
