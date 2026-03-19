import { describe, it, expect } from 'vitest';
import {
  getCompletedSetCount,
  getTotalSetCount,
  getTotalVolume,
  getSessionDurationMinutes,
} from './workoutMetrics';
import type { WorkoutExercise, WorkoutSession } from '../types';

const makeSet = (weight: number, reps: number, completed: boolean) => ({
  id: `set-${Math.random()}`,
  weight,
  reps,
  completed,
  rir: 2,
});

const makeExercise = (sets: ReturnType<typeof makeSet>[]): WorkoutExercise => ({
  id: 'ex-1',
  exerciseId: 'bench-press',
  exercise: { id: 'bench-press', name: 'Bench Press', description: '', muscleGroups: ['chest'], equipment: ['barbell'], instructions: [], tips: [] },
  sets,
  restSeconds: 120,
});

// WO-09: Volume calculation — only completed sets count
describe('getTotalVolume', () => {
  it('sums weight * reps for completed sets only', () => {
    const exercises = [
      makeExercise([
        makeSet(100, 5, true),  // 500
        makeSet(100, 5, false), // excluded
        makeSet(80, 8, true),   // 640
      ]),
    ];
    expect(getTotalVolume(exercises)).toBe(1140);
  });

  it('returns 0 for no exercises', () => {
    expect(getTotalVolume([])).toBe(0);
  });

  it('returns 0 when no sets are completed', () => {
    const exercises = [makeExercise([makeSet(100, 5, false)])];
    expect(getTotalVolume(exercises)).toBe(0);
  });

  // WO-12: Zero/negative/large numbers
  it('handles zero weight correctly', () => {
    const exercises = [makeExercise([makeSet(0, 10, true)])];
    expect(getTotalVolume(exercises)).toBe(0);
  });

  it('handles large values without overflow', () => {
    const exercises = [makeExercise([makeSet(9999, 9999, true)])];
    expect(getTotalVolume(exercises)).toBe(9999 * 9999);
  });
});

describe('getCompletedSetCount', () => {
  it('counts only completed sets across exercises', () => {
    const exercises = [
      makeExercise([makeSet(100, 5, true), makeSet(100, 5, false)]),
      makeExercise([makeSet(60, 10, true), makeSet(60, 10, true)]),
    ];
    expect(getCompletedSetCount(exercises)).toBe(3);
  });

  it('returns 0 for empty exercises', () => {
    expect(getCompletedSetCount([])).toBe(0);
  });
});

describe('getTotalSetCount', () => {
  it('counts all sets regardless of completion', () => {
    const exercises = [
      makeExercise([makeSet(100, 5, true), makeSet(100, 5, false)]),
    ];
    expect(getTotalSetCount(exercises)).toBe(2);
  });
});

describe('getSessionDurationMinutes', () => {
  it('calculates duration in minutes', () => {
    const session = {
      startTime: '2024-01-15T10:00:00.000Z',
      endTime: '2024-01-15T11:30:00.000Z',
    } as WorkoutSession;
    expect(getSessionDurationMinutes(session)).toBe(90);
  });

  it('returns null when startTime is missing', () => {
    const session = { endTime: '2024-01-15T11:30:00.000Z' } as WorkoutSession;
    expect(getSessionDurationMinutes(session)).toBeNull();
  });

  it('returns null when endTime is missing', () => {
    const session = { startTime: '2024-01-15T10:00:00.000Z' } as WorkoutSession;
    expect(getSessionDurationMinutes(session)).toBeNull();
  });

  it('returns null for negative duration', () => {
    const session = {
      startTime: '2024-01-15T12:00:00.000Z',
      endTime: '2024-01-15T10:00:00.000Z',
    } as WorkoutSession;
    expect(getSessionDurationMinutes(session)).toBeNull();
  });

  it('returns null for zero duration', () => {
    const session = {
      startTime: '2024-01-15T10:00:00.000Z',
      endTime: '2024-01-15T10:00:00.000Z',
    } as WorkoutSession;
    expect(getSessionDurationMinutes(session)).toBeNull();
  });
});
