import type { WorkoutExercise, WorkoutSession } from '../types';

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
