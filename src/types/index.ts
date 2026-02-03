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
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
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
