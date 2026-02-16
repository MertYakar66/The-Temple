import type { Exercise, MuscleGroup } from '../types';

export const defaultExercises: Exercise[] = [
  // Chest
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    description: 'A compound pushing exercise that targets the chest, shoulders, and triceps.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['barbell', 'bench'],
    instructions: [
      'Lie flat on a bench with feet firmly on the ground',
      'Grip the bar slightly wider than shoulder width',
      'Unrack the bar and lower it to mid-chest',
      'Press the bar up until arms are fully extended',
      'Keep shoulder blades retracted throughout'
    ],
    tips: [
      'Keep your wrists straight',
      'Drive through your feet for stability',
      'Control the descent - don\'t bounce off chest'
    ],
    variations: ['Incline Bench Press', 'Decline Bench Press', 'Dumbbell Bench Press']
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    description: 'A chest pressing movement using dumbbells for greater range of motion.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['dumbbells', 'bench'],
    instructions: [
      'Lie on a flat bench holding dumbbells at chest level',
      'Press dumbbells up until arms are extended',
      'Lower with control to starting position',
      'Keep elbows at 45-degree angle to body'
    ],
    tips: [
      'Use a neutral or slight inward grip',
      'Don\'t let dumbbells drift too far apart at the top'
    ],
    variations: ['Incline Dumbbell Press', 'Neutral Grip Dumbbell Press']
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    description: 'A bodyweight exercise targeting chest, shoulders, and triceps.',
    muscleGroups: ['chest', 'shoulders', 'triceps', 'abs'],
    equipment: ['bodyweight'],
    instructions: [
      'Start in plank position with hands slightly wider than shoulders',
      'Lower body until chest nearly touches the ground',
      'Push back up to starting position',
      'Keep body in a straight line throughout'
    ],
    tips: [
      'Engage your core',
      'Don\'t let hips sag or pike up'
    ],
    variations: ['Diamond Push-Ups', 'Wide Push-Ups', 'Decline Push-Ups']
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Barbell Bench Press',
    description: 'A pressing movement on an incline bench targeting upper chest.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['barbell', 'incline bench'],
    instructions: [
      'Set bench to 30-45 degree incline',
      'Grip bar slightly wider than shoulder width',
      'Lower bar to upper chest',
      'Press up to full extension'
    ],
    tips: [
      'Don\'t set incline too steep - this shifts focus to shoulders',
      'Keep feet planted firmly'
    ],
    variations: ['Incline Dumbbell Press', 'Incline Smith Machine Press']
  },
  {
    id: 'cable-flyes',
    name: 'Cable Flyes',
    description: 'An isolation exercise for chest using cables for constant tension.',
    muscleGroups: ['chest'],
    equipment: ['cable machine'],
    instructions: [
      'Set pulleys to chest height',
      'Stand in the middle, grab handles',
      'Step forward into a staggered stance',
      'Bring hands together in front of chest with slight bend in elbows',
      'Return with control to starting position'
    ],
    tips: [
      'Focus on squeezing chest at the peak',
      'Maintain slight elbow bend throughout'
    ],
    variations: ['High Cable Flyes', 'Low Cable Flyes']
  },

  // Back
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    description: 'A compound pulling exercise that works the entire posterior chain.',
    muscleGroups: ['back', 'hamstrings', 'glutes'],
    equipment: ['barbell'],
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Hinge at hips and grip bar just outside knees',
      'Keep back flat, chest up',
      'Drive through heels, extending hips and knees together',
      'Stand tall at the top, then reverse the movement'
    ],
    tips: [
      'Keep the bar close to your body',
      'Don\'t round your lower back',
      'Think of pushing the floor away'
    ],
    variations: ['Sumo Deadlift', 'Romanian Deadlift', 'Trap Bar Deadlift']
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    description: 'A compound rowing movement for back thickness.',
    muscleGroups: ['back', 'biceps'],
    equipment: ['barbell'],
    instructions: [
      'Hinge at hips with knees slightly bent',
      'Grip bar slightly wider than shoulder width',
      'Pull bar to lower chest/upper abdomen',
      'Lower with control'
    ],
    tips: [
      'Keep torso relatively stable - minimal momentum',
      'Squeeze shoulder blades at the top'
    ],
    variations: ['Pendlay Row', 'Underhand Barbell Row']
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    description: 'A bodyweight pulling exercise for back width.',
    muscleGroups: ['back', 'biceps'],
    equipment: ['pull-up bar'],
    instructions: [
      'Hang from bar with overhand grip, slightly wider than shoulders',
      'Pull body up until chin clears the bar',
      'Lower with control to full hang',
      'Keep core engaged throughout'
    ],
    tips: [
      'Avoid excessive swinging',
      'Initiate the pull by depressing shoulder blades'
    ],
    variations: ['Chin-Ups', 'Neutral Grip Pull-Ups', 'Wide Grip Pull-Ups']
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    description: 'A cable exercise mimicking pull-up movement pattern.',
    muscleGroups: ['back', 'biceps'],
    equipment: ['cable machine', 'lat pulldown bar'],
    instructions: [
      'Sit at lat pulldown station, secure thighs under pad',
      'Grip bar wider than shoulder width',
      'Pull bar down to upper chest',
      'Control the return to full stretch'
    ],
    tips: [
      'Don\'t lean back excessively',
      'Focus on pulling with elbows, not hands'
    ],
    variations: ['Close Grip Pulldown', 'Underhand Pulldown']
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    description: 'A horizontal rowing movement for back development.',
    muscleGroups: ['back', 'biceps'],
    equipment: ['cable machine'],
    instructions: [
      'Sit at cable row station with feet on platform',
      'Grip handle with arms extended',
      'Pull handle to lower chest/upper abdomen',
      'Return with control'
    ],
    tips: [
      'Keep chest up throughout',
      'Don\'t rock back and forth excessively'
    ],
    variations: ['Wide Grip Cable Row', 'Single Arm Cable Row']
  },

  // Shoulders
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    description: 'A compound pressing movement for shoulder development.',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: ['barbell'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Grip bar just outside shoulders, bar at collarbone',
      'Press bar overhead until arms are locked out',
      'Lower with control to starting position'
    ],
    tips: [
      'Squeeze glutes and brace core',
      'Move head back slightly as bar passes face'
    ],
    variations: ['Seated Overhead Press', 'Dumbbell Shoulder Press', 'Push Press']
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    description: 'An isolation exercise for the lateral deltoids.',
    muscleGroups: ['shoulders'],
    equipment: ['dumbbells'],
    instructions: [
      'Stand holding dumbbells at sides',
      'Raise arms out to sides until parallel with floor',
      'Lower with control',
      'Keep slight bend in elbows'
    ],
    tips: [
      'Lead with elbows, not hands',
      'Don\'t use momentum - control the weight'
    ],
    variations: ['Cable Lateral Raises', 'Seated Lateral Raises']
  },
  {
    id: 'face-pulls',
    name: 'Face Pulls',
    description: 'A rear delt and upper back exercise using cables.',
    muscleGroups: ['shoulders', 'back'],
    equipment: ['cable machine', 'rope attachment'],
    instructions: [
      'Set cable to upper chest height with rope attachment',
      'Pull rope towards face, separating hands as you pull',
      'Squeeze shoulder blades and externally rotate shoulders',
      'Return with control'
    ],
    tips: [
      'Keep elbows high',
      'Focus on rear delt and upper back contraction'
    ],
    variations: ['Band Face Pulls', 'Prone Face Pulls']
  },

  // Arms
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    description: 'A bicep isolation exercise using a barbell.',
    muscleGroups: ['biceps'],
    equipment: ['barbell'],
    instructions: [
      'Stand holding barbell with underhand grip',
      'Curl bar up towards shoulders',
      'Lower with control',
      'Keep elbows stationary at sides'
    ],
    tips: [
      'Don\'t swing the weight',
      'Full range of motion for best results'
    ],
    variations: ['EZ Bar Curl', 'Wide Grip Curl', 'Close Grip Curl']
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    description: 'A tricep isolation exercise using cables.',
    muscleGroups: ['triceps'],
    equipment: ['cable machine'],
    instructions: [
      'Stand facing cable machine with rope or bar attachment',
      'Pin elbows to sides',
      'Push down until arms are fully extended',
      'Return with control'
    ],
    tips: [
      'Keep upper arms stationary',
      'Squeeze triceps at the bottom'
    ],
    variations: ['Rope Pushdown', 'Reverse Grip Pushdown']
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    description: 'A bicep and brachialis exercise with neutral grip.',
    muscleGroups: ['biceps', 'forearms'],
    equipment: ['dumbbells'],
    instructions: [
      'Stand holding dumbbells with neutral grip (palms facing each other)',
      'Curl weights up towards shoulders',
      'Lower with control',
      'Keep elbows stationary'
    ],
    tips: [
      'Great for overall arm thickness',
      'Can be done alternating or simultaneously'
    ],
    variations: ['Cross Body Hammer Curl', 'Rope Hammer Curl']
  },
  {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    description: 'A tricep exercise performed lying on a bench.',
    muscleGroups: ['triceps'],
    equipment: ['ez bar', 'bench'],
    instructions: [
      'Lie on bench holding EZ bar with narrow grip',
      'Start with arms extended above chest',
      'Lower bar towards forehead by bending elbows',
      'Extend arms back to starting position'
    ],
    tips: [
      'Keep upper arms perpendicular to floor',
      'Control the descent'
    ],
    variations: ['Dumbbell Skull Crushers', 'Cable Skull Crushers']
  },

  // Legs
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    description: 'The king of leg exercises - a compound movement for overall leg development.',
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
    equipment: ['barbell', 'squat rack'],
    instructions: [
      'Position bar on upper back, unrack and step back',
      'Stand with feet shoulder-width apart or slightly wider',
      'Bend at hips and knees, descending until thighs are parallel or below',
      'Drive through feet to stand back up',
      'Keep chest up and core braced throughout'
    ],
    tips: [
      'Keep knees tracking over toes',
      'Don\'t let knees cave inward',
      'Depth should be based on mobility - go as deep as you can with good form'
    ],
    variations: ['Front Squat', 'Goblet Squat', 'Box Squat']
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    description: 'A machine-based leg exercise allowing heavy loading.',
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
    equipment: ['leg press machine'],
    instructions: [
      'Sit in leg press with back flat against pad',
      'Place feet shoulder-width apart on platform',
      'Lower platform by bending knees',
      'Press back up without locking knees completely'
    ],
    tips: [
      'Don\'t let lower back round at the bottom',
      'Keep knees in line with toes'
    ],
    variations: ['Single Leg Press', 'High Foot Placement', 'Low Foot Placement']
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    description: 'A hip-hinge movement emphasizing the hamstrings and glutes.',
    muscleGroups: ['hamstrings', 'glutes', 'back'],
    equipment: ['barbell'],
    instructions: [
      'Stand holding barbell at hips with slight knee bend',
      'Hinge at hips, pushing them back',
      'Lower bar along legs until you feel hamstring stretch',
      'Drive hips forward to return to starting position'
    ],
    tips: [
      'Keep bar close to body',
      'Maintain neutral spine throughout',
      'Don\'t go lower than your mobility allows'
    ],
    variations: ['Dumbbell RDL', 'Single Leg RDL']
  },
  {
    id: 'lunges',
    name: 'Walking Lunges',
    description: 'A unilateral leg exercise for strength and balance.',
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
    equipment: ['dumbbells', 'bodyweight'],
    instructions: [
      'Stand tall with dumbbells at sides (or bodyweight)',
      'Step forward into a lunge position',
      'Lower until back knee nearly touches ground',
      'Drive through front foot to step forward into next lunge'
    ],
    tips: [
      'Keep torso upright',
      'Front knee should track over toe'
    ],
    variations: ['Reverse Lunges', 'Bulgarian Split Squat', 'Static Lunges']
  },
  {
    id: 'leg-curl',
    name: 'Lying Leg Curl',
    description: 'An isolation exercise for the hamstrings.',
    muscleGroups: ['hamstrings'],
    equipment: ['leg curl machine'],
    instructions: [
      'Lie face down on leg curl machine',
      'Position ankles under pad',
      'Curl weight up towards glutes',
      'Lower with control'
    ],
    tips: [
      'Don\'t lift hips off the pad',
      'Full range of motion for best results'
    ],
    variations: ['Seated Leg Curl', 'Single Leg Curl']
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    description: 'An isolation exercise for the quadriceps.',
    muscleGroups: ['quadriceps'],
    equipment: ['leg extension machine'],
    instructions: [
      'Sit in leg extension machine with back against pad',
      'Position ankles behind pad',
      'Extend legs until straight',
      'Lower with control'
    ],
    tips: [
      'Don\'t use momentum',
      'Squeeze quads at the top'
    ],
    variations: ['Single Leg Extension']
  },
  {
    id: 'calf-raises',
    name: 'Standing Calf Raises',
    description: 'An isolation exercise for the calves.',
    muscleGroups: ['calves'],
    equipment: ['calf raise machine', 'dumbbells'],
    instructions: [
      'Stand on edge of platform with heels hanging off',
      'Rise up onto toes as high as possible',
      'Lower heels below platform level for full stretch',
      'Repeat'
    ],
    tips: [
      'Full range of motion is key',
      'Pause at the top for better contraction'
    ],
    variations: ['Seated Calf Raises', 'Single Leg Calf Raises']
  },

  // Core
  {
    id: 'plank',
    name: 'Plank',
    description: 'An isometric core exercise for stability.',
    muscleGroups: ['abs'],
    equipment: ['bodyweight'],
    instructions: [
      'Start in forearm plank position',
      'Keep body in straight line from head to heels',
      'Engage core and hold position',
      'Don\'t let hips sag or pike up'
    ],
    tips: [
      'Squeeze glutes for stability',
      'Look at floor to maintain neutral neck'
    ],
    variations: ['Side Plank', 'High Plank', 'Plank with Shoulder Taps']
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    description: 'A weighted abdominal exercise using cables.',
    muscleGroups: ['abs'],
    equipment: ['cable machine', 'rope attachment'],
    instructions: [
      'Kneel in front of cable machine with rope behind head',
      'Crunch down, bringing elbows towards knees',
      'Focus on curling spine and contracting abs',
      'Return with control'
    ],
    tips: [
      'Don\'t pull with arms - use abs to curl',
      'Keep hips stationary'
    ],
    variations: ['Standing Cable Crunch']
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    description: 'An advanced core exercise targeting lower abs.',
    muscleGroups: ['abs'],
    equipment: ['pull-up bar'],
    instructions: [
      'Hang from pull-up bar with straight arms',
      'Raise legs up until parallel or higher',
      'Lower with control',
      'Minimize swinging'
    ],
    tips: [
      'Bend knees to make it easier',
      'Raise legs higher to increase difficulty'
    ],
    variations: ['Knee Raises', 'Toes to Bar']
  },

  // Additional exercises for Mert's routines
  {
    id: 'plate-loaded-chest-press',
    name: 'Plate Loaded Chest Press',
    description: 'A machine chest press that allows for heavy, stable pressing.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['plate loaded machine'],
    instructions: [
      'Sit with back flat against pad',
      'Grip handles at chest level',
      'Press forward until arms are extended',
      'Return with control'
    ],
    tips: [
      'Keep shoulder blades retracted',
      'Don\'t lock out elbows completely'
    ],
    variations: ['Incline Plate Loaded Press', 'Decline Plate Loaded Press']
  },
  {
    id: 'smith-machine-incline-press',
    name: 'Smith Machine Low Incline Press',
    description: 'An incline press using the Smith machine for stability.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['smith machine', 'adjustable bench'],
    instructions: [
      'Set bench to 15-30 degree incline under Smith machine',
      'Grip bar slightly wider than shoulders',
      'Lower bar to upper chest',
      'Press up to full extension'
    ],
    tips: [
      'Keep feet planted firmly',
      'Control the descent'
    ],
    variations: ['Flat Smith Machine Press', 'High Incline Smith Press']
  },
  {
    id: 'chest-fly-machine',
    name: 'Chest Fly Machine',
    description: 'A machine-based chest isolation exercise.',
    muscleGroups: ['chest'],
    equipment: ['pec deck machine'],
    instructions: [
      'Sit with back against pad',
      'Place forearms on pads or grip handles',
      'Bring arms together in front of chest',
      'Return with control to starting position'
    ],
    tips: [
      'Focus on squeezing chest at the peak',
      'Keep slight bend in elbows'
    ],
    variations: ['Reverse Pec Deck']
  },
  {
    id: 'shoulder-press-machine',
    name: 'Shoulder Press Machine',
    description: 'A machine overhead press for shoulder development.',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: ['shoulder press machine'],
    instructions: [
      'Sit with back against pad',
      'Grip handles at shoulder level',
      'Press up until arms are extended',
      'Lower with control'
    ],
    tips: [
      'Don\'t arch back excessively',
      'Keep core engaged'
    ],
    variations: ['Single Arm Machine Press']
  },
  {
    id: 'overhead-rope-extension',
    name: 'Overhead Rope Extension',
    description: 'A tricep exercise emphasizing the long head.',
    muscleGroups: ['triceps'],
    equipment: ['cable machine', 'rope attachment'],
    instructions: [
      'Face away from low cable with rope overhead',
      'Extend arms overhead, keeping elbows close to head',
      'Lower rope behind head by bending elbows',
      'Return to extended position'
    ],
    tips: [
      'Keep upper arms stationary',
      'Focus on tricep contraction'
    ],
    variations: ['Dumbbell Overhead Extension', 'EZ Bar Overhead Extension']
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    description: 'A bicep curl performed on an incline bench for greater stretch.',
    muscleGroups: ['biceps'],
    equipment: ['dumbbells', 'incline bench'],
    instructions: [
      'Sit on incline bench set to 45-60 degrees',
      'Let arms hang straight down with dumbbells',
      'Curl weights up towards shoulders',
      'Lower with control'
    ],
    tips: [
      'Don\'t swing the weights',
      'Keep elbows pointing down throughout'
    ],
    variations: ['Alternating Incline Curl']
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    description: 'A bicep curl using cables for constant tension.',
    muscleGroups: ['biceps'],
    equipment: ['cable machine'],
    instructions: [
      'Stand facing low cable with straight bar or EZ attachment',
      'Grip bar with underhand grip',
      'Curl bar up towards shoulders',
      'Lower with control'
    ],
    tips: [
      'Keep elbows stationary at sides',
      'Constant tension throughout movement'
    ],
    variations: ['Rope Cable Curl', 'High Cable Curl']
  },
  {
    id: 'reverse-barbell-curl',
    name: 'Reverse Barbell Curl',
    description: 'A forearm and brachioradialis focused curl.',
    muscleGroups: ['forearms', 'biceps'],
    equipment: ['barbell'],
    instructions: [
      'Stand holding barbell with overhand grip',
      'Curl bar up towards shoulders',
      'Lower with control',
      'Keep elbows stationary'
    ],
    tips: [
      'Use lighter weight than regular curls',
      'Great for forearm development'
    ],
    variations: ['Reverse EZ Bar Curl', 'Reverse Cable Curl']
  },
  {
    id: 'plate-loaded-row',
    name: 'Plate Loaded Wide Grip Row',
    description: 'A rowing machine emphasizing back width.',
    muscleGroups: ['back', 'biceps'],
    equipment: ['plate loaded row machine'],
    instructions: [
      'Sit at machine with chest against pad',
      'Grip wide handles',
      'Pull handles towards lower chest',
      'Return with control'
    ],
    tips: [
      'Squeeze shoulder blades together',
      'Don\'t use momentum'
    ],
    variations: ['Close Grip Row', 'Single Arm Row']
  },
  {
    id: 'smith-machine-squat',
    name: 'Smith Machine Squat',
    description: 'A squat performed on the Smith machine for stability.',
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
    equipment: ['smith machine'],
    instructions: [
      'Position bar on upper back under Smith machine',
      'Place feet slightly forward of the bar',
      'Unrack and squat down until thighs are parallel',
      'Drive through heels to stand'
    ],
    tips: [
      'Feet slightly forward helps with depth',
      'Keep core braced'
    ],
    variations: ['Smith Machine Front Squat']
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    description: 'A hamstring isolation exercise in seated position.',
    muscleGroups: ['hamstrings'],
    equipment: ['seated leg curl machine'],
    instructions: [
      'Sit with back against pad, legs extended',
      'Position pad above ankles',
      'Curl legs down and back',
      'Return with control'
    ],
    tips: [
      'Don\'t use momentum',
      'Focus on hamstring contraction'
    ],
    variations: ['Single Leg Seated Curl']
  },
  {
    id: 'cable-rear-delt-fly',
    name: 'Cable Rear Delt Fly',
    description: 'An isolation exercise for rear deltoids using cables.',
    muscleGroups: ['shoulders'],
    equipment: ['cable machine'],
    instructions: [
      'Set cables to shoulder height',
      'Cross arms and grab opposite cables',
      'Pull hands apart and back, squeezing rear delts',
      'Return with control'
    ],
    tips: [
      'Keep slight bend in elbows',
      'Focus on rear delt contraction'
    ],
    variations: ['Bent Over Cable Rear Delt Fly']
  }
];

export const getExerciseById = (id: string): Exercise | undefined => {
  return defaultExercises.find(e => e.id === id);
};

export const getExercisesByMuscleGroup = (muscleGroup: MuscleGroup): Exercise[] => {
  return defaultExercises.filter(e =>
    e.muscleGroups.includes(muscleGroup)
  );
};

export const getExercisesByEquipment = (equipment: string): Exercise[] => {
  return defaultExercises.filter(e =>
    e.equipment.some(eq => eq.toLowerCase().includes(equipment.toLowerCase()))
  );
};

export const searchExercises = (query: string): Exercise[] => {
  const lowerQuery = query.toLowerCase();
  return defaultExercises.filter(e =>
    e.name.toLowerCase().includes(lowerQuery) ||
    e.description.toLowerCase().includes(lowerQuery) ||
    e.muscleGroups.some(mg => mg.toLowerCase().includes(lowerQuery))
  );
};
