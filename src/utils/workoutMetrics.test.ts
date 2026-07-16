import { describe, it, expect } from 'vitest';
import {
  getCompletedSetCount,
  getTotalSetCount,
  getTotalVolume,
  getSessionDurationMinutes,
  getExerciseSetHistory,
} from './workoutMetrics';
import type { WorkoutExercise, WorkoutSession, WorkoutSet } from '../types';

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

let setSeq = 0;
const setOf = (
  weight: number,
  reps: number,
  completed = true,
  extra: Partial<WorkoutSet> = {}
): WorkoutSet => ({
  id: `set-${setSeq++}`,
  weight,
  reps,
  completed,
  ...extra,
});

const sessionOf = (
  id: string,
  date: string,
  exerciseId: string,
  sets: WorkoutSet[],
  name = 'Bench Press'
): WorkoutSession => ({
  id,
  name: 'Session',
  date,
  completed: true,
  exercises: [
    {
      id: `we-${id}`,
      exerciseId,
      exercise: {
        id: exerciseId,
        name,
        description: '',
        muscleGroups: ['chest'],
        equipment: ['barbell'],
        instructions: [],
        tips: [],
      },
      sets,
      restSeconds: 120,
    },
  ],
});

describe('getExerciseSetHistory', () => {
  it('returns entries most-recent-first regardless of source order', () => {
    const sessions = [
      sessionOf('a', '2024-01-01', 'bench', [setOf(100, 5)]),
      sessionOf('b', '2024-01-10', 'bench', [setOf(105, 5)]),
      sessionOf('c', '2024-01-05', 'bench', [setOf(102, 5)]),
    ];
    const history = getExerciseSetHistory(sessions, 'bench');
    expect(history.map((e) => e.date)).toEqual([
      '2024-01-10',
      '2024-01-05',
      '2024-01-01',
    ]);
  });

  it('picks the heaviest completed set as bestSet, breaking ties on more reps', () => {
    const sets = [setOf(100, 5), setOf(100, 8), setOf(90, 12)];
    const history = getExerciseSetHistory(
      [sessionOf('a', '2024-01-01', 'bench', sets)],
      'bench'
    );
    expect(history[0].bestSet?.weight).toBe(100);
    expect(history[0].bestSet?.reps).toBe(8);
  });

  it('sums volume over completed sets only and keeps completed sets in logged order', () => {
    const sets = [
      setOf(100, 5), // 500
      setOf(80, 8), // 640
      setOf(60, 10, false), // excluded (not completed)
    ];
    const history = getExerciseSetHistory(
      [sessionOf('a', '2024-01-01', 'bench', sets)],
      'bench'
    );
    expect(history[0].volume).toBe(1140);
    expect(history[0].sets.map((s) => s.reps)).toEqual([5, 8]);
    expect(history[0].name).toBe('Bench Press');
  });

  it('returns [] when the exercise is not present in any session', () => {
    const sessions = [sessionOf('a', '2024-01-01', 'squat', [setOf(100, 5)])];
    expect(getExerciseSetHistory(sessions, 'bench')).toEqual([]);
  });

  it('excludes sessions with no completed sets of the exercise', () => {
    const sessions = [
      sessionOf('a', '2024-01-01', 'bench', [setOf(100, 5, false)]),
    ];
    expect(getExerciseSetHistory(sessions, 'bench')).toEqual([]);
  });

  it('drops bodyweight/reps-only sessions where every completed set is weight 0', () => {
    const sessions = [sessionOf('a', '2024-01-01', 'bench', [setOf(0, 15)])];
    expect(getExerciseSetHistory(sessions, 'bench')).toEqual([]);
  });

  it('returns [] for no sessions', () => {
    expect(getExerciseSetHistory([], 'bench')).toEqual([]);
  });
});
