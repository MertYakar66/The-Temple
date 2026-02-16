// Mert's Weekly Workout Routine
// Run the script in browser console to add routines

export const seedRoutinesScript = `
(function() {
  const storageKey = 'fit-track-store';
  const currentState = JSON.parse(localStorage.getItem(storageKey) || '{}');
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Clear existing routines and add fresh ones
  const newRoutines = [
    {
      id: generateId(),
      name: 'Pazartesi - Push (Chest/Shoulders/Triceps)',
      description: 'Push day focusing on chest, shoulders, and triceps',
      exercises: [
        { exerciseId: 'plate-loaded-chest-press', targetSets: 2, targetReps: 5, notes: 'RIR 1 (5-6 reps)' },
        { exerciseId: 'smith-machine-incline-press', targetSets: 2, targetReps: 5, notes: 'RIR 1 (5-6 reps)' },
        { exerciseId: 'chest-fly-machine', targetSets: 1, targetReps: 7, notes: 'To Failure (6-8 reps)' },
        { exerciseId: 'shoulder-press-machine', targetSets: 2, targetReps: 7, notes: 'RIR 1 (6-8 reps)' },
        { exerciseId: 'lateral-raises', targetSets: 3, targetReps: 9, notes: 'To Failure (8-10 reps)' },
        { exerciseId: 'tricep-pushdown', targetSets: 2, targetReps: 7, notes: 'To Failure (6-8 reps)' },
        { exerciseId: 'overhead-rope-extension', targetSets: 2, targetReps: 9, notes: 'To Failure (8-10 reps)' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Salı - Pull (Back/Biceps)',
      description: 'Pull day focusing on back and biceps',
      exercises: [
        { exerciseId: 'lat-pulldown', targetSets: 2, targetReps: 7, notes: 'RIR 1 to Failure (6-8 reps)' },
        { exerciseId: 'plate-loaded-row', targetSets: 3, targetReps: 7, notes: 'RIR 1 to Failure (6-8 reps)' },
        { exerciseId: 'seated-cable-row', targetSets: 1, targetReps: 9, notes: 'To Failure (8-10 reps)' },
        { exerciseId: 'incline-dumbbell-curl', targetSets: 2, targetReps: 7, notes: 'To Failure (6-8 reps)' },
        { exerciseId: 'cable-curl', targetSets: 2, targetReps: 7, notes: 'To Failure (6-8 reps)' },
        { exerciseId: 'hammer-curl', targetSets: 2, targetReps: 9, notes: 'SUPERSET with Reverse Curl (8-10 reps)' },
        { exerciseId: 'reverse-barbell-curl', targetSets: 2, targetReps: 9, notes: 'SUPERSET with Hammer Curl (8-10 reps)' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Çarşamba - Legs',
      description: 'Leg day focusing on quads and hamstrings',
      exercises: [
        { exerciseId: 'leg-press', targetSets: 2, targetReps: 7, notes: 'RIR 1-2 (6-8 reps)' },
        { exerciseId: 'smith-machine-squat', targetSets: 2, targetReps: 7, notes: 'RIR 1-2 (6-8 reps)' },
        { exerciseId: 'leg-extension', targetSets: 2, targetReps: 9, notes: 'To Failure (8-10 reps)' },
        { exerciseId: 'seated-leg-curl', targetSets: 3, targetReps: 9, notes: 'RIR 1 (8-10 reps)' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Cuma - Push (Shoulders/Chest/Triceps)',
      description: 'Push day with shoulder emphasis + abs/calves finisher',
      exercises: [
        { exerciseId: 'shoulder-press-machine', targetSets: 2, targetReps: 7, notes: 'RIR 1 (6-8 reps)' },
        { exerciseId: 'lateral-raises', targetSets: 3, targetReps: 9, notes: 'To Failure (8-10 reps)' },
        { exerciseId: 'smith-machine-incline-press', targetSets: 2, targetReps: 5, notes: 'RIR 1 (5-6 reps)' },
        { exerciseId: 'chest-fly-machine', targetSets: 2, targetReps: 7, notes: 'To Failure (6-8 reps)' },
        { exerciseId: 'cable-rear-delt-fly', targetSets: 2, targetReps: 9, notes: 'To Failure (8-10 reps)' },
        { exerciseId: 'tricep-pushdown', targetSets: 2, targetReps: 7, notes: 'To Failure (6-8 reps)' },
        { exerciseId: 'overhead-rope-extension', targetSets: 2, targetReps: 9, notes: 'To Failure (8-10 reps)' },
        { exerciseId: 'cable-crunch', targetSets: 3, targetReps: 10, notes: 'Finisher' },
        { exerciseId: 'calf-raises', targetSets: 3, targetReps: 10, notes: 'Finisher' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Cumartesi - Pull & Legs',
      description: 'Combined pull and leg day + abs/calves finisher',
      exercises: [
        { exerciseId: 'plate-loaded-row', targetSets: 3, targetReps: 7, notes: 'RIR 1 to Failure (6-8 reps)' },
        { exerciseId: 'lat-pulldown', targetSets: 3, targetReps: 7, notes: 'RIR 1 to Failure (6-8 reps)' },
        { exerciseId: 'romanian-deadlift', targetSets: 2, targetReps: 5, notes: 'RIR 1-2 (5-6 reps)' },
        { exerciseId: 'cable-curl', targetSets: 2, targetReps: 7, notes: 'To Failure (6-8 reps)' },
        { exerciseId: 'hammer-curl', targetSets: 2, targetReps: 9, notes: 'SUPERSET with Reverse Curl (8-10 reps)' },
        { exerciseId: 'reverse-barbell-curl', targetSets: 2, targetReps: 9, notes: 'SUPERSET with Hammer Curl (8-10 reps)' },
        { exerciseId: 'leg-extension', targetSets: 2, targetReps: 7, notes: 'To Failure (6-8 reps)' },
        { exerciseId: 'seated-leg-curl', targetSets: 1, targetReps: 9, notes: 'To Failure (8-10 reps)' },
        { exerciseId: 'cable-crunch', targetSets: 3, targetReps: 10, notes: 'Finisher' },
        { exerciseId: 'calf-raises', targetSets: 3, targetReps: 10, notes: 'Finisher' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Replace all routines
  currentState.state = currentState.state || {};
  currentState.state.routines = newRoutines;
  localStorage.setItem(storageKey, JSON.stringify(currentState));

  console.log('✅ Added 5 routines:');
  newRoutines.forEach(r => console.log('  - ' + r.name));
  console.log('\\n🔄 Refresh the page to see your routines!');
})();
`;
