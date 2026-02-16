export type TrainingGoal = 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance' | 'general_fitness';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'full_gym' | 'home_gym' | 'minimal' | 'bodyweight';
export type UnitSystem = 'metric' | 'imperial';
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'full_body';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  height: number; // in cm
  weight: number; // in kg
  age: number;
  trainingGoal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  equipment: Equipment;
  unitSystem: UnitSystem;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroups: MuscleGroup[];
  equipment: string[];
  instructions: string[];
  tips: string[];
  variations?: string[];
  imageUrl?: string;
  videoUrl?: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number; // in kg
  completed: boolean;
  rir?: number; // Reps In Reserve (0-5)
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

export interface ExerciseGoal {
  exerciseId: string;
  targetWeight: number;
  targetReps: number;
  targetRIR?: number;
  targetSets?: number;
  notes: string; // explanation about the goal
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  restSeconds: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  date: string;
  startTime?: string;
  endTime?: string;
  exercises: WorkoutExercise[];
  notes?: string;
  routineId?: string;
  completed: boolean;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  restSeconds: number;
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  dayOfWeek?: number[]; // 0-6, Sunday-Saturday
  createdAt: string;
  updatedAt: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  workoutSessionId: string;
}

export interface WeeklyStats {
  weekStart: string;
  workoutCount: number;
  totalVolume: number; // weight * reps * sets
  totalSets: number;
  totalReps: number;
}

// ============================================
// Body Weight Tracking Types
// ============================================

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // in kg
  notes?: string;
  createdAt: string;
}

// ============================================
// Workout Templates Types
// ============================================

export type WorkoutSplit = 'ppl' | 'upper_lower' | 'full_body' | 'bro_split' | 'custom';

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  split: WorkoutSplit;
  daysPerWeek: number;
  level: ExperienceLevel;
  routines: TemplateRoutine[];
}

export interface TemplateRoutine {
  dayName: string;
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}

// ============================================
// Diet Module Types
// ============================================

export type FoodCategory = 'protein' | 'carbs' | 'fats' | 'vegetables' | 'dairy' | 'fruits' | 'sides' | 'other';
export type DietGoalType = 'cut' | 'maintenance' | 'bulk';
// MealType is now a string to allow custom meal names
export type MealType = string;

export interface Macros {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  macros: Macros; // per serving
  servingSize: number; // in grams
  servingUnit: string; // e.g., "g", "ml", "piece", "cup"
  isCustom: boolean;
  createdAt: string;
}

export interface RecipeIngredient {
  foodId: string;
  food: Food;
  quantity: number; // number of servings
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  servings: number; // how many servings this recipe makes
  macrosPerServing: Macros;
  totalMacros: Macros;
  createdAt: string;
  updatedAt: string;
}

export interface Meal {
  id: string;
  name: string;
  mealType: MealType;
  items: MealItem[];
  totalMacros: Macros;
  createdAt: string;
  updatedAt: string;
}

export interface MealItem {
  id: string;
  type: 'food' | 'recipe';
  foodId?: string;
  food?: Food;
  recipeId?: string;
  recipe?: Recipe;
  servings: number;
  macros: Macros; // calculated based on servings
}

export interface FoodLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  mealType: MealType;
  type: 'food' | 'recipe' | 'meal';
  foodId?: string;
  food?: Food;
  recipeId?: string;
  recipe?: Recipe;
  mealId?: string;
  meal?: Meal;
  servings: number;
  macros: Macros;
}

export interface DailyNutrition {
  date: string;
  entries: FoodLogEntry[];
  totalMacros: Macros;
  targetMacros: Macros;
  isTrainingDay: boolean;
  workoutIntensity?: 'light' | 'moderate' | 'heavy';
}

export interface DietGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  goalType: DietGoalType;
  trainingDayCalorieAdjustment: number; // extra calories on training days
  trainingDayProteinAdjustment: number; // extra protein on training days
}

export interface DietSettings {
  goals: DietGoals;
  mealReminders: MealReminder[];
  proteinPriority: boolean; // highlight protein compliance
}

export interface MealReminder {
  id: string;
  mealType: MealType;
  time: string; // HH:MM format
  enabled: boolean;
}

export interface DietStreak {
  proteinStreak: number; // consecutive days hitting protein target
  loggingStreak: number; // consecutive days with logged meals
  lastProteinHitDate: string | null;
  lastLogDate: string | null;
}

export interface WeeklyDietStats {
  weekStart: string;
  avgCalories: number;
  avgProtein: number;
  proteinHitDays: number; // days protein target was met
  totalDaysLogged: number;
  trainingDaysAligned: number; // days where intake matched training
}
