import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calculator,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Check,
  Target,
  Activity,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useDietStore } from '../store/useDietStore';
import { kgToDisplay, displayToKg, getWeightUnit } from '../utils/weight';
import type { Sex, ActivityLevel, DietGoalType } from '../types';

const activityLevels: { id: ActivityLevel; label: string; description: string; multiplier: number }[] = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise, desk job', multiplier: 1.2 },
  { id: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week', multiplier: 1.55 },
  { id: 'active', label: 'Active', description: 'Hard exercise 6-7 days/week', multiplier: 1.725 },
  { id: 'very_active', label: 'Very Active', description: 'Very hard exercise, physical job', multiplier: 1.9 },
];

const goalOptions: { id: DietGoalType; label: string; description: string; calorieAdjustment: number }[] = [
  { id: 'cut', label: 'Cut (Fat Loss)', description: 'Calorie deficit for fat loss', calorieAdjustment: -500 },
  { id: 'maintenance', label: 'Maintenance', description: 'Maintain current weight', calorieAdjustment: 0 },
  { id: 'bulk', label: 'Bulk (Muscle Gain)', description: 'Calorie surplus for muscle gain', calorieAdjustment: 300 },
];

/**
 * BMR via Mifflin-St Jeor equation.
 * Male:   (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
 * Female: (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161
 */
function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  if (sex === 'male') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  }
  return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
}

/**
 * Macro splits by goal:
 * - Cut:         40% protein / 30% carbs / 30% fat
 * - Maintenance: 30% protein / 40% carbs / 30% fat
 * - Bulk:        30% protein / 45% carbs / 25% fat
 */
function calculateMacros(calories: number, goalType: DietGoalType): { protein: number; carbs: number; fat: number } {
  let proteinRatio: number;
  let carbsRatio: number;
  let fatRatio: number;

  switch (goalType) {
    case 'cut':
      proteinRatio = 0.40;
      carbsRatio = 0.30;
      fatRatio = 0.30;
      break;
    case 'bulk':
      proteinRatio = 0.30;
      carbsRatio = 0.45;
      fatRatio = 0.25;
      break;
    case 'maintenance':
    default:
      proteinRatio = 0.30;
      carbsRatio = 0.40;
      fatRatio = 0.30;
      break;
  }

  return {
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbsRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9),
  };
}

export function TDEECalculator() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const updateUser = useStore((state) => state.updateUser);
  const updateDietGoals = useDietStore((state) => state.updateDietGoals);
  const dietSettings = useDietStore((state) => state.dietSettings);

  const unitSystem = user?.unitSystem || 'metric';
  const weightUnit = getWeightUnit(unitSystem);

  // Pre-fill from user profile, converting weight to display unit
  const initialDisplayWeight = user?.weight
    ? (Math.round(kgToDisplay(user.weight, unitSystem) * 10) / 10).toString()
    : '75';

  const [sex, setSex] = useState<Sex>(user?.sex || 'male');
  const [age, setAge] = useState(user?.age?.toString() || '25');
  const [height, setHeight] = useState(user?.height?.toString() || '175');
  const [weight, setWeight] = useState(initialDisplayWeight);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(user?.activityLevel || 'moderate');
  const [goalType, setGoalType] = useState<DietGoalType>(dietSettings.goals.goalType || 'maintenance');
  const [applied, setApplied] = useState(false);

  // Always compute BMR in kg — convert from display unit to kg first
  const weightInKg = useMemo(() => {
    const w = parseFloat(weight) || 0;
    return displayToKg(w, unitSystem);
  }, [weight, unitSystem]);

  const bmr = useMemo(() => {
    const h = parseFloat(height) || 0;
    const a = parseInt(age) || 0;
    if (weightInKg <= 0 || h <= 0 || a <= 0) return 0;
    return Math.round(calculateBMR(sex, weightInKg, h, a));
  }, [sex, weightInKg, height, age]);

  const activityMultiplier = activityLevels.find((al) => al.id === activityLevel)?.multiplier || 1.55;

  const tdee = useMemo(() => {
    return Math.round(bmr * activityMultiplier);
  }, [bmr, activityMultiplier]);

  const goalCalAdjustment = goalOptions.find((g) => g.id === goalType)?.calorieAdjustment || 0;
  const targetCalories = tdee + goalCalAdjustment;

  const macros = useMemo(() => {
    return calculateMacros(targetCalories, goalType);
  }, [targetCalories, goalType]);

  const handleApplyToGoals = () => {
    // Sync all form values back to user profile
    const ageVal = parseInt(age) || user?.age || 25;
    const heightVal = parseFloat(height) || user?.height || 175;

    updateUser({
      sex,
      activityLevel,
      age: ageVal,
      height: heightVal,
      weight: Math.round(weightInKg * 10) / 10,
    });

    // Apply calculated values to diet goals
    updateDietGoals({
      dailyCalories: targetCalories,
      dailyProtein: macros.protein,
      dailyCarbs: macros.carbs,
      dailyFat: macros.fat,
      goalType,
    });

    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="ml-4 font-semibold text-gray-900 dark:text-white">TDEE Calculator</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Sex */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
            Sex
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSex('male')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                sex === 'male'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Male
            </button>
            <button
              onClick={() => setSex('female')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                sex === 'female'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Age, Height, Weight */}
        <div className="card p-0 divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-gray-900 dark:text-white">Age</span>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-24 text-right input py-1"
              min={13}
              max={100}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-gray-900 dark:text-white">Height (cm)</span>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-24 text-right input py-1"
              min={100}
              max={250}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-gray-900 dark:text-white">Weight ({weightUnit})</span>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-24 text-right input py-1"
              min={unitSystem === 'imperial' ? 66 : 30}
              max={unitSystem === 'imperial' ? 660 : 300}
            />
          </div>
        </div>

        {/* Activity Level */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Activity Level
            </div>
          </label>
          <div className="card p-0">
            {activityLevels.map((level, index) => (
              <button
                key={level.id}
                onClick={() => setActivityLevel(level.id)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  index !== activityLevels.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{level.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{level.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    activityLevel === level.id
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {activityLevel === level.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* BMR & TDEE Result */}
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-700">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-primary-800 dark:text-primary-300">Your Results</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">BMR</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{bmr}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">cal/day</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">TDEE</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{tdee}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">cal/day</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Based on Mifflin-St Jeor equation
          </p>
        </div>

        {/* Goal Selection */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              Your Goal
            </div>
          </label>
          <div className="card p-0">
            {goalOptions.map((goal, index) => (
              <button
                key={goal.id}
                onClick={() => setGoalType(goal.id)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  index !== goalOptions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{goal.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {goal.description} ({goal.calorieAdjustment >= 0 ? '+' : ''}{goal.calorieAdjustment} cal)
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    goalType === goal.id
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {goalType === goal.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Daily Intake */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Recommended Daily Intake
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-gray-900 dark:text-white">Calories</span>
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">{targetCalories}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Beef className="w-5 h-5 text-red-500" />
                <span className="text-gray-900 dark:text-white">Protein</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{macros.protein}g</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5 text-amber-500" />
                <span className="text-gray-900 dark:text-white">Carbs</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{macros.carbs}g</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-900 dark:text-white">Fat</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{macros.fat}g</span>
            </div>
          </div>

          {/* Macro calorie verification */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              P: {macros.protein}g x 4 + C: {macros.carbs}g x 4 + F: {macros.fat}g x 9 ={' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {(macros.protein * 4) + (macros.carbs * 4) + (macros.fat * 9)} cal
              </span>
            </p>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyToGoals}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            applied
              ? 'bg-green-500 text-white'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {applied ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Applied to Diet Goals!
            </span>
          ) : (
            'Apply to My Diet Goals'
          )}
        </button>

        {/* Info note */}
        <div className="card bg-gray-100 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Note:</strong> These calculations use the Mifflin-St Jeor equation for BMR
            and standard macro ratios. You can fine-tune your exact macros and calorie targets
            in <strong>Diet Settings</strong> after applying.
          </p>
        </div>
      </div>
    </div>
  );
}
