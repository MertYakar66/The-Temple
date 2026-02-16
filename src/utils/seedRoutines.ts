// Run this in your browser console after opening the app to seed the routines
// Copy and paste the entire script below into the browser console

export const seedRoutinesScript = `
(function() {
  // Get the current state from localStorage
  const storageKey = 'fit-track-store';
  const currentState = JSON.parse(localStorage.getItem(storageKey) || '{}');

  // Generate unique IDs
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Define the routines based on Mert's workout program
  const newRoutines = [
    {
      id: generateId(),
      name: 'Pazartesi - Push (Chest/Shoulders/Triceps)',
      description: 'Push day focusing on chest, shoulders, and triceps',
      exercises: [
        { exerciseId: 'plate-loaded-chest-press', targetSets: 2, targetReps: 5, notes: 'RIR 1' },
        { exerciseId: 'smith-machine-incline-press', targetSets: 2, targetReps: 5, notes: 'RIR 1' },
        { exerciseId: 'chest-fly-machine', targetSets: 1, targetReps: 7, notes: 'To Failure' },
        { exerciseId: 'shoulder-press-machine', targetSets: 2, targetReps: 7, notes: 'RIR 1' },
        { exerciseId: 'lateral-raises', targetSets: 3, targetReps: 9, notes: 'To Failure' },
        { exerciseId: 'tricep-pushdown', targetSets: 2, targetReps: 7, notes: 'To Failure' },
        { exerciseId: 'overhead-rope-extension', targetSets: 2, targetReps: 9, notes: 'To Failure' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Salı - Pull (Back/Biceps)',
      description: 'Pull day focusing on back and biceps',
      exercises: [
        { exerciseId: 'lat-pulldown', targetSets: 2, targetReps: 7, notes: 'RIR 1 to Failure' },
        { exerciseId: 'plate-loaded-row', targetSets: 3, targetReps: 7, notes: 'RIR 1 to Failure' },
        { exerciseId: 'seated-cable-row', targetSets: 1, targetReps: 9, notes: 'To Failure' },
        { exerciseId: 'incline-dumbbell-curl', targetSets: 2, targetReps: 7, notes: 'To Failure' },
        { exerciseId: 'cable-curl', targetSets: 2, targetReps: 7, notes: 'To Failure' },
        { exerciseId: 'hammer-curl', targetSets: 2, targetReps: 9, notes: 'Superset with Reverse Curl - To Failure' },
        { exerciseId: 'reverse-barbell-curl', targetSets: 2, targetReps: 9, notes: 'Superset with Hammer Curl - To Failure' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Çarşamba - Legs',
      description: 'Leg day focusing on quads and hamstrings',
      exercises: [
        { exerciseId: 'leg-press', targetSets: 2, targetReps: 7, notes: 'RIR 1-2' },
        { exerciseId: 'smith-machine-squat', targetSets: 2, targetReps: 7, notes: 'RIR 1-2' },
        { exerciseId: 'leg-extension', targetSets: 2, targetReps: 9, notes: 'To Failure' },
        { exerciseId: 'seated-leg-curl', targetSets: 3, targetReps: 9, notes: 'RIR 1' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Cuma - Push (Shoulders/Chest/Triceps)',
      description: 'Push day with shoulder emphasis',
      exercises: [
        { exerciseId: 'shoulder-press-machine', targetSets: 2, targetReps: 7, notes: 'RIR 1' },
        { exerciseId: 'lateral-raises', targetSets: 3, targetReps: 9, notes: 'To Failure' },
        { exerciseId: 'smith-machine-incline-press', targetSets: 2, targetReps: 5, notes: 'RIR 1' },
        { exerciseId: 'chest-fly-machine', targetSets: 2, targetReps: 7, notes: 'To Failure' },
        { exerciseId: 'cable-rear-delt-fly', targetSets: 2, targetReps: 9, notes: 'To Failure' },
        { exerciseId: 'tricep-pushdown', targetSets: 2, targetReps: 7, notes: 'To Failure' },
        { exerciseId: 'overhead-rope-extension', targetSets: 2, targetReps: 9, notes: 'To Failure' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Cumartesi - Pull & Legs',
      description: 'Combined pull and leg day',
      exercises: [
        { exerciseId: 'plate-loaded-row', targetSets: 3, targetReps: 7, notes: 'RIR 1 to Failure' },
        { exerciseId: 'lat-pulldown', targetSets: 3, targetReps: 7, notes: 'RIR 1 to Failure' },
        { exerciseId: 'romanian-deadlift', targetSets: 2, targetReps: 5, notes: 'RIR 1-2' },
        { exerciseId: 'cable-curl', targetSets: 2, targetReps: 7, notes: 'To Failure' },
        { exerciseId: 'hammer-curl', targetSets: 2, targetReps: 9, notes: 'Superset with Reverse Curl - To Failure' },
        { exerciseId: 'reverse-barbell-curl', targetSets: 2, targetReps: 9, notes: 'Superset with Hammer Curl - To Failure' },
        { exerciseId: 'leg-extension', targetSets: 2, targetReps: 7, notes: 'To Failure' },
        { exerciseId: 'seated-leg-curl', targetSets: 1, targetReps: 9, notes: 'To Failure' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Merge with existing routines (avoid duplicates)
  const existingRoutines = currentState.state?.routines || [];
  const existingNames = existingRoutines.map(r => r.name);
  const routinesToAdd = newRoutines.filter(r => !existingNames.includes(r.name));

  if (routinesToAdd.length === 0) {
    console.log('All routines already exist!');
    return;
  }

  // Update state
  currentState.state = currentState.state || {};
  currentState.state.routines = [...existingRoutines, ...routinesToAdd];

  // Save back to localStorage
  localStorage.setItem(storageKey, JSON.stringify(currentState));

  console.log('Added ' + routinesToAdd.length + ' routines:');
  routinesToAdd.forEach(r => console.log('  - ' + r.name));
  console.log('Refresh the page to see your new routines!');
})();
`;

// Instructions for the user
export const instructions = `
HOW TO ADD YOUR ROUTINES:

1. Open your app in the browser (http://localhost:5173)
2. Open the browser console (F12 or Cmd+Option+I, then click "Console" tab)
3. Copy and paste the script below into the console
4. Press Enter
5. Refresh the page

The script will add 5 routines:
- Pazartesi - Push (Chest/Shoulders/Triceps)
- Salı - Pull (Back/Biceps)
- Çarşamba - Legs
- Cuma - Push (Shoulders/Chest/Triceps)
- Cumartesi - Pull & Legs
`;
