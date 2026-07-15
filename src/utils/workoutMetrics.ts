import type { WorkoutExercise, WorkoutSession, WorkoutSet } from '../types';
import { parseDateStamp } from './date';

export const getCompletedSetCount = (exercises: WorkoutExercise[]) =>
  exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter((set) => set.completed).length,
    0
  );

export const getTotalSetCount = (exercises: WorkoutExercise[]) =>
  exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

export const getTotalVolume = (exercises: WorkoutExercise[]) =>
  exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce(
        (setTotal, set) => setTotal + (set.completed ? set.weight * set.reps : 0),
        0
      ),
    0
  );

/**
 * One session's worth of a single exercise's real, per-set history.
 * Unlike the lossy `useStore.getExerciseHistory` selector (which reduces each
 * session to {date, maxWeight, totalVolume}), this preserves the actual sets
 * so the per-exercise view can render a true training log.
 */
export interface ExerciseSessionEntry {
  sessionId: string;
  date: string; // 'YYYY-MM-DD'
  name: string;
  sets: WorkoutSet[]; // completed sets for this exercise, in logged order
  bestSet: WorkoutSet | null; // heaviest completed set (tie → more reps)
  volume: number; // kg, sum of weight*reps over completed sets
}

/**
 * Build the per-set history for one exercise straight from sessions,
 * most-recent-first. A session is included only when it has at least one
 * completed, weighted set of the exercise.
 *
 * NOTE: bodyweight / reps-only work (all completed sets at weight 0) is
 * intentionally dropped here — this mirrors the existing `getExerciseHistory`
 * behavior. Surfacing weight-0 sessions is out of scope for now.
 */
export const getExerciseSetHistory = (
  sessions: WorkoutSession[],
  exerciseId: string
): ExerciseSessionEntry[] => {
  const entries: ExerciseSessionEntry[] = [];

  for (const session of sessions) {
    const exercise = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exercise) continue;

    const completedSets = exercise.sets.filter((set) => set.completed);
    // Weighted-only: skip sessions with no completed set carrying real load.
    if (!completedSets.some((set) => set.weight > 0)) continue;

    let bestSet: WorkoutSet | null = null;
    let volume = 0;
    for (const set of completedSets) {
      volume += set.weight * set.reps;
      if (
        bestSet === null ||
        set.weight > bestSet.weight ||
        (set.weight === bestSet.weight && set.reps > bestSet.reps)
      ) {
        bestSet = set;
      }
    }

    entries.push({
      sessionId: session.id,
      date: session.date,
      name: exercise.exercise.name,
      sets: completedSets,
      bestSet,
      volume,
    });
  }

  return entries.sort(
    (a, b) => parseDateStamp(b.date).getTime() - parseDateStamp(a.date).getTime()
  );
};

export const getSessionDurationMinutes = (session: WorkoutSession) => {
  if (!session.startTime || !session.endTime) {
    return null;
  }

  const durationMs =
    new Date(session.endTime).getTime() - new Date(session.startTime).getTime();

  if (Number.isNaN(durationMs) || durationMs <= 0) {
    return null;
  }

  return Math.round(durationMs / 60000);
};
