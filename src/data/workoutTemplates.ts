import type { WorkoutTemplate } from '../types';

export const workoutTemplates: WorkoutTemplate[] = [
  // Push Pull Legs (PPL) - 6 days
  {
    id: 'ppl-6day',
    name: 'Push Pull Legs (6-Day)',
    description: 'Classic PPL split hitting each muscle group twice per week. Great for intermediate to advanced lifters.',
    split: 'ppl',
    daysPerWeek: 6,
    level: 'intermediate',
    routines: [
      {
        dayName: 'Push A',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'incline-bench-press', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'lateral-raises', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'tricep-pushdown', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
          { exerciseId: 'skull-crushers', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Pull A',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, repsMin: 5, repsMax: 6, restSeconds: 180 },
          { exerciseId: 'pull-ups', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'barbell-row', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90 },
          { exerciseId: 'face-pulls', sets: 4, repsMin: 15, repsMax: 20, restSeconds: 60 },
          { exerciseId: 'barbell-curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
          { exerciseId: 'hammer-curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Legs A',
        exercises: [
          { exerciseId: 'squat', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'romanian-deadlift', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'leg-press', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'leg-curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
          { exerciseId: 'leg-extension', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'calf-raises', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Push B',
        exercises: [
          { exerciseId: 'overhead-press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'dumbbell-bench-press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'cable-flyes', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'lateral-raises', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'tricep-pushdown', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'push-ups', sets: 3, repsMin: 10, repsMax: 20, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Pull B',
        exercises: [
          { exerciseId: 'barbell-row', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'lat-pulldown', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'seated-cable-row', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'face-pulls', sets: 4, repsMin: 15, repsMax: 20, restSeconds: 60 },
          { exerciseId: 'barbell-curl', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 60 },
          { exerciseId: 'hammer-curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Legs B',
        exercises: [
          { exerciseId: 'romanian-deadlift', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 180 },
          { exerciseId: 'squat', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'lunges', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'leg-curl', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 60 },
          { exerciseId: 'leg-extension', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'calf-raises', sets: 4, repsMin: 15, repsMax: 20, restSeconds: 60 },
        ],
      },
    ],
  },

  // Upper Lower Split - 4 days
  {
    id: 'upper-lower-4day',
    name: 'Upper/Lower Split (4-Day)',
    description: 'Balanced upper/lower split, great for intermediates who want to train 4 days per week.',
    split: 'upper_lower',
    daysPerWeek: 4,
    level: 'intermediate',
    routines: [
      {
        dayName: 'Upper A (Strength)',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, repsMin: 5, repsMax: 6, restSeconds: 180 },
          { exerciseId: 'barbell-row', sets: 4, repsMin: 5, repsMax: 6, restSeconds: 180 },
          { exerciseId: 'overhead-press', sets: 3, repsMin: 6, repsMax: 8, restSeconds: 120 },
          { exerciseId: 'pull-ups', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'barbell-curl', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 60 },
          { exerciseId: 'tricep-pushdown', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Lower A (Strength)',
        exercises: [
          { exerciseId: 'squat', sets: 4, repsMin: 5, repsMax: 6, restSeconds: 180 },
          { exerciseId: 'romanian-deadlift', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'leg-press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90 },
          { exerciseId: 'leg-curl', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 60 },
          { exerciseId: 'calf-raises', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 60 },
          { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 60, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Upper B (Hypertrophy)',
        exercises: [
          { exerciseId: 'dumbbell-bench-press', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'lat-pulldown', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'lateral-raises', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'seated-cable-row', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'face-pulls', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60 },
          { exerciseId: 'hammer-curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
          { exerciseId: 'skull-crushers', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Lower B (Hypertrophy)',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, repsMin: 5, repsMax: 6, restSeconds: 180 },
          { exerciseId: 'lunges', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'leg-extension', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'leg-curl', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'calf-raises', sets: 4, repsMin: 15, repsMax: 20, restSeconds: 60 },
          { exerciseId: 'cable-crunch', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60 },
        ],
      },
    ],
  },

  // Full Body - 3 days
  {
    id: 'full-body-3day',
    name: 'Full Body (3-Day)',
    description: 'Perfect for beginners or those with limited time. Hit every muscle group 3x per week.',
    split: 'full_body',
    daysPerWeek: 3,
    level: 'beginner',
    routines: [
      {
        dayName: 'Full Body A',
        exercises: [
          { exerciseId: 'squat', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'bench-press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'barbell-row', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90 },
          { exerciseId: 'barbell-curl', sets: 2, repsMin: 10, repsMax: 12, restSeconds: 60 },
          { exerciseId: 'tricep-pushdown', sets: 2, repsMin: 10, repsMax: 12, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Full Body B',
        exercises: [
          { exerciseId: 'deadlift', sets: 3, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'dumbbell-bench-press', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'lat-pulldown', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'lunges', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'lateral-raises', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'plank', sets: 3, repsMin: 30, repsMax: 45, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Full Body C',
        exercises: [
          { exerciseId: 'leg-press', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'incline-bench-press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90 },
          { exerciseId: 'seated-cable-row', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'romanian-deadlift', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'face-pulls', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60 },
          { exerciseId: 'hammer-curl', sets: 2, repsMin: 10, repsMax: 12, restSeconds: 60 },
        ],
      },
    ],
  },

  // Bro Split - 5 days
  {
    id: 'bro-split-5day',
    name: 'Classic Bro Split (5-Day)',
    description: 'Traditional bodybuilding split. One muscle group per day with high volume.',
    split: 'bro_split',
    daysPerWeek: 5,
    level: 'intermediate',
    routines: [
      {
        dayName: 'Chest',
        exercises: [
          { exerciseId: 'bench-press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'incline-bench-press', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'dumbbell-bench-press', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'cable-flyes', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'push-ups', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Back',
        exercises: [
          { exerciseId: 'deadlift', sets: 4, repsMin: 5, repsMax: 6, restSeconds: 180 },
          { exerciseId: 'pull-ups', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'barbell-row', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90 },
          { exerciseId: 'lat-pulldown', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'seated-cable-row', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
        ],
      },
      {
        dayName: 'Shoulders',
        exercises: [
          { exerciseId: 'overhead-press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'lateral-raises', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'face-pulls', sets: 4, repsMin: 15, repsMax: 20, restSeconds: 60 },
          { exerciseId: 'lateral-raises', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Legs',
        exercises: [
          { exerciseId: 'squat', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'romanian-deadlift', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'leg-press', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'leg-extension', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'leg-curl', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'calf-raises', sets: 4, repsMin: 15, repsMax: 20, restSeconds: 60 },
        ],
      },
      {
        dayName: 'Arms',
        exercises: [
          { exerciseId: 'barbell-curl', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90 },
          { exerciseId: 'skull-crushers', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90 },
          { exerciseId: 'hammer-curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
          { exerciseId: 'tricep-pushdown', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
          { exerciseId: 'barbell-curl', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
        ],
      },
    ],
  },
];

export const getTemplateById = (id: string): WorkoutTemplate | undefined => {
  return workoutTemplates.find((t) => t.id === id);
};

export const getTemplatesByLevel = (level: string): WorkoutTemplate[] => {
  return workoutTemplates.filter((t) => t.level === level);
};

export const getTemplatesBySplit = (split: string): WorkoutTemplate[] => {
  return workoutTemplates.filter((t) => t.split === split);
};
