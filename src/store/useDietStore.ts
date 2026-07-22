/**
 * useDietStore — foods/recipes/meals/log/streaks Zustand store.
 * Persisted under `diet-tracker-storage` at version 2.
 *
 * Date math goes through parseDateStamp (input) + getDateStamp (output)
 * end-to-end. Local-aware on both sides — see docs/DATA_POLICY.md §2 and
 * its parseDateStamp-trap corollary. Don't reintroduce `new Date(stamp)`
 * or `toISOString().split('T')[0]` here.
 *
 * Persist version 1 strips `dietSettings.mealReminders` from older
 * persisted state via dietStoreMigrate. The reminder feature was removed
 * in Batch 3 (no notification-firing layer ever existed; the editor UI
 * was misleading).
 *
 * Persist version 2 adds the `activeDietId` slice (the user's chosen diet
 * plan, see src/data/diets.ts). The field is additive — pre-v2 state lacks
 * it and zustand's merge supplies the initializer default (null), so
 * dietStoreMigrate needs no extra step for it.
 *
 * Tests: src/store/useDietStore.test.ts.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Food,
  Recipe,
  Meal,
  FoodLogEntry,
  DietGoals,
  DietSettings,
  DietStreak,
  Macros,
  MealType,
  DietGoalType,
} from '../types';
import { defaultFoods } from '../data/foods';
import { getDateStamp, parseDateStamp } from '../utils/date';

interface DietState {
  // Foods
  foods: Food[];
  customFoods: Food[];
  getAllFoods: () => Food[];
  addCustomFood: (food: Omit<Food, 'id' | 'createdAt' | 'isCustom'>) => void;
  updateCustomFood: (id: string, updates: Partial<Food>) => void;
  deleteCustomFood: (id: string) => void;
  getFood: (id: string) => Food | undefined;

  // Recipes
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'macrosPerServing' | 'totalMacros'>) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  getRecipe: (id: string) => Recipe | undefined;

  // Meals (Saved meal templates)
  meals: Meal[];
  addMeal: (meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt' | 'totalMacros'>) => void;
  updateMeal: (id: string, updates: Partial<Meal>) => void;
  deleteMeal: (id: string) => void;
  getMeal: (id: string) => Meal | undefined;

  // Food Log
  foodLog: FoodLogEntry[];
  recentFoodIds: string[]; // Track recently used foods
  logFood: (entry: Omit<FoodLogEntry, 'id' | 'timestamp' | 'macros'>) => void;
  logMeal: (mealId: string, date: string, mealType: MealType) => void;
  logRecipe: (recipeId: string, servings: number, date: string, mealType: MealType) => void;
  deleteLogEntry: (id: string) => void;
  getLogEntriesForDate: (date: string) => FoodLogEntry[];
  getDailyMacros: (date: string) => Macros;

  // Diet Settings & Goals
  dietSettings: DietSettings;
  updateDietGoals: (goals: Partial<DietGoals>) => void;

  // Active diet plan (curated multi-meal reference plan, see src/data/diets.ts)
  activeDietId: string | null;
  setActiveDiet: (id: string | null) => void;
  logDietMeal: (
    meal: { name: string; mealType: MealType; macros: Macros },
    date: string,
  ) => void;

  // Streaks
  streaks: DietStreak;
  updateStreaks: (date: string) => void;

  // Computed / Integration helpers
  getTargetMacrosForDate: (date: string, isTrainingDay: boolean) => Macros;
  getWeeklyStats: (weekStartDate: string) => {
    avgCalories: number;
    avgProtein: number;
    proteinHitDays: number;
    totalDaysLogged: number;
  };

  // Cloud sync
  loadFromCloud: (data: Record<string, unknown>) => void;
  getCloudSyncData: () => Record<string, unknown>;

  // Reset store (for logout/user switch)
  resetStore: () => void;
}

const calculateMacros = (items: { macros: Macros; servings: number }[]): Macros => {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.macros.calories * item.servings,
      protein: acc.protein + item.macros.protein * item.servings,
      carbs: acc.carbs + item.macros.carbs * item.servings,
      fat: acc.fat + item.macros.fat * item.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

const defaultDietSettings: DietSettings = {
  goals: {
    dailyCalories: 2500,
    dailyProtein: 180,
    dailyCarbs: 250,
    dailyFat: 80,
    goalType: 'maintenance' as DietGoalType,
    trainingDayCalorieAdjustment: 300,
    trainingDayProteinAdjustment: 20,
  },
  proteinPriority: true,
};

/**
 * Persist v1 migration: drop dietSettings.mealReminders.
 *
 * Older persisted state had an unused `mealReminders` array under
 * `dietSettings`. The feature was removed in Batch 3 (no notification
 * firing was ever implemented; the editor was misleading). This migration
 * walks one path — `state.dietSettings.mealReminders` — and removes that
 * key only. Every other field passes through untouched. Exported for unit
 * testing in useDietStore.test.ts. Zustand passes (state, version) to
 * the migrate callback; the version arg is unused (this is the first
 * migration, so any pre-v1 state carries the old shape).
 */
export function dietStoreMigrate(persistedState: unknown): unknown {
  if (typeof persistedState !== 'object' || persistedState === null) {
    return persistedState;
  }
  const state = persistedState as Record<string, unknown>;
  const settings = state.dietSettings;
  if (
    typeof settings === 'object' &&
    settings !== null &&
    'mealReminders' in (settings as Record<string, unknown>)
  ) {
    const rest = Object.fromEntries(
      Object.entries(settings as Record<string, unknown>).filter(([k]) => k !== 'mealReminders'),
    );
    return { ...state, dietSettings: rest };
  }
  return state;
}

const defaultStreaks: DietStreak = {
  proteinStreak: 0,
  loggingStreak: 0,
  lastProteinHitDate: null,
  lastLogDate: null,
};

export const useDietStore = create<DietState>()(
  persist(
    (set, get) => ({
      // Foods
      foods: defaultFoods,
      customFoods: [],

      getAllFoods: () => [...get().foods, ...get().customFoods],

      addCustomFood: (foodData) => {
        const food: Food = {
          ...foodData,
          id: uuidv4(),
          isCustom: true,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ customFoods: [...state.customFoods, food] }));
      },

      updateCustomFood: (id, updates) => {
        set((state) => ({
          customFoods: state.customFoods.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },

      deleteCustomFood: (id) => {
        set((state) => ({
          customFoods: state.customFoods.filter((f) => f.id !== id),
        }));
      },

      getFood: (id) => {
        const allFoods = get().getAllFoods();
        return allFoods.find((f) => f.id === id);
      },

      // Recipes
      recipes: [],

      addRecipe: (recipeData) => {
        const totalMacros = calculateMacros(
          recipeData.ingredients.map((ing) => ({
            macros: ing.food.macros,
            servings: ing.quantity,
          }))
        );
        const macrosPerServing: Macros = {
          calories: totalMacros.calories / recipeData.servings,
          protein: totalMacros.protein / recipeData.servings,
          carbs: totalMacros.carbs / recipeData.servings,
          fat: totalMacros.fat / recipeData.servings,
        };

        const recipe: Recipe = {
          ...recipeData,
          id: uuidv4(),
          totalMacros,
          macrosPerServing,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ recipes: [...state.recipes, recipe] }));
      },

      updateRecipe: (id, updates) => {
        set((state) => ({
          recipes: state.recipes.map((r) => {
            if (r.id !== id) return r;
            const updated = { ...r, ...updates, updatedAt: new Date().toISOString() };

            // Recalculate macros if ingredients changed
            if (updates.ingredients || updates.servings) {
              const ingredients = updates.ingredients || r.ingredients;
              const servings = updates.servings || r.servings;
              const totalMacros = calculateMacros(
                ingredients.map((ing) => ({
                  macros: ing.food.macros,
                  servings: ing.quantity,
                }))
              );
              updated.totalMacros = totalMacros;
              updated.macrosPerServing = {
                calories: totalMacros.calories / servings,
                protein: totalMacros.protein / servings,
                carbs: totalMacros.carbs / servings,
                fat: totalMacros.fat / servings,
              };
            }
            return updated;
          }),
        }));
      },

      deleteRecipe: (id) => {
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        }));
      },

      getRecipe: (id) => get().recipes.find((r) => r.id === id),

      // Meals
      meals: [],

      addMeal: (mealData) => {
        const totalMacros = calculateMacros(
          mealData.items.map((item) => ({
            macros: item.macros,
            servings: 1, // macros already calculated per item
          }))
        );

        const meal: Meal = {
          ...mealData,
          id: uuidv4(),
          totalMacros,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ meals: [...state.meals, meal] }));
      },

      updateMeal: (id, updates) => {
        set((state) => ({
          meals: state.meals.map((m) => {
            if (m.id !== id) return m;
            const updated = { ...m, ...updates, updatedAt: new Date().toISOString() };

            if (updates.items) {
              updated.totalMacros = calculateMacros(
                updates.items.map((item) => ({
                  macros: item.macros,
                  servings: 1,
                }))
              );
            }
            return updated;
          }),
        }));
      },

      deleteMeal: (id) => {
        set((state) => ({
          meals: state.meals.filter((m) => m.id !== id),
        }));
      },

      getMeal: (id) => get().meals.find((m) => m.id === id),

      // Food Log
      foodLog: [],
      recentFoodIds: [],

      logFood: (entryData) => {
        const food = get().getFood(entryData.foodId!);
        if (!food) return;

        const macros: Macros = {
          calories: food.macros.calories * entryData.servings,
          protein: food.macros.protein * entryData.servings,
          carbs: food.macros.carbs * entryData.servings,
          fat: food.macros.fat * entryData.servings,
        };

        const entry: FoodLogEntry = {
          ...entryData,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          food,
          macros,
        };

        set((state) => {
          // Update recent foods
          const newRecentIds = [
            entryData.foodId!,
            ...state.recentFoodIds.filter((id) => id !== entryData.foodId),
          ].slice(0, 20);

          return {
            foodLog: [...state.foodLog, entry],
            recentFoodIds: newRecentIds,
          };
        });

        // Update streaks
        get().updateStreaks(entryData.date);
      },

      logMeal: (mealId, date, mealType) => {
        const meal = get().getMeal(mealId);
        if (!meal) return;

        const entry: FoodLogEntry = {
          id: uuidv4(),
          date,
          timestamp: new Date().toISOString(),
          mealType,
          type: 'meal',
          mealId,
          meal,
          servings: 1,
          macros: meal.totalMacros,
        };

        set((state) => ({
          foodLog: [...state.foodLog, entry],
        }));

        get().updateStreaks(date);
      },

      logRecipe: (recipeId, servings, date, mealType) => {
        const recipe = get().getRecipe(recipeId);
        if (!recipe) return;

        const macros: Macros = {
          calories: recipe.macrosPerServing.calories * servings,
          protein: recipe.macrosPerServing.protein * servings,
          carbs: recipe.macrosPerServing.carbs * servings,
          fat: recipe.macrosPerServing.fat * servings,
        };

        const entry: FoodLogEntry = {
          id: uuidv4(),
          date,
          timestamp: new Date().toISOString(),
          mealType,
          type: 'recipe',
          recipeId,
          recipe,
          servings,
          macros,
        };

        set((state) => ({
          foodLog: [...state.foodLog, entry],
        }));

        get().updateStreaks(date);
      },

      deleteLogEntry: (id) => {
        set((state) => ({
          foodLog: state.foodLog.filter((e) => e.id !== id),
        }));
      },

      getLogEntriesForDate: (date) => {
        return get().foodLog.filter((e) => e.date === date);
      },

      getDailyMacros: (date) => {
        const entries = get().getLogEntriesForDate(date);
        return entries.reduce(
          (acc, entry) => ({
            calories: acc.calories + entry.macros.calories,
            protein: acc.protein + entry.macros.protein,
            carbs: acc.carbs + entry.macros.carbs,
            fat: acc.fat + entry.macros.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
      },

      // Diet Settings & Goals
      dietSettings: defaultDietSettings,

      updateDietGoals: (goals) => {
        set((state) => ({
          dietSettings: {
            ...state.dietSettings,
            goals: { ...state.dietSettings.goals, ...goals },
          },
        }));
      },

      // Active diet plan
      activeDietId: null,

      setActiveDiet: (id) => {
        set({ activeDietId: id });
      },

      // Log a diet-plan meal to the diary. Diet-plan meals don't map to saved
      // Meal records, so we write a synthetic `type: 'meal'` entry carrying the
      // plan's authored macros (mirrors logMeal, but the embedded meal has no
      // saved id and an empty items list — Diet.tsx renders it by name + macros).
      logDietMeal: (dietMeal, date) => {
        const meal: Meal = {
          id: uuidv4(),
          name: dietMeal.name,
          mealType: dietMeal.mealType,
          items: [],
          totalMacros: dietMeal.macros,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const entry: FoodLogEntry = {
          id: uuidv4(),
          date,
          timestamp: new Date().toISOString(),
          mealType: dietMeal.mealType,
          type: 'meal',
          meal,
          servings: 1,
          macros: dietMeal.macros,
        };

        set((state) => ({ foodLog: [...state.foodLog, entry] }));

        get().updateStreaks(date);
      },

      // Streaks
      streaks: defaultStreaks,

      updateStreaks: (date) => {
        const dailyMacros = get().getDailyMacros(date);
        const targets = get().getTargetMacrosForDate(date, false); // simplified
        const hitProtein = dailyMacros.protein >= targets.protein * 0.9; // 90% threshold

        set((state) => {
          // Local-aware date math end-to-end. parseDateStamp parses the
          // YYYY-MM-DD as LOCAL midnight (date-fns parseISO); getDateStamp
          // formats the result in local time. See docs/DATA_POLICY.md §2.
          const yesterday = parseDateStamp(date);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getDateStamp(yesterday);

          let newProteinStreak = state.streaks.proteinStreak;
          let newLoggingStreak = state.streaks.loggingStreak;

          // Update logging streak
          if (state.streaks.lastLogDate === yesterdayStr || state.streaks.lastLogDate === date) {
            newLoggingStreak = state.streaks.lastLogDate === date
              ? state.streaks.loggingStreak
              : state.streaks.loggingStreak + 1;
          } else if (state.streaks.lastLogDate !== date) {
            newLoggingStreak = 1;
          }

          // Update protein streak
          if (hitProtein) {
            if (state.streaks.lastProteinHitDate === yesterdayStr) {
              newProteinStreak = state.streaks.proteinStreak + 1;
            } else if (state.streaks.lastProteinHitDate !== date) {
              newProteinStreak = 1;
            }
          }

          return {
            streaks: {
              proteinStreak: newProteinStreak,
              loggingStreak: newLoggingStreak,
              lastProteinHitDate: hitProtein ? date : state.streaks.lastProteinHitDate,
              lastLogDate: date,
            },
          };
        });
      },

      // Computed helpers
      getTargetMacrosForDate: (_date, isTrainingDay) => {
        const { goals } = get().dietSettings;
        const adjustment = isTrainingDay ? 1 : 0;

        return {
          calories: goals.dailyCalories + goals.trainingDayCalorieAdjustment * adjustment,
          protein: goals.dailyProtein + goals.trainingDayProteinAdjustment * adjustment,
          carbs: goals.dailyCarbs,
          fat: goals.dailyFat,
        };
      },

      getWeeklyStats: (weekStartDate) => {
        // Local-aware date math end-to-end. See updateStreaks above.
        const weekStart = parseDateStamp(weekStartDate);
        const dates: string[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + i);
          dates.push(getDateStamp(d));
        }

        let totalCalories = 0;
        let totalProtein = 0;
        let proteinHitDays = 0;
        let totalDaysLogged = 0;

        const targets = get().getTargetMacrosForDate(weekStartDate, false);

        dates.forEach((date) => {
          const entries = get().getLogEntriesForDate(date);
          if (entries.length > 0) {
            totalDaysLogged++;
            const macros = get().getDailyMacros(date);
            totalCalories += macros.calories;
            totalProtein += macros.protein;
            if (macros.protein >= targets.protein * 0.9) {
              proteinHitDays++;
            }
          }
        });

        return {
          avgCalories: totalDaysLogged > 0 ? Math.round(totalCalories / totalDaysLogged) : 0,
          avgProtein: totalDaysLogged > 0 ? Math.round(totalProtein / totalDaysLogged) : 0,
          proteinHitDays,
          totalDaysLogged,
        };
      },

      // Cloud sync
      loadFromCloud: (data) => {
        set({
          customFoods: (data.customFoods as Food[]) ?? get().customFoods,
          recipes: (data.recipes as Recipe[]) ?? get().recipes,
          meals: (data.meals as Meal[]) ?? get().meals,
          foodLog: (data.foodLog as FoodLogEntry[]) ?? get().foodLog,
          recentFoodIds: (data.recentFoodIds as string[]) ?? get().recentFoodIds,
          dietSettings: (data.dietSettings as DietSettings) ?? get().dietSettings,
          streaks: (data.streaks as DietStreak) ?? get().streaks,
          activeDietId: (data.activeDietId as string | null) ?? get().activeDietId,
        });
      },

      getCloudSyncData: () => {
        const state = get();
        return {
          customFoods: state.customFoods,
          recipes: state.recipes,
          meals: state.meals,
          foodLog: state.foodLog,
          recentFoodIds: state.recentFoodIds,
          dietSettings: state.dietSettings,
          streaks: state.streaks,
          activeDietId: state.activeDietId,
        };
      },

      // Reset store to initial state (for logout/user switch)
      resetStore: () => {
        set({
          customFoods: [],
          recipes: [],
          meals: [],
          foodLog: [],
          recentFoodIds: [],
          dietSettings: defaultDietSettings,
          streaks: defaultStreaks,
          activeDietId: null,
        });
      },
    }),
    {
      name: 'diet-tracker-storage',
      version: 2,
      migrate: dietStoreMigrate,
    }
  )
);
