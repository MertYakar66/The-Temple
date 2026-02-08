import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  UserProfile,
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  Routine,
  RoutineExercise,
  PersonalRecord,
  Exercise,
  WeightEntry,
} from '../types';
import { defaultExercises } from '../data/exercises';
import { getDateStamp, isDateStampInRange, parseDateStamp } from '../utils/date';

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;

  // Exercises
  exercises: Exercise[];
  getExercise: (id: string) => Exercise | undefined;

  // Workout Sessions
  workoutSessions: WorkoutSession[];
  currentSession: WorkoutSession | null;
  startWorkout: (name: string, routineId?: string) => void;
  endWorkout: () => void;
  cancelWorkout: () => void;
  addExerciseToSession: (exercise: Exercise) => void;
  removeExerciseFromSession: (workoutExerciseId: string) => void;
  addSetToExercise: (workoutExerciseId: string) => void;
  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  toggleSetComplete: (workoutExerciseId: string, setId: string) => void;

  // Routines
  routines: Routine[];
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  addExerciseToRoutine: (routineId: string, exercise: Omit<RoutineExercise, 'id'>) => void;
  removeExerciseFromRoutine: (routineId: string, exerciseId: string) => void;
  startWorkoutFromRoutine: (routineId: string) => void;

  // Personal Records
  personalRecords: PersonalRecord[];
  checkAndUpdatePR: (exerciseId: string, exerciseName: string, weight: number, reps: number, sessionId: string) => void;

  // History
  getWorkoutsByDate: (date: string) => WorkoutSession[];
  getWorkoutsInRange: (startDate: string, endDate: string) => WorkoutSession[];
  deleteWorkoutSession: (id: string) => void;

  // Stats
  getTotalWorkouts: () => number;
  getWeeklyWorkoutCount: () => number;
  getExerciseHistory: (exerciseId: string) => { date: string; maxWeight: number; totalVolume: number }[];

  // Body Weight Tracking
  weightEntries: WeightEntry[];
  addWeightEntry: (weight: number, notes?: string, date?: string) => void;
  deleteWeightEntry: (id: string) => void;
  getLatestWeight: () => WeightEntry | null;
  getWeightHistory: (days?: number) => WeightEntry[];

  // New PR tracking
  newPRs: PersonalRecord[];
  clearNewPRs: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...updates, updatedAt: new Date().toISOString() }
            : null,
        })),
      completeOnboarding: () =>
        set((state) => ({
          user: state.user
            ? { ...state.user, onboardingCompleted: true, updatedAt: new Date().toISOString() }
            : null,
        })),

      // Exercises
      exercises: defaultExercises,
      getExercise: (id) => get().exercises.find((e) => e.id === id),

      // Workout Sessions
      workoutSessions: [],
      currentSession: null,

      startWorkout: (name, routineId) => {
        const session: WorkoutSession = {
          id: uuidv4(),
          name,
          date: getDateStamp(),
          startTime: new Date().toISOString(),
          exercises: [],
          completed: false,
          routineId,
        };

        // If starting from a routine, pre-populate exercises
        if (routineId) {
          const routine = get().routines.find((r) => r.id === routineId);
          if (routine) {
            const workoutExercises: WorkoutExercise[] = [];
            routine.exercises.forEach((re) => {
              const exercise = get().getExercise(re.exerciseId);
              if (exercise) {
                workoutExercises.push({
                  id: uuidv4(),
                  exerciseId: re.exerciseId,
                  exercise,
                  sets: Array.from({ length: re.targetSets }, () => ({
                    id: uuidv4(),
                    reps: re.targetReps,
                    weight: re.targetWeight || 0,
                    completed: false,
                  })),
                  restSeconds: re.restSeconds,
                  notes: re.notes,
                });
              }
            });
            session.exercises = workoutExercises;
          }
        }

        set({ currentSession: session });
      },

      endWorkout: () => {
        const session = get().currentSession;
        if (!session) return;

        const completedSession: WorkoutSession = {
          ...session,
          endTime: new Date().toISOString(),
          completed: true,
        };

        // Check for PRs
        session.exercises.forEach((we) => {
          we.sets.forEach((s) => {
            if (s.completed && s.weight > 0) {
              get().checkAndUpdatePR(
                we.exerciseId,
                we.exercise.name,
                s.weight,
                s.reps,
                session.id
              );
            }
          });
        });

        set((state) => ({
          workoutSessions: [...state.workoutSessions, completedSession],
          currentSession: null,
        }));
      },

      cancelWorkout: () => set({ currentSession: null }),

      addExerciseToSession: (exercise) => {
        set((state) => {
          if (!state.currentSession) return state;

          // Get previous workout data for this exercise to suggest weights/reps
          const previousWorkouts = state.workoutSessions
            .flatMap((ws) => ws.exercises)
            .filter((we) => we.exerciseId === exercise.id);

          const lastWorkout = previousWorkouts[previousWorkouts.length - 1];
          const suggestedSets = lastWorkout?.sets || [
            { id: uuidv4(), reps: 10, weight: 0, completed: false },
            { id: uuidv4(), reps: 10, weight: 0, completed: false },
            { id: uuidv4(), reps: 10, weight: 0, completed: false },
          ];

          const workoutExercise: WorkoutExercise = {
            id: uuidv4(),
            exerciseId: exercise.id,
            exercise,
            sets: suggestedSets.map((s) => ({
              ...s,
              id: uuidv4(),
              completed: false,
            })),
            restSeconds: 90,
          };

          return {
            currentSession: {
              ...state.currentSession,
              exercises: [...state.currentSession.exercises, workoutExercise],
            },
          };
        });
      },

      removeExerciseFromSession: (workoutExerciseId) => {
        set((state) => {
          if (!state.currentSession) return state;
          return {
            currentSession: {
              ...state.currentSession,
              exercises: state.currentSession.exercises.filter(
                (e) => e.id !== workoutExerciseId
              ),
            },
          };
        });
      },

      addSetToExercise: (workoutExerciseId) => {
        set((state) => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              exercises: state.currentSession.exercises.map((we) => {
                if (we.id !== workoutExerciseId) return we;

                const lastSet = we.sets[we.sets.length - 1];
                return {
                  ...we,
                  sets: [
                    ...we.sets,
                    {
                      id: uuidv4(),
                      reps: lastSet?.reps || 10,
                      weight: lastSet?.weight || 0,
                      completed: false,
                    },
                  ],
                };
              }),
            },
          };
        });
      },

      updateSet: (workoutExerciseId, setId, updates) => {
        set((state) => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              exercises: state.currentSession.exercises.map((we) => {
                if (we.id !== workoutExerciseId) return we;
                return {
                  ...we,
                  sets: we.sets.map((s) =>
                    s.id === setId ? { ...s, ...updates } : s
                  ),
                };
              }),
            },
          };
        });
      },

      removeSet: (workoutExerciseId, setId) => {
        set((state) => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              exercises: state.currentSession.exercises.map((we) => {
                if (we.id !== workoutExerciseId) return we;
                return {
                  ...we,
                  sets: we.sets.filter((s) => s.id !== setId),
                };
              }),
            },
          };
        });
      },

      toggleSetComplete: (workoutExerciseId, setId) => {
        set((state) => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              exercises: state.currentSession.exercises.map((we) => {
                if (we.id !== workoutExerciseId) return we;
                return {
                  ...we,
                  sets: we.sets.map((s) =>
                    s.id === setId ? { ...s, completed: !s.completed } : s
                  ),
                };
              }),
            },
          };
        });
      },

      // Routines
      routines: [],

      addRoutine: (routineData) => {
        const routine: Routine = {
          ...routineData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ routines: [...state.routines, routine] }));
      },

      updateRoutine: (id, updates) => {
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id
              ? { ...r, ...updates, updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      deleteRoutine: (id) => {
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
        }));
      },

      addExerciseToRoutine: (routineId, exercise) => {
        set((state) => ({
          routines: state.routines.map((r) => {
            if (r.id !== routineId) return r;
            return {
              ...r,
              exercises: [
                ...r.exercises,
                { ...exercise, id: uuidv4() },
              ],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      removeExerciseFromRoutine: (routineId, exerciseId) => {
        set((state) => ({
          routines: state.routines.map((r) => {
            if (r.id !== routineId) return r;
            return {
              ...r,
              exercises: r.exercises.filter((e) => e.id !== exerciseId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      startWorkoutFromRoutine: (routineId) => {
        const routine = get().routines.find((r) => r.id === routineId);
        if (routine) {
          get().startWorkout(routine.name, routineId);
        }
      },

      // Personal Records
      personalRecords: [],

      checkAndUpdatePR: (exerciseId, exerciseName, weight, reps, sessionId) => {
        set((state) => {
          const existingPR = state.personalRecords.find(
            (pr) => pr.exerciseId === exerciseId && pr.reps === reps
          );

          if (!existingPR || weight > existingPR.weight) {
            const newPR: PersonalRecord = {
              exerciseId,
              exerciseName,
              weight,
              reps,
              date: getDateStamp(),
              workoutSessionId: sessionId,
            };

            return {
              personalRecords: existingPR
                ? state.personalRecords.map((pr) =>
                    pr.exerciseId === exerciseId && pr.reps === reps
                      ? newPR
                      : pr
                  )
                : [...state.personalRecords, newPR],
              // Track new PRs for celebration
              newPRs: [...state.newPRs, newPR],
            };
          }

          return state;
        });
      },

      // History
      getWorkoutsByDate: (date) => {
        return get().workoutSessions.filter((ws) => ws.date === date);
      },

      getWorkoutsInRange: (startDate, endDate) => {
        const start = parseDateStamp(startDate);
        const end = parseDateStamp(endDate);
        return get().workoutSessions.filter((ws) =>
          isDateStampInRange(ws.date, start, end)
        );
      },

      deleteWorkoutSession: (id) =>
        set((state) => ({
          workoutSessions: state.workoutSessions.filter((ws) => ws.id !== id),
        })),

      // Stats
      getTotalWorkouts: () => get().workoutSessions.length,

      getWeeklyWorkoutCount: () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return get().workoutSessions.filter((ws) =>
          isDateStampInRange(ws.date, weekAgo, now)
        ).length;
      },

      getExerciseHistory: (exerciseId) => {
        const sessions = get().workoutSessions;
        const history: { date: string; maxWeight: number; totalVolume: number }[] = [];

        sessions.forEach((session) => {
          const exercise = session.exercises.find(
            (e) => e.exerciseId === exerciseId
          );
          if (exercise) {
            let maxWeight = 0;
            let totalVolume = 0;

            exercise.sets.forEach((set) => {
              if (set.completed) {
                if (set.weight > maxWeight) maxWeight = set.weight;
                totalVolume += set.weight * set.reps;
              }
            });

            if (maxWeight > 0 || totalVolume > 0) {
              history.push({
                date: session.date,
                maxWeight,
                totalVolume,
              });
            }
          }
        });

        return history.sort(
          (a, b) => parseDateStamp(a.date).getTime() - parseDateStamp(b.date).getTime()
        );
      },

      // Body Weight Tracking
      weightEntries: [],

      addWeightEntry: (weight, notes, date) => {
        const entry: WeightEntry = {
          id: uuidv4(),
          date: date || getDateStamp(),
          weight,
          notes,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          // Remove existing entry for the same date if exists
          const filtered = state.weightEntries.filter((e) => e.date !== entry.date);
          return {
            weightEntries: [...filtered, entry].sort(
              (a, b) => parseDateStamp(b.date).getTime() - parseDateStamp(a.date).getTime()
            ),
          };
        });

        // Also update user's current weight
        const user = get().user;
        if (user) {
          get().updateUser({ weight });
        }
      },

      deleteWeightEntry: (id) => {
        set((state) => ({
          weightEntries: state.weightEntries.filter((e) => e.id !== id),
        }));
      },

      getLatestWeight: () => {
        const entries = get().weightEntries;
        return entries.length > 0 ? entries[0] : null;
      },

      getWeightHistory: (days = 30) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return get().weightEntries.filter((e) =>
          parseDateStamp(e.date).getTime() >= cutoff.getTime()
        );
      },

      // New PR tracking for celebrations
      newPRs: [],

      clearNewPRs: () => {
        set({ newPRs: [] });
      },
    }),
    {
      name: 'workout-tracker-storage',
    }
  )
);
