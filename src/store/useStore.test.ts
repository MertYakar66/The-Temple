import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import type { Exercise } from '../types';

function findUndefinedPaths(obj: unknown, path = ''): string[] {
  if (obj === undefined) return [path || '<root>'];
  if (obj === null || typeof obj !== 'object') return [];
  const paths: string[] = [];
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => paths.push(...findUndefinedPaths(v, `${path}[${i}]`)));
  } else {
    for (const [k, v] of Object.entries(obj)) {
      paths.push(...findUndefinedPaths(v, path ? `${path}.${k}` : k));
    }
  }
  return paths;
}

const STUB_EXERCISE: Exercise = {
  id: 'stub-exercise',
  name: 'Stub Exercise',
  description: '',
  muscleGroups: ['chest'],
  equipment: [],
  instructions: [],
  tips: [],
};

describe('useStore — Batch 1 null-emit invariants', () => {
  beforeEach(() => {
    useStore.getState().resetStore();
  });

  it('setExerciseGoal({ targetRIR: null }) clears any prior targetRIR/targetSets', () => {
    // First save with concrete values.
    useStore.getState().setExerciseGoal({
      exerciseId: 'ex-1',
      targetWeight: 100,
      targetReps: 8,
      targetRIR: 2,
      targetSets: 4,
      notes: '',
    });
    expect(useStore.getState().getExerciseGoal('ex-1')?.targetRIR).toBe(2);
    expect(useStore.getState().getExerciseGoal('ex-1')?.targetSets).toBe(4);

    // Re-save with null in the optional fields (matches WorkoutExerciseCard
    // post-Batch 1: goalRIR ? parseInt(goalRIR) : null).
    useStore.getState().setExerciseGoal({
      exerciseId: 'ex-1',
      targetWeight: 100,
      targetReps: 8,
      targetRIR: null,
      targetSets: null,
      notes: '',
    });
    const cleared = useStore.getState().getExerciseGoal('ex-1');
    expect(cleared?.targetRIR).toBeNull();
    expect(cleared?.targetSets).toBeNull();
    expect(cleared?.targetRIR).not.toBe(undefined);
    expect(cleared?.targetRIR).not.toBe(2);
  });

  it('updateSet({ rir: null }) clears the field', () => {
    useStore.getState().startWorkout('Test workout');
    useStore.getState().addExerciseToSession(STUB_EXERCISE);
    const session = useStore.getState().currentSession!;
    const exercise = session.exercises[0];
    const setId = exercise.sets[0].id;

    useStore.getState().updateSet(exercise.id, setId, { rir: 3 });
    expect(useStore.getState().currentSession!.exercises[0].sets[0].rir).toBe(3);

    // SetRow's clear path post-Batch 1: e.target.value === '' ? null : parseInt(...).
    useStore.getState().updateSet(exercise.id, setId, { rir: null });
    const cleared = useStore.getState().currentSession!.exercises[0].sets[0];
    expect(cleared.rir).toBeNull();
    expect(cleared.rir).not.toBe(undefined);
    expect(cleared.rir).not.toBe(3);
  });

  it('getCloudSyncData() output contains no undefined values after null-emit edits', () => {
    useStore.getState().setExerciseGoal({
      exerciseId: 'ex-1',
      targetWeight: 100,
      targetReps: 8,
      targetRIR: null,
      targetSets: null,
      notes: '',
    });
    // Pass an explicit routineId. This sidesteps a separate Batch-1-class
    // finding surfaced while writing this test: useStore.startWorkout sets
    // currentSession.routineId from its second parameter, which means
    // calling it without a routineId leaves currentSession.routineId =
    // undefined and would fail Firestore sync. Not in scope for Batch 1
    // (audit covered startWorkoutFromBlock but not startWorkout); flag for
    // a future cleanup batch.
    useStore.getState().startWorkout('Test', 'test-routine');
    useStore.getState().addExerciseToSession(STUB_EXERCISE);
    const exId = useStore.getState().currentSession!.exercises[0].id;
    const setId = useStore.getState().currentSession!.exercises[0].sets[0].id;
    useStore.getState().updateSet(exId, setId, { rir: null });

    const cloudData = useStore.getState().getCloudSyncData();
    const undefinedPaths = findUndefinedPaths(cloudData);
    expect(undefinedPaths, 'Firestore would reject these paths').toEqual([]);

    const roundtripped = JSON.parse(JSON.stringify(cloudData));
    expect(roundtripped).toStrictEqual(cloudData);
  });
});

describe('useStore — completed block days', () => {
  beforeEach(() => {
    useStore.getState().resetStore();
  });

  it('toggleBlockDayDone adds then removes a namespaced day key', () => {
    expect(useStore.getState().completedBlockDays).toEqual([]);

    useStore.getState().toggleBlockDayDone('powerbuilding', 0, 0, 'Full Body 1');
    expect(useStore.getState().completedBlockDays).toEqual([
      'powerbuilding-0-0-Full Body 1',
    ]);

    useStore.getState().toggleBlockDayDone('powerbuilding', 0, 0, 'Full Body 1');
    expect(useStore.getState().completedBlockDays).toEqual([]);
  });

  it('keeps each program/week/day independent', () => {
    useStore.getState().toggleBlockDayDone('powerbuilding', 0, 0, 'Full Body 1');
    useStore.getState().toggleBlockDayDone('minmax', 0, 0, 'Upper 1');
    useStore.getState().toggleBlockDayDone('powerbuilding', 0, 1, 'Lower 1');
    expect(useStore.getState().completedBlockDays).toHaveLength(3);

    useStore.getState().toggleBlockDayDone('powerbuilding', 0, 0, 'Full Body 1');
    expect(useStore.getState().completedBlockDays).toEqual([
      'minmax-0-0-Upper 1',
      'powerbuilding-0-1-Lower 1',
    ]);
  });

  it('includes completedBlockDays in the cloud projection and resetStore clears it', () => {
    useStore.getState().toggleBlockDayDone('powerbuilding', 0, 0, 'Full Body 1');
    expect(useStore.getState().getCloudSyncData().completedBlockDays).toEqual([
      'powerbuilding-0-0-Full Body 1',
    ]);
    useStore.getState().resetStore();
    expect(useStore.getState().completedBlockDays).toEqual([]);
  });
});
