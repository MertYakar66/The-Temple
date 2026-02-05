import {
  Beef,
  Wheat,
  Cookie,
  Salad,
  Milk,
  Apple,
  MoreHorizontal,
  Sunrise,
  Sun,
  Moon,
  Coffee,
  Dumbbell,
  Zap,
} from 'lucide-react';
import type { MealType, FoodCategory } from '../types';

// Meal type labels and order
export const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
};

export const mealTypeOrder: MealType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout',
];

export const mealTypeOptions: { id: MealType; label: string; icon: React.ElementType }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: Sunrise },
  { id: 'lunch', label: 'Lunch', icon: Sun },
  { id: 'dinner', label: 'Dinner', icon: Moon },
  { id: 'snack', label: 'Snack', icon: Coffee },
  { id: 'pre_workout', label: 'Pre-Workout', icon: Zap },
  { id: 'post_workout', label: 'Post-Workout', icon: Dumbbell },
];

// Food category icons and labels
export const categoryIcons: Record<FoodCategory, React.ElementType> = {
  protein: Beef,
  carbs: Wheat,
  fats: Cookie,
  vegetables: Salad,
  dairy: Milk,
  fruits: Apple,
  other: MoreHorizontal,
};

export const categoryLabels: Record<FoodCategory, string> = {
  protein: 'Protein',
  carbs: 'Carbs',
  fats: 'Fats',
  vegetables: 'Vegetables',
  dairy: 'Dairy',
  fruits: 'Fruits',
  other: 'Other',
};

export const categoryColors: Record<FoodCategory, string> = {
  protein: 'text-red-500 bg-red-50',
  carbs: 'text-amber-500 bg-amber-50',
  fats: 'text-blue-500 bg-blue-50',
  vegetables: 'text-green-500 bg-green-50',
  dairy: 'text-purple-500 bg-purple-50',
  fruits: 'text-orange-500 bg-orange-50',
  other: 'text-gray-500 bg-gray-50',
};

// Macro calculation helpers
export const calculateBMR = (weight: number, height: number, age: number, isMale: boolean): number => {
  // Mifflin-St Jeor Equation
  if (isMale) {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
};

export const calculateTDEE = (bmr: number, activityLevel: number): number => {
  // Activity multipliers: 1.2 (sedentary) to 1.9 (very active)
  return Math.round(bmr * activityLevel);
};

export const getActivityMultiplier = (level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'): number => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return multipliers[level];
};

export const calculateProteinTarget = (weight: number, goal: 'cut' | 'maintenance' | 'bulk'): number => {
  // Protein recommendations based on goal
  const multipliers = {
    cut: 2.2, // Higher protein during cut to preserve muscle
    maintenance: 1.8,
    bulk: 2.0,
  };
  return Math.round(weight * multipliers[goal]);
};
