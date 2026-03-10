import { v4 as uuidv4 } from 'uuid';
import type { Routine } from '../types';

const generateId = () => uuidv4();

const PROGRAM_NAME = "Guray Baba's Hypertrophy Program";

export const defaultRoutines: Routine[] = [
  {
    id: generateId(),
    name: 'Monday - Push (Chest/Shoulders/Triceps)',
    description: 'Push day focusing on chest, shoulders, and triceps',
    program: PROGRAM_NAME,
    exercises: [
      { id: generateId(), exerciseId: 'plate-loaded-chest-press', targetSets: 2, targetReps: 5, restSeconds: 120, notes: 'RIR 1 (5-6 reps)' },
      { id: generateId(), exerciseId: 'smith-machine-incline-press', targetSets: 2, targetReps: 5, restSeconds: 120, notes: 'RIR 1 (5-6 reps)' },
      { id: generateId(), exerciseId: 'chest-fly-machine', targetSets: 1, targetReps: 7, restSeconds: 90, notes: 'To Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'shoulder-press-machine', targetSets: 2, targetReps: 7, restSeconds: 90, notes: 'RIR 1 (6-8 reps)' },
      { id: generateId(), exerciseId: 'lateral-raises', targetSets: 3, targetReps: 9, restSeconds: 60, notes: 'To Failure (8-10 reps)' },
      { id: generateId(), exerciseId: 'tricep-pushdown', targetSets: 2, targetReps: 7, restSeconds: 60, notes: 'To Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'overhead-rope-extension', targetSets: 2, targetReps: 9, restSeconds: 60, notes: 'To Failure (8-10 reps)' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: 'Tuesday - Pull (Back/Biceps)',
    description: 'Pull day focusing on back and biceps',
    program: PROGRAM_NAME,
    exercises: [
      { id: generateId(), exerciseId: 'lat-pulldown', targetSets: 2, targetReps: 7, restSeconds: 90, notes: 'RIR 1 to Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'plate-loaded-row', targetSets: 3, targetReps: 7, restSeconds: 90, notes: 'RIR 1 to Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'seated-cable-row', targetSets: 1, targetReps: 9, restSeconds: 90, notes: 'To Failure (8-10 reps)' },
      { id: generateId(), exerciseId: 'incline-dumbbell-curl', targetSets: 2, targetReps: 7, restSeconds: 60, notes: 'To Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'cable-curl', targetSets: 2, targetReps: 7, restSeconds: 60, notes: 'To Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'hammer-curl', targetSets: 2, targetReps: 9, restSeconds: 60, notes: 'SUPERSET with Reverse Curl (8-10 reps)' },
      { id: generateId(), exerciseId: 'reverse-barbell-curl', targetSets: 2, targetReps: 9, restSeconds: 60, notes: 'SUPERSET with Hammer Curl (8-10 reps)' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: 'Wednesday - Legs',
    description: 'Leg day focusing on quads and hamstrings',
    program: PROGRAM_NAME,
    exercises: [
      { id: generateId(), exerciseId: 'leg-press', targetSets: 2, targetReps: 7, restSeconds: 120, notes: 'RIR 1-2 (6-8 reps)' },
      { id: generateId(), exerciseId: 'smith-machine-squat', targetSets: 2, targetReps: 7, restSeconds: 120, notes: 'RIR 1-2 (6-8 reps)' },
      { id: generateId(), exerciseId: 'leg-extension', targetSets: 2, targetReps: 9, restSeconds: 60, notes: 'To Failure (8-10 reps)' },
      { id: generateId(), exerciseId: 'seated-leg-curl', targetSets: 3, targetReps: 9, restSeconds: 60, notes: 'RIR 1 (8-10 reps)' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: 'Friday - Push (Shoulders/Chest/Triceps)',
    description: 'Push day with shoulder emphasis + abs/calves finisher',
    program: PROGRAM_NAME,
    exercises: [
      { id: generateId(), exerciseId: 'shoulder-press-machine', targetSets: 2, targetReps: 7, restSeconds: 90, notes: 'RIR 1 (6-8 reps)' },
      { id: generateId(), exerciseId: 'lateral-raises', targetSets: 3, targetReps: 9, restSeconds: 60, notes: 'To Failure (8-10 reps)' },
      { id: generateId(), exerciseId: 'smith-machine-incline-press', targetSets: 2, targetReps: 5, restSeconds: 120, notes: 'RIR 1 (5-6 reps)' },
      { id: generateId(), exerciseId: 'chest-fly-machine', targetSets: 2, targetReps: 7, restSeconds: 90, notes: 'To Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'cable-rear-delt-fly', targetSets: 2, targetReps: 9, restSeconds: 60, notes: 'To Failure (8-10 reps)' },
      { id: generateId(), exerciseId: 'tricep-pushdown', targetSets: 2, targetReps: 7, restSeconds: 60, notes: 'To Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'overhead-rope-extension', targetSets: 2, targetReps: 9, restSeconds: 60, notes: 'To Failure (8-10 reps)' },
      { id: generateId(), exerciseId: 'cable-crunch', targetSets: 3, targetReps: 10, restSeconds: 45, notes: 'Finisher' },
      { id: generateId(), exerciseId: 'calf-raises', targetSets: 3, targetReps: 10, restSeconds: 45, notes: 'Finisher' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: 'Saturday - Pull & Legs',
    description: 'Combined pull and leg day + abs/calves finisher',
    program: PROGRAM_NAME,
    exercises: [
      { id: generateId(), exerciseId: 'plate-loaded-row', targetSets: 3, targetReps: 7, restSeconds: 90, notes: 'RIR 1 to Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'lat-pulldown', targetSets: 3, targetReps: 7, restSeconds: 90, notes: 'RIR 1 to Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'romanian-deadlift', targetSets: 2, targetReps: 5, restSeconds: 120, notes: 'RIR 1-2 (5-6 reps)' },
      { id: generateId(), exerciseId: 'cable-curl', targetSets: 2, targetReps: 7, restSeconds: 60, notes: 'To Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'hammer-curl', targetSets: 2, targetReps: 9, restSeconds: 60, notes: 'SUPERSET with Reverse Curl (8-10 reps)' },
      { id: generateId(), exerciseId: 'reverse-barbell-curl', targetSets: 2, targetReps: 9, restSeconds: 60, notes: 'SUPERSET with Hammer Curl (8-10 reps)' },
      { id: generateId(), exerciseId: 'leg-extension', targetSets: 2, targetReps: 7, restSeconds: 60, notes: 'To Failure (6-8 reps)' },
      { id: generateId(), exerciseId: 'seated-leg-curl', targetSets: 1, targetReps: 9, restSeconds: 60, notes: 'To Failure (8-10 reps)' },
      { id: generateId(), exerciseId: 'cable-crunch', targetSets: 3, targetReps: 10, restSeconds: 45, notes: 'Finisher' },
      { id: generateId(), exerciseId: 'calf-raises', targetSets: 3, targetReps: 10, restSeconds: 45, notes: 'Finisher' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
