/**
 * Diet plans — curated, goal-oriented multi-meal reference plans.
 *
 * A "diet plan" is distinct from a Saved Meal (a one-tap log template) and a
 * Recipe (a multi-ingredient dish). It is a full-day eating template: several
 * named meals, each with an ingredient list and pre-computed macros, plus a
 * daily grand total. Users pick a plan based on their goal, can apply its
 * daily macros to their Diet goals + mark it active (see useDietStore
 * `activeDietId` / `setActiveDiet`), and one-tap log any meal to the diary
 * (see `logDietMeal`).
 *
 * Macros here are authored, not computed — the ingredient lines are display
 * strings (e.g. "300g", "1 tbsp") that don't map to Food records, and each
 * meal carries its own macro total. Per-meal macros sum to `totalMacros`.
 *
 * Each meal's `mealType` is the diary slot it logs into (breakfast / lunch /
 * dinner / snack), matching the anchor slots rendered in Diet.tsx.
 */
import type { Macros, MealType } from '../types';

export interface DietPlanItem {
  /** Display quantity, e.g. "1 medium", "300g", "1 tbsp", "250ml". */
  quantity: string;
  /** Food/ingredient name, e.g. "Banana", "Chicken breast". */
  name: string;
}

export interface DietPlanMeal {
  /** Ordinal label, e.g. "Meal 1". */
  label: string;
  /** Meal name, e.g. "Smoothie & Fruit Snack". */
  name: string;
  /** Diary slot this meal logs into (breakfast / lunch / dinner / snack). */
  mealType: MealType;
  items: DietPlanItem[];
  /** Authored macro total for this meal. */
  macros: Macros;
}

export interface DietPlan {
  id: string;
  /** Display name, e.g. "Low Carb - 2500kcal". */
  name: string;
  /** Short goal tag, e.g. "Low Carb". */
  goal: string;
  /** One-line description of who the plan is for. */
  description: string;
  /** Headline daily calorie target. */
  calorieTarget: number;
  meals: DietPlanMeal[];
  /** Daily grand total — the sum of every meal's macros. */
  totalMacros: Macros;
}

export const dietPlans: DietPlan[] = [
  {
    id: 'low-carb-2500',
    name: 'Low Carb - 2500kcal',
    goal: 'Low Carb',
    description: 'High-protein, lower-fat low-carb plan around 2,500 kcal.',
    calorieTarget: 2500,
    meals: [
      {
        label: 'Meal 1',
        name: 'Smoothie & Fruit Snack',
        mealType: 'breakfast',
        items: [
          { quantity: '1 medium', name: 'Banana' },
          { quantity: '1 tbsp', name: 'Cacao powder' },
          { quantity: '1 serving', name: 'Protein powder' },
          { quantity: '1 cup (handful)', name: 'Frozen mixed berries' },
          { quantity: '70 kcal', name: 'Mixed fruit snacks' },
        ],
        macros: { calories: 395, protein: 30, carbs: 62, fat: 4 },
      },
      {
        label: 'Meal 2',
        name: 'High-Protein Core (Lunch)',
        mealType: 'lunch',
        items: [
          { quantity: '300g', name: 'Extra lean ground beef (95/5)' },
          { quantity: '40g', name: 'Mozzarella cheese' },
          { quantity: '200g', name: 'Chicken breast' },
          { quantity: '250ml', name: '2% Milk' },
        ],
        macros: { calories: 955, protein: 149, carbs: 15, fat: 33 },
      },
      {
        label: 'Meal 3',
        name: 'High-Protein Core (Dinner)',
        mealType: 'dinner',
        items: [
          { quantity: '300g', name: 'Extra lean ground beef (95/5)' },
          { quantity: '40g', name: 'Mozzarella cheese' },
          { quantity: '200g', name: 'Chicken breast' },
          { quantity: '250ml', name: '2% Milk' },
        ],
        macros: { calories: 955, protein: 149, carbs: 15, fat: 33 },
      },
      {
        label: 'Meal 4',
        name: 'Salad / Dressing Side',
        mealType: 'snack',
        items: [
          { quantity: '1 medium', name: 'Tomato' },
          { quantity: '1', name: 'Lemon (juiced)' },
          { quantity: '1 tbsp', name: 'Olive oil' },
          { quantity: '1 medium', name: 'Onion' },
        ],
        macros: { calories: 215, protein: 3, carbs: 22, fat: 14 },
      },
    ],
    // Daily grand total — equals the sum of the four meals above.
    totalMacros: { calories: 2520, protein: 331, carbs: 114, fat: 84 },
  },
];

export function getDietPlan(id: string): DietPlan | undefined {
  return dietPlans.find((p) => p.id === id);
}
