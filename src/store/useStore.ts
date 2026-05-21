/**
 * useStore — workout/weight/PR/blocks Zustand store. The largest store
 * (~950 lines). Persisted at `version: 2` under `workout-tracker-storage`.
 *
 * Cloud sync ships a LEAN projection: `getCloudSyncData()` strips the
 * static `exercises` array down to `{id, name}` (the full data is bundled
 * with the app — see `src/data/exercises.ts`). Don't reintroduce the full
 * payload to cloud (docs/DATA_POLICY.md §6).
 *
 * Adding a new persisted slice requires updating five places: the type,
 * `loadFromCloud`, `getCloudSyncData`, `resetStore`, and the equality
 * check in `AuthContext.startSync` (otherwise it won't sync OR will cause
 * write storms). See docs/DATA_POLICY.md §5.
 *
 * Tests: src/store/useStore.test.ts (Batch 1 null-emit invariants).
 */
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
import { getBlockProgram, LEGACY_PROGRAM_ID } from '../data/blockPrograms';
import { getDateStamp, isDateStampInRange, parseDateStamp } from '../utils/date';

// Legacy block-customization keys were `"${block}-${week}"` (no program id).
// The v3 migration namespaces them; any legacy-shaped key is remapped onto the
// original Min Max program. Applied in both `migrate` and `loadFromCloud`,
// since a cloud doc written before v3 may still hold legacy keys.
function normalizeBlockKeys(
  overrides: Record<string, CustomBlockDay[]>,
): Record<string, CustomBlockDay[]> {
  const out: Record<string, CustomBlockDay[]> = {};
  for (const [key, value] of Object.entries(overrides ?? {})) {
    out[/^\d+-\d+$/.test(key) ? `${LEGACY_PROGRAM_ID}-${key}` : key] = value;
  }
  return out;
}

function normalizeLoadedCustomizations(raw: unknown): BlockCustomizations | undefined {
  const bc = raw as BlockCustomizations | undefined;
  if (!bc) return undefined;
  return { ...bc, weekOverrides: normalizeBlockKeys(bc.weekOverrides) };
}

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
  updateWeightEntry: (id: string, updates: { weight?: number; date?: string; notes?: string | null }) => void;
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
  getBlockWeekDays: (programId: string, blockIdx: number, weekIdx: number) => CustomBlockDay[];
  addDayToWeek: (programId: string, blockIdx: number, weekIdx: number, afterDayIdx: number, day: CustomBlockDay) => void;
  removeDayFromWeek: (programId: string, blockIdx: number, weekIdx: number, dayIdx: number) => void;
  updateDayInWeek: (programId: string, blockIdx: number, weekIdx: number, dayIdx: number, updates: Partial<CustomBlockDay>) => void;
  addExerciseToDay: (programId: string, blockIdx: number, weekIdx: number, dayIdx: number, exercise: CustomBlockExercise) => void;
  removeExerciseFromDay: (programId: string, blockIdx: number, weekIdx: number, dayIdx: number, exerciseIdx: number) => void;
  updateExerciseInDay: (programId: string, blockIdx: number, weekIdx: number, dayIdx: number, exerciseIdx: number, updates: Partial<CustomBlockExercise>) => void;
  reorderExercisesInDay: (programId: string, blockIdx: number, weekIdx: number, dayIdx: number, fromIdx: number, toIdx: number) => void;
  resetWeekToDefault: (programId: string, blockIdx: number, weekIdx: number) => void;

  // Completed block workouts — manually ticked on the Blocks screen.
  // Each entry is a key `"${programId}-${blockIdx}-${weekIdx}-${dayName}"`.
  completedBlockDays: string[];
  toggleBlockDayDone: (programId: string, blockIdx: number, weekIdx: number, dayName: string) => void;

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
            ...(notes.length > 0 ? { notes: notes.join(' | ') } : {}),
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

        // Determine "is latest" before mutating the store, so back-filling
        // an older date never overwrites the user's current profile weight.
        const otherEntries = get().weightEntries.filter((e) => e.date !== entry.date);
        const isLatest = otherEntries.every(
          (e) => parseDateStamp(entry.date).getTime() >= parseDateStamp(e.date).getTime()
        );

        set((state) => {
          // Remove existing entry for the same date if exists
          const filtered = state.weightEntries.filter((e) => e.date !== entry.date);
          return {
            weightEntries: [...filtered, entry].sort(
              (a, b) => parseDateStamp(b.date).getTime() - parseDateStamp(a.date).getTime()
            ),
          };
        });

        if (isLatest) {
          const user = get().user;
          if (user) {
            get().updateUser({ weight });
          }
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

      getBlockWeekDays: (programId, blockIdx, weekIdx) => {
        const key = `${programId}-${blockIdx}-${weekIdx}`;
        const overrides = get().blockCustomizations.weekOverrides[key];
        if (overrides) return overrides;
        // Fall back to the default program
        const program = getBlockProgram(programId);
        const block = program?.blocks[blockIdx];
        if (!block) return [];
        const week = block.weeks[weekIdx];
        if (!week) return [];
        return week.days.map((d) => ({
          dayName: d.dayName,
          exercises: d.exercises.map((e) => ({ ...e })),
        }));
      },

      addDayToWeek: (programId, blockIdx, weekIdx, afterDayIdx, day) => {
        const days = [...get().getBlockWeekDays(programId, blockIdx, weekIdx)];
        days.splice(afterDayIdx + 1, 0, { ...day, isCustom: true });
        const key = `${programId}-${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      removeDayFromWeek: (programId, blockIdx, weekIdx, dayIdx) => {
        const days = [...get().getBlockWeekDays(programId, blockIdx, weekIdx)];
        days.splice(dayIdx, 1);
        const key = `${programId}-${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      updateDayInWeek: (programId, blockIdx, weekIdx, dayIdx, updates) => {
        const days = [...get().getBlockWeekDays(programId, blockIdx, weekIdx)];
        days[dayIdx] = { ...days[dayIdx], ...updates };
        const key = `${programId}-${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      addExerciseToDay: (programId, blockIdx, weekIdx, dayIdx, exercise) => {
        const days = get().getBlockWeekDays(programId, blockIdx, weekIdx).map((d) => ({ ...d, exercises: [...d.exercises] }));
        days[dayIdx].exercises.push(exercise);
        const key = `${programId}-${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      removeExerciseFromDay: (programId, blockIdx, weekIdx, dayIdx, exerciseIdx) => {
        const days = get().getBlockWeekDays(programId, blockIdx, weekIdx).map((d) => ({ ...d, exercises: [...d.exercises] }));
        days[dayIdx].exercises.splice(exerciseIdx, 1);
        const key = `${programId}-${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      updateExerciseInDay: (programId, blockIdx, weekIdx, dayIdx, exerciseIdx, updates) => {
        const days = get().getBlockWeekDays(programId, blockIdx, weekIdx).map((d) => ({ ...d, exercises: [...d.exercises] }));
        days[dayIdx].exercises[exerciseIdx] = { ...days[dayIdx].exercises[exerciseIdx], ...updates };
        const key = `${programId}-${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      reorderExercisesInDay: (programId, blockIdx, weekIdx, dayIdx, fromIdx, toIdx) => {
        const days = get().getBlockWeekDays(programId, blockIdx, weekIdx).map((d) => ({ ...d, exercises: [...d.exercises] }));
        const exercises = days[dayIdx].exercises;
        const [moved] = exercises.splice(fromIdx, 1);
        exercises.splice(toIdx, 0, moved);
        const key = `${programId}-${blockIdx}-${weekIdx}`;
        set((state) => ({
          blockCustomizations: {
            ...state.blockCustomizations,
            weekOverrides: { ...state.blockCustomizations.weekOverrides, [key]: days },
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      resetWeekToDefault: (programId, blockIdx, weekIdx) => {
        const key = `${programId}-${blockIdx}-${weekIdx}`;
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

      // Completed block workouts
      completedBlockDays: [],

      toggleBlockDayDone: (programId, blockIdx, weekIdx, dayName) => {
        const key = `${programId}-${blockIdx}-${weekIdx}-${dayName}`;
        set((state) => ({
          completedBlockDays: state.completedBlockDays.includes(key)
            ? state.completedBlockDays.filter((k) => k !== key)
            : [...state.completedBlockDays, key],
        }));
      },

      // Cloud sync
      loadFromCloud: (data) => {
        set({
          user: (data.user as UserProfile) ?? get().user,
          workoutSessions: (data.workoutSessions as WorkoutSession[]) ?? get().workoutSessions,
          currentSession: (data.currentSession as WorkoutSession | null) ?? get().currentSession,
          routines: (data.routines as Routine[]) ?? get().routines,
          personalRecords: (data.personalRecords as PersonalRecord[]) ?? get().personalRecords,
          weightEntries: (data.weightEntries as WeightEntry[]) ?? get().weightEntries,
          exerciseGoals: (data.exerciseGoals as ExerciseGoal[]) ?? get().exerciseGoals,
          blockCustomizations: normalizeLoadedCustomizations(data.blockCustomizations) ?? get().blockCustomizations,
          completedBlockDays: (data.completedBlockDays as string[]) ?? get().completedBlockDays,
        });
      },

      getCloudSyncData: () => {
        const state = get();
        // `exercises` is static default data (120+ entries). `loadFromCloud`
        // never restores it — the app always uses the in-code defaults. The
        // only consumer in the cloud is the Siri function, which only reads
        // `id` and `name`. Ship a lean projection to cut sync payload size.
        const leanExercises = state.exercises.map((e) => ({ id: e.id, name: e.name }));
        return {
          user: state.user,
          workoutSessions: state.workoutSessions,
          currentSession: state.currentSession,
          routines: state.routines,
          exercises: leanExercises,
          personalRecords: state.personalRecords,
          weightEntries: state.weightEntries,
          exerciseGoals: state.exerciseGoals,
          blockCustomizations: state.blockCustomizations,
          completedBlockDays: state.completedBlockDays,
        };
      },

      // Reset store to initial state (for logout/user switch)
      resetStore: () => {
        set({
          user: null,
          workoutSessions: [],
          currentSession: null,
          routines: defaultRoutines,
          exercises: defaultExercises,
          personalRecords: [],
          weightEntries: [],
          exerciseGoals: [],
          newPRs: [],
          blockCustomizations: { weekOverrides: {}, updatedAt: new Date().toISOString() },
          completedBlockDays: [],
        });
      },
    }),
    {
      name: 'workout-tracker-storage',
      version: 4,
      migrate: (persistedState: unknown, version: number) => {
        let state = persistedState as Partial<AppState>;
        if (version < 2) {
          // v2: Ensure routines use English names with program grouping
          state = { ...state, routines: defaultRoutines };
        }
        if (version < 3 && state.blockCustomizations) {
          // v3: namespace block-customization keys by program id
          state = {
            ...state,
            blockCustomizations: {
              ...state.blockCustomizations,
              weekOverrides: normalizeBlockKeys(state.blockCustomizations.weekOverrides),
            },
          };
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
