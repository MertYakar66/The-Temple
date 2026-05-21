// Jeff Nippard 5-6x PowerBuilding Phase 1
// Block-based training program — shares the BlockProgram data shape with the
// Min Max program (see ./minMaxProgram.ts).
//
// This program is prescribed with %1RM and RPE. To keep the same data shape as
// Min Max (which uses RIR), RPE is converted to RIR via RIR = 10 - RPE and
// stored in `rirS1` (a single value, so `rirS2` is always 'N/A'). The %1RM is
// stored in `lastSetIntensity` and shows as the exercise's intensity badge.
//
// The split alternates weekly: odd weeks run a 5-day Full Body split, even
// weeks run a 6-day Upper/Lower split. Week 6 is a semi-deload. Week 10 is a
// peak week left intentionally empty for now (to be filled in later).

import type { BlockProgram, BlockDay, BlockExercise } from './minMaxProgram';

// RPE → RIR. The program prescribes RPE; the app's block model uses RIR.
function rpeToRir(rpe: string): string {
  if (rpe === 'N/A') return 'N/A';
  const n = parseFloat(rpe);
  if (Number.isNaN(n)) return 'N/A';
  return String(10 - n);
}

// Coaching notes, keyed by exercise name. Per the source program, accessory
// notes do not change week to week, so a single name-keyed map mirrors the
// approach used in minMaxProgram.ts.
const exerciseNotes: Record<string, string> = {
  'Back Squat': 'Sit back and down, keeping your upper back tight against the bar. Keep your back angle and form consistent across every rep.',
  'Low-Bar Back Squat': 'Bar low across the rear delts, slightly more forward torso lean, and sit back into your hips.',
  'Barbell Bench Press': 'Set a comfortable arch with your shoulder blades retracted and depressed. Use a slight touch/pause on the chest and explode upward.',
  'Deadlift': 'Brace your lats, keep your chest tall, and pull the slack out of the bar before it breaks the floor.',
  'Pause Deadlift': 'Hold a 3-second pause right after the plates come off the ground.',
  'Pause Barbell Bench Press': 'Hold a 2-3 second pause on your chest for every rep.',
  'Squat Walk-out': 'Do not squat. Safely walk the weight out, hold for ~10 seconds with the safety pins set high and a spotter ready, then walk it back in.',
  'Sumo Box / Pause Squat': 'If you compete high-bar, do sumo box squats. If you squat low-bar, use a 2-second pause at the bottom of a high-bar squat.',
  'OHP / Push Press': 'Hybrid set: the first 3 reps are strict military press with no leg drive, then 3 push presses using your legs to drive the bar.',
  'Flat-Back Bench Press': 'Keep your shoulder blades retracted and depressed. Maintain only a slight upper-back arch and minimize leg drive.',
  'Barbell Floor Press': 'Control the descent so your elbows do not slam against the floor.',
  'Deficit Push-up': 'Build a deficit with push-up handles or dumbbells to lengthen your range of motion.',
  'Helms Row': 'Keep your form strict — drive your elbows out and back at a 45-degree angle.',
  'T-Bar / Pendlay Row': 'Be mindful of lower-back fatigue. Stay light and minimize cheating momentum.',
  'Chest-Supp. DB Row': 'Initiate and pull through your lats to isolate the movement.',
  'Single-Arm Row': 'Initiate and pull through your lats to isolate the movement.',
  'Single-Arm Lat Pull': 'Initiate and pull through your lats to isolate the movement.',
  'Weighted Pull-up': 'Use a 1.5x shoulder-width grip and pull your chest all the way to the bar.',
  'Chin-up': 'Pull your chest all the way to the bar with controlled reps.',
  'Eccentric Pull-up': 'Use a strict 3-second negative descent on every rep.',
  'Neutral Grip Pull-up': 'Pull your chest to the bar and control the descent.',
  'Glute Ham Raise': 'Keep your hips locked straight throughout the extension.',
  'Good Morning': 'Match your squat stance width, keep your shins vertical, and hinge backwards for a deep hamstring stretch.',
  'Bulgarian Split Squat': 'Keep your torso fully upright to keep constant tension on the quads.',
  'Standing Calf Raise': 'Pause 1-2 seconds at the bottom stretch to maximize range of motion.',
  'Seated Calf Raise': 'Pause 1-2 seconds at the bottom stretch to maximize range of motion.',
  'Incline DB Curl (21s)': 'Both arms at once: 7 full-ROM reps, 7 top-half reps, 7 bottom-half reps.',
  'Tricep Pressdown (21s)': 'Both arms at once: 7 full-ROM reps, 7 bottom-half reps, 7 top-half reps.',
  'Incline Dumbbell Curl': 'Work one arm at a time, starting with your weaker side.',
  'Hammer Curl': 'Freeze your elbows in place and squeeze the handles as hard as possible.',
  'DB Lateral Raise': 'Arc the dumbbell out and up to isolate the middle delt fibers.',
  'Lean-Away Lateral': 'Use light weight for constant tension — no pausing at the bottom.',
  'V Sit-up': 'Round your spine and compress your abs together rather than moving your neck.',
  'Bicycle Crunch': 'Round your spine and compress your abs together rather than moving your neck.',
  'Nordic Ham Curl': 'Can be substituted with a lying leg curl. See the video demos.',
  'Floor Skull Crusher': 'Arc the bar back behind your head with a soft touch on the floor.',
  'Barbell / EZ Bar Curl': 'Curl the bar out and up in an arc; minimize momentum.',
  'Dumbbell Shrug': 'Feel a stretch on the traps at the bottom and squeeze hard at the top.',
  'Band Pull-apart': 'Focus on a mind-muscle connection with your rear delts.',
};

// name, warm-up sets, working sets, reps, %1RM, RPE, rest.
function ex(
  name: string,
  warmup: number,
  sets: number,
  reps: string,
  percent: string,
  rpe: string,
  rest: string,
): BlockExercise {
  const exercise: BlockExercise = {
    name,
    lastSetIntensity: percent === 'N/A' ? 'N/A' : `${percent} 1RM`,
    warmup: String(warmup),
    sets,
    repRange: reps,
    rirS1: rpeToRir(rpe),
    rirS2: 'N/A',
    rest,
  };
  const note = exerciseNotes[name];
  if (note) exercise.note = note;
  return exercise;
}

function d(dayName: string, exercises: BlockExercise[]): BlockDay {
  return { dayName, exercises };
}

// Full Body 5 is the same arm & pump circuit on every odd week, except the
// Floor Skull Crusher rep target (12 on weeks 1/3/5/7, 10 on week 9).
function pumpDay(floorSkullReps: string): BlockDay {
  return d('Full Body 5', [
    ex('Barbell / EZ Bar Curl', 1, 3, '12', 'N/A', '8', '30 sec'),
    ex('Floor Skull Crusher', 1, 3, floorSkullReps, 'N/A', '8', '30 sec'),
    ex('Incline DB Curl (21s)', 0, 3, '21', 'N/A', '10', '30 sec'),
    ex('Tricep Pressdown (21s)', 0, 3, '21', 'N/A', '10', '30 sec'),
    ex('DB Lateral Raise', 0, 3, '20', 'N/A', '9', '30 sec'),
    ex('Band Pull-apart', 0, 3, '20', 'N/A', '9', '30 sec'),
    ex('Standing Calf Raise', 0, 3, '12', 'N/A', '9', '30 sec'),
    ex('Bicycle Crunch', 0, 3, '15', 'N/A', '9', '30 sec'),
    ex('Neck Flexion/Extension', 1, 3, '15/15', 'N/A', '8', '1-2 min'),
  ]);
}

// ============================================================
// Week 1 — Full Body
// ============================================================
const week1Days: BlockDay[] = [
  d('Full Body 1', [
    ex('Back Squat', 4, 1, '5', '75-80%', '7.5', '3-4 min'),
    ex('Back Squat', 0, 2, '8', '70%', 'N/A', '3-4 min'),
    ex('Overhead Press', 2, 3, '8', '70%', 'N/A', '2-3 min'),
    ex('Glute Ham Raise', 1, 3, '8-10', 'N/A', '7', '1-2 min'),
    ex('Helms Row', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Hammer Curl', 0, 3, '20-25', 'N/A', '10', '1-2 min'),
  ]),
  d('Full Body 2', [
    ex('Deadlift', 4, 3, '4', '80%', 'N/A', '3-5 min'),
    ex('Barbell Bench Press', 4, 1, '3', '82.5-87.5%', '8.5', '4-5 min'),
    ex('Barbell Bench Press', 0, 2, '10', '67.5%', 'N/A', '2-3 min'),
    ex('Hip Abduction', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('Weighted Pull-up', 1, 3, '5-8', 'N/A', '8', '3-4 min'),
    ex('Standing Calf Raise', 1, 3, '8-10', 'N/A', '9', '2-3 min'),
  ]),
  d('Full Body 3', [
    ex('Back Squat', 4, 3, '4', '80%', 'N/A', '3-4 min'),
    ex('Weighted Dip', 2, 3, '8', 'N/A', '8', '2-3 min'),
    ex('Hanging Leg Raise', 0, 3, '10-12', 'N/A', '9', '1-2 min'),
    ex('Lat Pull-over', 1, 3, '12-15', 'N/A', '8', '1-2 min'),
    ex('Incline Dumbbell Curl', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Face Pull', 0, 4, '15-20', 'N/A', '9', '1-2 min'),
  ]),
  d('Full Body 4', [
    ex('Pause Deadlift', 4, 4, '2', '75%', 'N/A', '3-4 min'),
    ex('Pause Barbell Bench Press', 3, 3, '5', '75%', 'N/A', '2-3 min'),
    ex('T-Bar / Pendlay Row', 1, 3, '10', 'N/A', '7', '2-3 min'),
    ex('Nordic Ham Curl', 0, 3, '6-8', 'N/A', '8', '1-2 min'),
    ex('Dumbbell Shrug', 0, 3, '20-25', 'N/A', '9', '1-2 min'),
  ]),
  pumpDay('12'),
];

// ============================================================
// Week 2 — Upper/Lower
// ============================================================
const week2Days: BlockDay[] = [
  d('Lower 1', [
    ex('Deadlift', 4, 3, '3', '80%', 'N/A', '3-4 min'),
    ex('Sumo Box / Pause Squat', 2, 2, '8', 'N/A', '7', '2-3 min'),
    ex('Pull-through', 0, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Leg Curl', 1, 3, '6-8', 'N/A', '8', '1-2 min'),
    ex('Standing Calf Raise', 1, 3, '8-10', 'N/A', '9', '1-2 min'),
  ]),
  d('Upper 1', [
    ex('Barbell Bench Press', 4, 1, '2', '85-90%', '8', '4-5 min'),
    ex('Barbell Bench Press', 0, 3, '6', '77.5%', 'N/A', '2-3 min'),
    ex('Chin-up', 1, 3, '8-10', 'N/A', '8', '2-3 min'),
    ex('Arnold DB Press', 1, 2, '10-12', 'N/A', '9', '1-2 min'),
    ex('Chest-Supp. DB Row', 1, 2, '12-15', 'N/A', '9', '1-2 min'),
    ex('Face Pull', 0, 2, '15-20', 'N/A', '9', '1-2 min'),
    ex('DB Lateral Raise', 0, 2, '15-20', 'N/A', '10', '1-2 min'),
    ex('Concentration Curl', 0, 3, '12-15', 'N/A', '9', '1-2 min'),
  ]),
  d('Lower 2', [
    ex('Back Squat', 4, 3, '6', '75%', 'N/A', '3-4 min'),
    ex('Good Morning', 2, 2, '10-12', 'N/A', '7', '2-3 min'),
    ex('Leg Extension', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Standing Calf Raise', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('Lateral Walk / Abduction', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('V Sit-up', 0, 3, '12-15', 'N/A', '9', '1-2 min'),
  ]),
  d('Upper 2', [
    ex('Overhead Press', 3, 3, '4', '80%', 'N/A', '3-4 min'),
    ex('Single-Arm Lat Pull', 1, 2, '10-12', 'N/A', '9', '2-3 min'),
    ex('Close-Grip Bench', 2, 2, '12', 'N/A', '7', '2-3 min'),
    ex('Pendlay Row', 1, 2, '10', 'N/A', '7', '1-2 min'),
    ex('Pec Flye', 0, 2, '15-20', 'N/A', '9', '1-2 min'),
    ex('Incline Shrug', 1, 2, '15-20', 'N/A', '9', '30 sec'),
    ex('Upright Row', 1, 2, '15-20', 'N/A', '9', '30 sec'),
    ex('Barbell Skull Crusher', 1, 2, '8-10', 'N/A', '8', '1-2 min'),
  ]),
  d('Lower 3', [
    ex('5" Block Pull', 4, 2, '4', 'N/A', '8', '4-5 min'),
    ex('Bulgarian Split Squat', 1, 2, '12', 'N/A', '7', '2-3 min'),
    ex('Hyper / Hip Thrust', 1, 2, '8-10', 'N/A', '7', '1-2 min'),
    ex('Seated Calf Raise', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('Hanging Leg Raise', 0, 3, '10-12', 'N/A', '8', '1-2 min'),
    ex('Neck Flexion/Extension', 1, 3, '12/12', 'N/A', '8', '1-2 min'),
  ]),
  d('Upper 3', [
    ex('Flat-Back Bench Press', 3, 3, '10', 'N/A', '7', '2-3 min'),
    ex('Eccentric Pull-up', 1, 2, 'AMRAP', 'N/A', '10', '2-3 min'),
    ex('Weighted Dip', 2, 2, '10', 'N/A', '8', '2-3 min'),
    ex('Single-Arm Row', 1, 2, '10-12', 'N/A', '9', '2-3 min'),
    ex('Barbell / EZ Bar Curl', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Lean-Away Lateral', 0, 2, '30', 'N/A', '10', '1-2 min'),
    ex('Bicycle Crunch', 0, 2, '10-12', 'N/A', '9', '1-2 min'),
  ]),
];

// ============================================================
// Week 3 — Full Body
// ============================================================
const week3Days: BlockDay[] = [
  d('Full Body 1', [
    ex('Back Squat', 4, 1, '8', '72.5-77.5%', '8.5', '4-5 min'),
    ex('Back Squat', 0, 2, '6', '75%', 'N/A', '3-4 min'),
    ex('Overhead Press', 2, 3, '8', '72.5%', 'N/A', '2-3 min'),
    ex('Glute Ham Raise', 1, 2, '8-10', 'N/A', '7', '1-2 min'),
    ex('Helms Row', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Hammer Curl', 0, 3, '20-25', 'N/A', '10', '1-2 min'),
  ]),
  d('Full Body 2', [
    ex('Deadlift', 4, 4, '2', '85%', 'N/A', '3-5 min'),
    ex('Barbell Bench Press', 3, 1, '6', '75-80%', '8.5', '4-5 min'),
    ex('Barbell Bench Press', 0, 2, '8', '72.5%', 'N/A', '2-3 min'),
    ex('Hip Abduction', 0, 2, '15-20', 'N/A', '9', '1-2 min'),
    ex('Weighted Pull-up', 1, 3, '5-8', 'N/A', '8', '3-4 min'),
    ex('Standing Calf Raise', 1, 3, '8', 'N/A', '9', '2-3 min'),
  ]),
  d('Full Body 3', [
    ex('Back Squat', 4, 4, '4', '80%', 'N/A', '3-4 min'),
    ex('Weighted Dip', 2, 3, '8', 'N/A', '8', '2-3 min'),
    ex('Hanging Leg Raise', 0, 3, '10-12', 'N/A', '9', '1-2 min'),
    ex('Lat Pull-over', 1, 3, '12-15', 'N/A', '8', '1-2 min'),
    ex('Incline Dumbbell Curl', 1, 2, '12-15', 'N/A', '9', '1-2 min'),
    ex('Face Pull', 0, 4, '15-20', 'N/A', '9', '1-2 min'),
  ]),
  d('Full Body 4', [
    ex('Pause Deadlift', 4, 4, '2', '77.5%', 'N/A', '3-4 min'),
    ex('Pause Barbell Bench Press', 3, 4, '5', '75%', 'N/A', '2-3 min'),
    ex('T-Bar / Pendlay Row', 1, 3, '10', 'N/A', '7', '2-3 min'),
    ex('Nordic Ham Curl', 0, 2, '6-8', 'N/A', '8', '1-2 min'),
    ex('Dumbbell Shrug', 0, 3, '20-25', 'N/A', '9', '1-2 min'),
  ]),
  pumpDay('12'),
];

// ============================================================
// Week 4 — Upper/Lower
// ============================================================
const week4Days: BlockDay[] = [
  d('Lower 1', [
    ex('Deadlift', 4, 1, '2', '87.5-92.5%', '9', '4-5 min'),
    ex('Deadlift', 0, 3, '3', '80%', 'N/A', '3-4 min'),
    ex('Sumo Box / Pause Squat', 2, 2, '8', 'N/A', '7', '2-3 min'),
    ex('Pull-through', 0, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Leg Curl', 1, 3, '6-8', 'N/A', '8', '1-2 min'),
    ex('Standing Calf Raise', 1, 3, '8-10', 'N/A', '9', '1-2 min'),
  ]),
  d('Upper 1', [
    ex('Barbell Bench Press', 3, 3, '6', '77.5%', 'N/A', '3-4 min'),
    ex('Chin-up', 1, 3, '8-10', 'N/A', '8', '2-3 min'),
    ex('Arnold DB Press', 1, 2, '10-12', 'N/A', '9', '2-3 min'),
    ex('Chest-Supp. DB Row', 1, 2, '12-15', 'N/A', '9', '1-2 min'),
    ex('Face Pull', 0, 2, '15-20', 'N/A', '9', '1-2 min'),
    ex('DB Lateral Raise', 0, 2, '15-20', 'N/A', '10', '1-2 min'),
    ex('Concentration Curl', 0, 3, '12-15', 'N/A', '9', '1-2 min'),
  ]),
  d('Lower 2', [
    ex('Back Squat', 4, 3, '6', '75%', 'N/A', '3-4 min'),
    ex('Good Morning', 2, 2, '10-12', 'N/A', '7', '2-3 min'),
    ex('Leg Extension', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Standing Calf Raise', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('Lateral Walk / Abduction', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('V Sit-up', 0, 3, '12-15', 'N/A', '9', '1-2 min'),
  ]),
  d('Upper 2', [
    ex('OHP / Push Press', 3, 3, '3/3', '80%', 'N/A', '3-4 min'),
    ex('Single-Arm Lat Pull', 1, 2, '10-12', 'N/A', '9', '2-3 min'),
    ex('Barbell Floor Press', 2, 2, '12', 'N/A', '7', '1-2 min'),
    ex('Pendlay Row', 1, 2, '10', 'N/A', '7', '1-2 min'),
    ex('Pec Flye', 0, 2, '15-20', 'N/A', '9', '1-2 min'),
    ex('Incline Shrug', 1, 2, '15-20', 'N/A', '9', '30 sec'),
    ex('Bent Over Rev. Flye', 1, 2, '15-20', 'N/A', '9', '30 sec'),
    ex('Barbell Skull Crusher', 1, 2, '8-10', 'N/A', '8', '1-2 min'),
  ]),
  d('Lower 3', [
    ex('4" Block Pull', 4, 2, '4', 'N/A', '8', '4-5 min'),
    ex('Bulgarian Split Squat', 1, 2, '12', 'N/A', '7', '2-3 min'),
    ex('Hyper / Hip Thrust', 1, 2, '8-10', 'N/A', '7', '1-2 min'),
    ex('Seated Calf Raise', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('Hanging Leg Raise', 0, 3, '10-12', 'N/A', '8', '1-2 min'),
    ex('Neck Flexion/Extension', 1, 3, '12/12', 'N/A', '8', '1-2 min'),
  ]),
  d('Upper 3', [
    ex('Flat-Back Bench Press', 3, 3, '10', 'N/A', '7', '2-3 min'),
    ex('Eccentric Pull-up', 1, 2, 'AMRAP', 'N/A', '10', '2-3 min'),
    ex('Weighted Dip', 2, 2, '10', 'N/A', '8', '2-3 min'),
    ex('Single-Arm Row', 1, 2, '10-12', 'N/A', '9', '1-2 min'),
    ex('Barbell / EZ Bar Curl', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Lean-Away Lateral', 0, 2, '30', 'N/A', '10', '1-2 min'),
    ex('Bicycle Crunch', 0, 2, '10-12', 'N/A', '9', '1-2 min'),
  ]),
];

// ============================================================
// Week 5 — Full Body
// ============================================================
const week5Days: BlockDay[] = [
  d('Full Body 1', [
    ex('Back Squat', 4, 1, '3', '82.5-87.5%', '8.5', '4-5 min'),
    ex('Back Squat', 0, 2, '4', '80%', 'N/A', '3-4 min'),
    ex('Overhead Press', 2, 3, '8', '75%', 'N/A', '2-3 min'),
    ex('Glute Ham Raise', 1, 2, '8-10', 'N/A', '8', '1-2 min'),
    ex('Helms Row', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Hammer Curl', 0, 3, '20-25', 'N/A', '10', '1-2 min'),
  ]),
  d('Full Body 2', [
    ex('Deadlift', 4, 3, '3', '85%', 'N/A', '3-5 min'),
    ex('Barbell Bench Press', 4, 1, '4', '82.5-87.5%', '9', '4-5 min'),
    ex('Barbell Bench Press', 0, 2, '6', '80%', 'N/A', '2-3 min'),
    ex('Hip Abduction', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('Weighted Pull-up', 1, 3, '5-8', 'N/A', '8', '3-4 min'),
    ex('Standing Calf Raise', 1, 3, '8', 'N/A', '9', '2-3 min'),
  ]),
  d('Full Body 3', [
    ex('Back Squat', 4, 3, '6', '77.5%', 'N/A', '3-4 min'),
    ex('Weighted Dip', 2, 3, '8', 'N/A', '8', '2-3 min'),
    ex('Hanging Leg Raise', 0, 3, '10-12', 'N/A', '9', '1-2 min'),
    ex('Lat Pull-over', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Incline Dumbbell Curl', 1, 2, '12-15', 'N/A', '9', '1-2 min'),
    ex('Face Pull', 0, 4, '15-20', 'N/A', '9', '1-2 min'),
  ]),
  d('Full Body 4', [
    ex('Pause Deadlift', 4, 4, '2', '82.5%', 'N/A', '3-4 min'),
    ex('Pause Barbell Bench Press', 3, 3, '6', '75%', 'N/A', '2-3 min'),
    ex('T-Bar / Pendlay Row', 1, 3, '10', 'N/A', '7', '2-3 min'),
    ex('Nordic Ham Curl', 0, 3, '6-8', 'N/A', '8', '1-2 min'),
    ex('Dumbbell Shrug', 0, 3, '20-25', 'N/A', '10', '1-2 min'),
  ]),
  pumpDay('12'),
];

// ============================================================
// Week 6 — Upper/Lower (Semi-Deload)
// ============================================================
const week6Days: BlockDay[] = [
  d('Lower 1', [
    ex('Deadlift', 4, 3, '4', '80%', 'N/A', '3-4 min'),
    ex('Sumo Box / Pause Squat', 2, 2, '8', 'N/A', '5', '2-3 min'),
    ex('Pull-through', 0, 2, '12-15', 'N/A', '7', '1-2 min'),
    ex('Leg Curl', 1, 3, '6-8', 'N/A', '1', '1-2 min'),
    ex('Standing Calf Raise', 1, 2, '8-10', 'N/A', '8', '1-2 min'),
  ]),
  d('Upper 1', [
    ex('Barbell Bench Press', 3, 2, '7', '77.5%', 'N/A', '3-4 min'),
    ex('Chin-up', 1, 2, '8-10', 'N/A', '6', '2-3 min'),
    ex('Arnold DB Press', 1, 2, '10-12', 'N/A', '6', '2-3 min'),
    ex('Chest-Supp. DB Row', 1, 2, '12-15', 'N/A', '6', '1-2 min'),
    ex('Face Pull', 0, 2, '15-20', 'N/A', '8', '1-2 min'),
    ex('DB Lateral Raise', 0, 2, '15-20', 'N/A', '8', '1-2 min'),
    ex('Concentration Curl', 0, 3, '12-15', 'N/A', '8', '1-2 min'),
  ]),
  d('Lower 2', [
    ex('Back Squat', 4, 1, '1', '90-95%', '9', '4-5 min'),
    ex('Low-Bar Back Squat', 0, 2, '7', '75%', 'N/A', '3-4 min'),
    ex('Leg Extension', 1, 3, '12-15', 'N/A', '8', '1-2 min'),
    ex('Standing Calf Raise', 0, 3, '15-20', 'N/A', '8', '1-2 min'),
    ex('Lateral Walk / Abduction', 0, 3, '15-20', 'N/A', '8', '1-2 min'),
    ex('V Sit-up', 0, 3, '12-15', 'N/A', '8', '1-2 min'),
  ]),
  d('Upper 2', [
    ex('Overhead Press', 3, 3, '4', '82.5%', 'N/A', '3-4 min'),
    ex('Single-Arm Lat Pull', 1, 2, '10-12', 'N/A', '7', '2-3 min'),
    ex('Deficit Push-up', 2, 2, 'AMRAP', 'N/A', '10', '2-3 min'),
    ex('Pendlay Row', 1, 2, '10', 'N/A', '7', '1-2 min'),
    ex('Pec Flye', 0, 2, '15-20', 'N/A', '7', '1-2 min'),
    ex('Incline Shrug', 1, 2, '15-20', 'N/A', '7', '30 sec'),
    ex('Upright Row', 1, 2, '15-20', 'N/A', '7', '30 sec'),
    ex('Barbell Skull Crusher', 1, 2, '8-10', 'N/A', '7', '1-2 min'),
  ]),
  d('Lower 3', [
    ex('3" Block Pull', 4, 2, '4', 'N/A', '6', '4-5 min'),
    ex('Bulgarian Split Squat', 1, 2, '12', 'N/A', '6', '2-3 min'),
    ex('Hyper / Hip Thrust', 1, 2, '8-10', 'N/A', '6', '1-2 min'),
    ex('Seated Calf Raise', 0, 3, '15-20', 'N/A', '8', '1-2 min'),
    ex('Hanging Leg Raise', 0, 3, '10-12', 'N/A', '8', '1-2 min'),
    ex('Neck Flexion/Extension', 1, 3, '12/12', 'N/A', '8', '1-2 min'),
  ]),
  d('Upper 3', [
    ex('Flat-Back Bench Press', 3, 3, '10', 'N/A', '7', '2-3 min'),
    ex('Neutral Grip Pull-up', 1, 2, '10', 'N/A', '7', '2-3 min'),
    ex('Weighted Dip', 2, 2, '10', 'N/A', '7', '2-3 min'),
    ex('Single-Arm Row', 1, 2, '10-12', 'N/A', '7', '1-2 min'),
    ex('Barbell / EZ Bar Curl', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Lean-Away Lateral', 0, 2, '30', 'N/A', '9', '1-2 min'),
    ex('Bicycle Crunch', 0, 2, '10-12', 'N/A', '8', '1-2 min'),
  ]),
];

// ============================================================
// Week 7 — Full Body
// ============================================================
const week7Days: BlockDay[] = [
  d('Full Body 1', [
    ex('Back Squat', 4, 1, '3', '85-90%', '8.5', '4-5 min'),
    ex('Back Squat', 0, 2, '2', '85%', 'N/A', '3-4 min'),
    ex('Overhead Press', 2, 4, '8', '70%', 'N/A', '2-3 min'),
    ex('Glute Ham Raise', 1, 2, '8-10', 'N/A', '8', '1-2 min'),
    ex('Helms Row', 1, 2, '12-15', 'N/A', '9', '1-2 min'),
    ex('Hammer Curl', 0, 3, '20-25', 'N/A', '10', '1-2 min'),
  ]),
  d('Full Body 2', [
    ex('Pause Deadlift', 4, 4, '2', '75%', 'N/A', '3-5 min'),
    ex('Barbell Bench Press', 4, 1, '3', '85-90%', '9', '4-5 min'),
    ex('Barbell Bench Press', 0, 2, '4', '80%', 'N/A', '2-3 min'),
    ex('Hip Abduction', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('Weighted Pull-up', 1, 3, '3-5', 'N/A', '7', '3-4 min'),
    ex('Standing Calf Raise', 1, 3, '8', 'N/A', '9', '2-3 min'),
  ]),
  d('Full Body 3', [
    ex('Back Squat', 4, 4, '6', '77.5%', 'N/A', '3-4 min'),
    ex('Weighted Dip', 2, 3, '8', 'N/A', '8', '2-3 min'),
    ex('Hanging Leg Raise', 0, 3, '10-12', 'N/A', '9', '1-2 min'),
    ex('Lat Pull-over', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Incline Dumbbell Curl', 1, 2, '12-15', 'N/A', '9', '1-2 min'),
    ex('Face Pull', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
  ]),
  d('Full Body 4', [
    ex('Deadlift', 4, 1, '3', '85-90%', '8.5', '4-5 min'),
    ex('Pause Barbell Bench Press', 3, 4, '6', '75%', 'N/A', '2-3 min'),
    ex('T-Bar / Pendlay Row', 1, 3, '10', 'N/A', '7', '2-3 min'),
    ex('Nordic Ham Curl', 0, 3, '6-8', 'N/A', '8', '1-2 min'),
    ex('Dumbbell Shrug', 0, 3, '20-25', 'N/A', '9', '1-2 min'),
  ]),
  pumpDay('12'),
];

// ============================================================
// Week 8 — Upper/Lower
// ============================================================
const week8Days: BlockDay[] = [
  d('Lower 1', [
    ex('Deadlift', 4, 3, '5', '80%', 'N/A', '3-4 min'),
    ex('Sumo Box / Pause Squat', 2, 2, '8', 'N/A', '7', '2-3 min'),
    ex('Pull-through', 0, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Leg Curl', 1, 3, '6-8', 'N/A', '9', '1-2 min'),
    ex('Standing Calf Raise', 1, 3, '8-10', 'N/A', '9', '1-2 min'),
  ]),
  d('Upper 1', [
    ex('Barbell Bench Press', 3, 2, '7', '77.5%', 'N/A', '3-4 min'),
    ex('Chin-up', 1, 3, '8-10', 'N/A', '8', '2-3 min'),
    ex('Arnold DB Press', 1, 2, '10-12', 'N/A', '9', '2-3 min'),
    ex('Chest-Supp. DB Row', 1, 2, '12-15', 'N/A', '9', '1-2 min'),
    ex('Face Pull', 0, 2, '15-20', 'N/A', '10', '1-2 min'),
    ex('DB Lateral Raise', 0, 3, '15-20', 'N/A', '10', '1-2 min'),
    ex('Concentration Curl', 0, 3, '12-15', 'N/A', '10', '1-2 min'),
  ]),
  d('Lower 2', [
    ex('Low-Bar Back Squat', 4, 3, '7', '75%', 'N/A', '3-4 min'),
    ex('Good Morning', 2, 2, '10-12', 'N/A', '7', '2-3 min'),
    ex('Leg Extension', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Standing Calf Raise', 0, 3, '15-20', 'N/A', '10', '1-2 min'),
    ex('Lateral Walk / Abduction', 0, 3, '15-20', 'N/A', '10', '1-2 min'),
    ex('V Sit-up', 0, 3, '12-15', 'N/A', '10', '1-2 min'),
  ]),
  d('Upper 2', [
    ex('OHP / Push Press', 3, 3, '3/3', '82.5%', 'N/A', '3-4 min'),
    ex('Single-Arm Lat Pull', 1, 2, '10-12', 'N/A', '9', '2-3 min'),
    ex('DB Incline Press', 2, 2, '12', 'N/A', '8', '2-3 min'),
    ex('Pendlay Row', 1, 2, '10', 'N/A', '7', '1-2 min'),
    ex('Pec Flye', 0, 3, '15-20', 'N/A', '10', '1-2 min'),
    ex('Incline Shrug', 1, 2, '15-20', 'N/A', '10', '30 sec'),
    ex('Bent Over Rev. Flye', 1, 2, '15-20', 'N/A', '10', '30 sec'),
    ex('Barbell Skull Crusher', 1, 2, '8-10', 'N/A', '10', '1-2 min'),
  ]),
  d('Lower 3', [
    ex('2" Block Pull', 4, 2, '4', 'N/A', '8', '4-5 min'),
    ex('Bulgarian Split Squat', 1, 2, '12', 'N/A', '7', '2-3 min'),
    ex('Hyper / Hip Thrust', 1, 2, '8-10', 'N/A', '7', '1-2 min'),
    ex('Seated Calf Raise', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('Hanging Leg Raise', 0, 3, '10-12', 'N/A', '8', '1-2 min'),
    ex('Neck Flexion/Extension', 1, 3, '12/12', 'N/A', '8', '1-2 min'),
  ]),
  d('Upper 3', [
    ex('Flat-Back Bench Press', 3, 3, '10', 'N/A', '7', '2-3 min'),
    ex('Eccentric Pull-up', 1, 2, 'AMRAP', 'N/A', '10', '2-3 min'),
    ex('Weighted Dip', 2, 2, '10', 'N/A', '8', '2-3 min'),
    ex('Single-Arm Row', 1, 2, '10-12', 'N/A', '9', '1-2 min'),
    ex('Barbell / EZ Bar Curl', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Lean-Away Lateral', 0, 2, '30', 'N/A', '10', '1-2 min'),
    ex('Bicycle Crunch', 0, 2, '10-12', 'N/A', '9', '1-2 min'),
  ]),
];

// ============================================================
// Week 9 — Full Body
// ============================================================
const week9Days: BlockDay[] = [
  d('Full Body 1', [
    ex('Back Squat', 4, 1, '2', '87.5-92.5%', '8.5', '4-5 min'),
    ex('Squat Walk-out', 0, 1, '10s', '100%', 'N/A', '4-5 min'),
    ex('Overhead Press', 2, 3, '6', '80%', 'N/A', '2-3 min'),
    ex('Glute Ham Raise', 1, 2, '8-10', 'N/A', '7', '1-2 min'),
    ex('Helms Row', 1, 2, '12-15', 'N/A', '9', '1-2 min'),
    ex('Hammer Curl', 0, 3, '20-25', 'N/A', '10', '1-2 min'),
  ]),
  d('Full Body 2', [
    ex('Deadlift', 4, 3, '4', '80%', 'N/A', '3-5 min'),
    ex('Barbell Bench Press', 4, 1, '2', '87.5-92.5%', '9', '4-5 min'),
    ex('Barbell Bench Press', 0, 2, '2', '87.5%', 'N/A', '2-3 min'),
    ex('Hip Abduction', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
    ex('Weighted Pull-up', 1, 3, '3-5', 'N/A', '7', '3-4 min'),
    ex('Standing Calf Raise', 1, 3, '8', 'N/A', '9', '2-3 min'),
  ]),
  d('Full Body 3', [
    ex('Back Squat', 4, 3, '4', '82.5%', 'N/A', '3-4 min'),
    ex('Weighted Dip', 2, 3, '8', 'N/A', '8', '2-3 min'),
    ex('Hanging Leg Raise', 0, 3, '10-12', 'N/A', '9', '1-2 min'),
    ex('Lat Pull-over', 1, 3, '12-15', 'N/A', '9', '1-2 min'),
    ex('Incline Dumbbell Curl', 1, 2, '12-15', 'N/A', '9', '1-2 min'),
    ex('Face Pull', 0, 3, '15-20', 'N/A', '9', '1-2 min'),
  ]),
  d('Full Body 4', [
    ex('Pause Deadlift', 4, 4, '2', '75%', 'N/A', '3-4 min'),
    ex('Pause Barbell Bench Press', 3, 3, '5', '77.5%', 'N/A', '2-3 min'),
    ex('T-Bar / Pendlay Row', 1, 3, '10', 'N/A', '7', '2-3 min'),
    ex('Nordic Ham Curl', 0, 3, '6-8', 'N/A', '8', '1-2 min'),
    ex('Dumbbell Shrug', 0, 3, '20-25', 'N/A', '9', '1-2 min'),
  ]),
  pumpDay('10'),
];

export const powerbuildingProgram: BlockProgram = {
  id: 'powerbuilding',
  name: 'Jeff Nippard 5-6x PowerBuilding Phase 1',
  frequency: '5-6x Per Week',
  programNotes: [
    'This program is prescribed with RPE (Rate of Perceived Exertion). RPE is shown here converted to RIR — RIR = 10 - RPE — so an RPE 8 set appears as RIR 2. An RIR of "N/A" means the set is governed by the listed %1RM instead.',
    'Main lifts are driven by %1RM (a percentage of your one-rep max), shown as the intensity badge on the exercise. Accessory work is governed by RPE/RIR.',
    'The split alternates every week: odd weeks (1, 3, 5, 7, 9) run a 5-day Full Body split; even weeks (2, 4, 6, 8) run a 6-day Upper/Lower split.',
    'Week 6 is a semi-deload — intensity and effort are intentionally pulled back to manage fatigue before the second half of the program.',
    'Week 10 is the peak week and has not been added yet.',
  ],
  warmupProtocol: 'Begin each session with about 5 minutes of light cardio to raise your core body temperature. Each exercise lists its recommended number of warm-up sets — keep them light and non-fatiguing as you build up to your first working set.',
  blocks: [
    {
      blockNumber: 1,
      blockName: 'Phase 1',
      weeks: [
        { weekNumber: 1, label: 'Week 1', days: week1Days },
        { weekNumber: 2, label: 'Week 2', days: week2Days },
        { weekNumber: 3, label: 'Week 3', days: week3Days },
        { weekNumber: 4, label: 'Week 4', days: week4Days },
        { weekNumber: 5, label: 'Week 5', days: week5Days },
        { weekNumber: 6, label: 'Semi-Deload', days: week6Days },
        { weekNumber: 7, label: 'Week 7', days: week7Days },
        { weekNumber: 8, label: 'Week 8', days: week8Days },
        { weekNumber: 9, label: 'Week 9', days: week9Days },
        { weekNumber: 10, label: 'Peak Week', days: [] },
      ],
    },
  ],
};
