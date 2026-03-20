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
  ExerciseGoal,
  BlockCustomizations,
  CustomBlockExercise,
  CustomBlockDay,
} from '../types';
import { defaultExercises } from '../data/exercises';
import { defaultRoutines } from '../data/defaultRoutines';
import type { BlockExercise } from '../data/minMaxProgram';
import { minMaxProgram } from '../data/minMaxProgram';
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
  startWorkoutFromBlock: (dayName: string, exercises: BlockExercise[] | CustomBlockExercise[]) => void;

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
  updateWeightEntry: (id: string, updates: { weight?: number; date?: string; notes?: string }) => void;
  deleteWeightEntry: (id: string) => void;
  getLatestWeight: () => WeightEntry | null;
  getWeightHistory: (days?: number) => WeightEntry[];

  // New PR tracking
  newPRs: PersonalRecord[];
  clearNewPRs: () => void;

  // Exercise Goals
  exerciseGoals: ExerciseGoal[];
  setExerciseGoal: (goal: Omit<ExerciseGoal, 'createdAt' | 'updatedAt'>) => void;
  getExerciseGoal: (exerciseId: string) => ExerciseGoal | undefined;
  getLastWorkoutForExercise: (exerciseId: string) => WorkoutExercise | undefined;

  // Block Customizations
  blockCustomizations: BlockCustomizations;
  getBlockWeekDays: (blockIdx: number, weekIdx: number) => CustomBlockDay[];
  addDayToWeek: (blockIdx: number, weekIdx: number, afterDayIdx: number, day: CustomBlockDay) => void;
  removeDayFromWeek: (blockIdx: number, weekIdx: number, dayIdx: number) => void;
  updateDayInWeek: (blockIdx: number, weekIdx: number, dayIdx: number, updates: Partial<CustomBlockDay>) => void;
  addExerciseToDay: (blockIdx: number, weekIdx: number, dayIdx: number, exercise: CustomBlockExercise) => void;
  removeExerciseFromDay: (blockIdx: number, weekIdx: number, dayIdx: number, exerciseIdx: number) => void;
  updateExerciseInDay: (blockIdx: number, weekIdx: number, dayIdx: number, exerciseIdx: number, updates: Partial<CustomBlockExercise>) => void;
  reorderExercisesInDay: (blockIdx: number, weekIdx: number, dayIdx: number, fromIdx: number, toIdx: number) => void;
  resetWeekToDefault: (blockIdx: number, weekIdx: number) => void;

  // Cloud sync
  loadFromCloud: (data: Record<string, unknown>) => void;
  getCloudSyncData: () => Record<string, unknown>;

  // Reset store (for logout/user switch)
  resetStore: () => void;
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
                  routineTarget: {
                    sets: re.targetSets,
                    reps: re.targetReps,
                    weight: re.targetWeight,
                  },
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
      routines: defaultRoutines,

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

      startWorkoutFromBlock: (dayName, blockExercises) => {
        const allExercises = get().exercises;

        // Helper: find best matching exercise by name
        const findExercise = (name: string): Exercise | undefined => {
          const lower = name.toLowerCase();
          // Exact match first
          const exact = allExercises.find((e) => e.name.toLowerCase() === lower);
          if (exact) return exact;
          // Contains match
          return allExercises.find(
            (e) => e.name.toLowerCase().includes(lower) || lower.includes(e.name.toLowerCase())
          );
        };

        // Parse rest string like "3-5 min" or "1-2 min" to seconds (use lower bound)
        const parseRest = (rest: string): number => {
          const match = rest.match(/(\d+)/);
          return match ? parseInt(match[1]) * 60 : 90;
        };

        // Parse rep range like "6-8" to a number (use upper bound as target)
        const parseReps = (repRange: string): number => {
          const parts = repRange.split('-');
          return parseInt(parts[parts.length - 1]) || 10;
        };

        const session: WorkoutSession = {
          id: uuidv4(),
          name: dayName,
          date: getDateStamp(),
          startTime: new Date().toISOString(),
          exercises: [],
          completed: false,
        };

        const workoutExercises: WorkoutExercise[] = [];

        blockExercises.forEach((be) => {
          const matched = findExercise(be.name);
          const exercise: Exercise = matched || {
            id: `block-${be.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: be.name,
            description: '',
            muscleGroups: [],
            equipment: [],
            instructions: [],
            tips: [],
          };

          const targetReps = parseReps(be.repRange);
          const restSeconds = parseRest(be.rest);

          // Build notes from block metadata
          const notes: string[] = [];
          if (be.rirS1 !== 'N/A') {
            const rir = be.rirS2 !== 'N/A' ? `${be.rirS1}-${be.rirS2}` : be.rirS1;
            notes.push(`RIR: ${rir}`);
          }
          if (be.lastSetIntensity !== 'N/A') {
            notes.push(`Last set: ${be.lastSetIntensity}`);
          }
          if (be.note) {
            notes.push(be.note);
          }

          workoutExercises.push({
            id: uuidv4(),
            exerciseId: exercise.id,
            exercise,
            sets: Array.from({ length: be.sets }, () => ({
              id: uuidv4(),
              reps: targetReps,
              weight: 0,
              completed: false,
            })),
            restSeconds,
            notes: notes.length > 0 ? notes.join(' | ') : undefined,
            routineTarget: {
              sets: be.sets,
              reps: targetReps,
            },
          });
        });

        session.exercises = workoutExercises;
        set({ currentSession: session });
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
          createdAt: new Date().toISOString(),
        };
        // Only add notes if provided (Firestore doesn't accept undefined)
        if (notes) {
          entry.notes = notes;
        }

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

      updateWeightEntry: (id, updates) => {
        set((state) => {
          const updated = state.weightEntries.map((e) => {
            if (e.id !== id) return e;
            return { ...e, ...updates };
          });
          // If date changed, remove any other entry with the same date
          if (updates.date) {
            const target = updated.find((e) => e.id === id);
            if (target) {
              const deduped = updated.filter((e) => e.id === id || e.date !== target.date);
              return {
                weightEntries: deduped.sort(
                  (a, b) => parseDateStamp(b.date).getTime() - parseDateStamp(a.date).getTime()
                ),
              };
            }
          }
          return {
            weightEntries: updated.sort(
              (a, b) => parseDateStamp(b.date).getTime() - parseDateStamp(a.date).getTime()
            ),
          };
        });
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

      // Exercise Goals
      exerciseGoals: [],

      setExerciseGoal: (goalData) => {
        const now = new Date().toISOString();
        set((state) => {
          const existingIndex = state.exerciseGoals.findIndex(
            (g) => g.exerciseId === goalData.exerciseId
          );

          if (existingIndex >= 0) {
            // Update existing goal
            const updated = [...state.exerciseGoals];
            updated[existingIndex] = {
              ...goalData,
              createdAt: state.exerciseGoals[existingIndex].createdAt,
              updatedAt: now,
            };
            return { exerciseGoals: updated };
          }

          // Add new goal
          return {
            exerciseGoals: [
              ...state.exerciseGoals,
              { ...goalData, createdAt: now, updatedAt: now },
            ],
          };
        });
      },

      getExerciseGoal: (exerciseId) => {
        return get().exerciseGoals.find((g) => g.exerciseId === exerciseId);
      },

      getLastWorkoutForExercise: (exerciseId) => {
        const sessions = get().workoutSessions;
        // Go through sessions in reverse (most recent first)
        for (let i = sessions.length - 1; i >= 0; i--) {
          const exercise = sessions[i].exercises.find(
            (e) => e.exerciseId === exerciseId
          );
          if (exercise) {
            return exercise;
          }
        }
        return undefined;
      },

      // Block Customizations
      blockCustomizations: { weekOverrides: {}, updatedAt: new Date().toISOString() },

      getBlockWeekDays: (blockIdx, weekIdx) => {
        const key = `${blockIdx}-${weekIdx}`;
        const overrides = get().blockCustomizations.weekOverrides[key];
        if (overrides) return overrides;
        // Fall back to default program
        const block = minMaxProgram.blocks[blockIdx];
        if (!block) return [];
        const week = block.weeks[weekIdx];
        if (!week) return [];
        return week.days.map((d) => ({
          dayName: d.dayName,
          exercises: d.exercises.map((e) => ({ ...e })),
        }));
      },

      addDayToWeek: (blockIdx, weekIdx, afterDayIdx, day) => {
        const days = [...get().getBlockWeekDays(blockIdx, weekIdx)];
        days.splice(afterDayIdx + 1, 0, { ...day, isCustom: true });
        const key = `${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      removeDayFromWeek: (blockIdx, weekIdx, dayIdx) => {
        const days = [...get().getBlockWeekDays(blockIdx, weekIdx)];
        days.splice(dayIdx, 1);
        const key = `${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      updateDayInWeek: (blockIdx, weekIdx, dayIdx, updates) => {
        const days = [...get().getBlockWeekDays(blockIdx, weekIdx)];
        days[dayIdx] = { ...days[dayIdx], ...updates };
        const key = `${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      addExerciseToDay: (blockIdx, weekIdx, dayIdx, exercise) => {
        const days = get().getBlockWeekDays(blockIdx, weekIdx).map((d) => ({ ...d, exercises: [...d.exercises] }));
        days[dayIdx].exercises.push(exercise);
        const key = `${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      removeExerciseFromDay: (blockIdx, weekIdx, dayIdx, exerciseIdx) => {
        const days = get().getBlockWeekDays(blockIdx, weekIdx).map((d) => ({ ...d, exercises: [...d.exercises] }));
        days[dayIdx].exercises.splice(exerciseIdx, 1);
        const key = `${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      updateExerciseInDay: (blockIdx, weekIdx, dayIdx, exerciseIdx, updates) => {
        const days = get().getBlockWeekDays(blockIdx, weekIdx).map((d) => ({ ...d, exercises: [...d.exercises] }));
        days[dayIdx].exercises[exerciseIdx] = { ...days[dayIdx].exercises[exerciseIdx], ...updates };
        const key = `${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      reorderExercisesInDay: (blockIdx, weekIdx, dayIdx, fromIdx, toIdx) => {
        const days = get().getBlockWeekDays(blockIdx, weekIdx).map((d) => ({ ...d, exercises: [...d.exercises] }));
        const exercises = days[dayIdx].exercises;
        const [moved] = exercises.splice(fromIdx, 1);
        exercises.splice(toIdx, 0, moved);
        const key = `${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      resetWeekToDefault: (blockIdx, weekIdx) => {
        const key = `${blockIdx}-${weekIdx}`;
        set((state) => {
          const overrides = { ...state.blockCustomizations.weekOverrides };
          delete overrides[key];
          return {
            blockCustomizations: {
              weekOverrides: overrides,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      // Cloud sync
      loadFromCloud: (data) => {
        // Check if cloud routines are stale (missing program field = old Turkish data)
        const cloudRoutines = data.routines as Routine[] | undefined;
        const hasStaleRoutines = cloudRoutines?.some((r) => !r.program);
        const routinesToUse = (!cloudRoutines?.length || hasStaleRoutines)
          ? defaultRoutines
          : cloudRoutines;

        set({
          user: (data.user as UserProfile) ?? get().user,
          workoutSessions: (data.workoutSessions as WorkoutSession[]) ?? get().workoutSessions,
          currentSession: (data.currentSession as WorkoutSession | null) ?? get().currentSession,
          routines: routinesToUse,
          personalRecords: (data.personalRecords as PersonalRecord[]) ?? get().personalRecords,
          weightEntries: (data.weightEntries as WeightEntry[]) ?? get().weightEntries,
          exerciseGoals: (data.exerciseGoals as ExerciseGoal[]) ?? get().exerciseGoals,
          blockCustomizations: (data.blockCustomizations as BlockCustomizations) ?? get().blockCustomizations,
        });
      },

      getCloudSyncData: () => {
        const state = get();
        return {
          user: state.user,
          workoutSessions: state.workoutSessions,
          currentSession: state.currentSession,
          routines: state.routines,
          exercises: state.exercises,
          personalRecords: state.personalRecords,
          weightEntries: state.weightEntries,
          exerciseGoals: state.exerciseGoals,
          blockCustomizations: state.blockCustomizations,
        };
      },

      // Reset store to initial state (for logout/user switch)
      resetStore: () => {
        set({
          user: null,
          workoutSessions: [],
          currentSession: null,
          routines: defaultRoutines,
          personalRecords: [],
          weightEntries: [],
          exerciseGoals: [],
          newPRs: [],
          blockCustomizations: { weekOverrides: {}, updatedAt: new Date().toISOString() },
        });
      },
    }),
    {
      name: 'workout-tracker-storage',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<AppState>;
        if (version < 2) {
          // v2: Ensure routines use English names with program grouping
          return { ...state, routines: defaultRoutines };
        }
        return state as AppState;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        return {
          ...currentState,
          ...persisted,
          // Always use latest exercises from code
          exercises: currentState.exercises,
        };
      },
    }
  )
);
