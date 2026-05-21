// Jeff Nippard Min Max Program (5x Per Week)
// Block-based training program

export interface BlockExercise {
  name: string;
  lastSetIntensity: string;
  warmup: string;
  sets: number;
  repRange: string;
  rirS1: string;
  rirS2: string;
  rest: string;
  substitutions?: { sub1?: string; sub2?: string };
  note?: string;
}

export interface BlockDay {
  dayName: string;
  exercises: BlockExercise[];
}

export interface BlockWeek {
  weekNumber: number;
  label: string;
  days: BlockDay[];
}

export interface Block {
  blockNumber: number;
  blockName: string;
  weeks: BlockWeek[];
}

// Shared shape for all hardcoded block programs (Min Max, PowerBuilding, ...).
export interface BlockProgram {
  id: string;
  name: string;
  frequency: string;
  programNotes: string[];
  warmupProtocol: string;
  blocks: Block[];
}

// Substitution & note maps (shared across weeks since they're the same)
const exerciseNotes: Record<string, { sub1?: string; sub2?: string; note?: string }> = {
  'Barbell Incline Press': {
    sub1: 'Smith Machine Incline Press',
    sub2: 'DB Incline Press',
    note: 'A 30° or 45° bench will work here. Pause for 1 second at the bottom of each rep while maintaining tension on the pecs.',
  },
  'Pec Deck': {
    sub1: 'DB Flye',
    sub2: 'Cable Flye',
    note: 'Pause for 1 second at the bottom of each rep while maintaining tension on the pecs.',
  },
  'Incline DB Y-Raise': {
    sub1: 'Cable Y-Raise',
    sub2: 'Machine Lateral Raise',
    note: 'Use a 30° incline bench (back against the bench) and lift the weight up and out in a Y shape.',
  },
  'Pull-Up (Wide Grip)': {
    sub1: 'Lat Pulldown (Wide Grip)',
    sub2: '1-Arm Cable Pulldown',
    note: 'Control the negative and feel your lats pulling apart. Full ROM!',
  },
  'Kelso Shrug': {
    sub1: 'Seated Cable Kelso Shrug',
    sub2: 'Incline DB Kelso Shrug',
    note: 'Pause for about 1 second at the top and then allow your shoulder blades to peel apart on the way back down, under control.',
  },
  'EZ-Bar Preacher Curl': {
    sub1: 'Machine Preacher Curl',
    sub2: 'DB Preacher Curl',
    note: 'Keep your triceps firmly pinned against the pad as you curl. Smooth controlled reps.',
  },
  'Triceps Pressdown': {
    sub1: 'Close-Grip Bench Press',
    sub2: 'Smith Machine JM Press',
    note: 'You can use a rope or bar attachment for these, whichever you find more comfortable.',
  },
  'Dragon Flag': {
    sub1: 'Bent-Knee Dragon Flag',
    sub2: 'Lying Leg Raise',
    note: 'Keep your body as rigid as possible throughout the ROM.',
  },
  'Lying Leg Curl': {
    sub1: 'Seated Leg Curl',
    sub2: 'Nordic Ham Curl',
    note: 'Set the machine so that you get the biggest stretch possible at the bottom. Prevent your butt from popping up as you curl.',
  },
  'Squat (Your Choice)': {
    note: 'This can be a Barbell Back Squat, Barbell Front Squat, Pendulum Squat, Hack Squat, Belt Squat, or Smith Machine Squat.',
  },
  'Smith Machine Lunge': {
    sub1: 'DB Lunge',
    sub2: 'Barbell Lunge',
    note: 'Minimize contribution from your back leg!',
  },
  'Leg Extension': {
    sub1: 'Reverse Nordic',
    sub2: 'Sissy Squat',
    note: 'Set the seat back as far as it will go while still feeling comfortable. Grab the handles as hard as you can to pull your butt down into the seat (using straps can help here).',
  },
  'Machine Hip Abduction': {
    sub1: 'Cable Hip Abduction',
    sub2: 'Standing Plate Abduction',
    note: 'If possible, place foam pads in between the outside of your knees and the pads on the machine. This will increase your range of motion on the machine.',
  },
  'Standing Calf Raise': {
    sub1: 'Leg Press Calf Press',
    sub2: 'Donkey Calf Raise',
    note: '1-2 second pause at the bottom of each rep. Instead of just going up onto your toes, think about rolling your ankle back and forth on the balls of your feet.',
  },
  'Close-Grip Lat Pulldown': {
    sub1: 'Close-Grip Pull-Up',
    sub2: '1-Arm Cable Pulldown',
    note: 'Lean back by ~15° and drive your elbows down as you squeeze your shoulder blades together. This should feel like a mix of lats and mid-traps.',
  },
  'Chest-Supported T-Bar Row': {
    sub1: 'Chest-Supported Machine Row',
    sub2: 'Chest-Supported DB Row',
    note: 'Flare elbows out at roughly 45° and squeeze your shoulder blades together hard at the top of each rep.',
  },
  'Machine Shrug': {
    sub1: 'Barbell Shrug',
    sub2: 'Cable Shrug-In',
    note: 'Think about shrugging "up to your ears". Use straps, if possible.',
  },
  'Machine Chest Press': {
    sub1: 'Smith Machine Bench Press',
    sub2: 'DB Bench Press',
    note: '1 second pause at the bottom of each rep while maintaining tension on the pecs.',
  },
  'High-Cable Lateral Raise': {
    sub1: 'DB Lateral Raise',
    sub2: 'Machine Lateral Raise',
    note: 'Set the cable at roughly hip height. Let your hand go slightly past your midline at the bottom of each rep to get a deep stretch on the side delt.',
  },
  '1-Arm Reverse Pec Deck': {
    sub1: 'Lying Reverse DB Flye',
    sub2: 'Reverse Cable Crossover',
    note: 'Sweep the weight out to create the largest semi-circle possible with your arm.',
  },
  'Cable Crunch': {
    sub1: 'Weighted Crunch',
    sub2: 'Machine Crunch',
    note: 'Round your lower back as you crunch. Maintain a mind-muscle connection with your 6-pack.',
  },
  'Barbell RDL': {
    sub1: 'DB RDL',
    sub2: 'Seated Cable Deadlift',
    note: 'Stick your glutes straight back as you lower the bar straight down, centered over the middle of your foot. Get a nice deep stretch at the bottom, but keep your spine neutral (don\'t round forward).',
  },
  'Machine Hip Thrust': {
    sub1: 'Barbell Hip Thrust',
    sub2: '45° Hyperextension',
    note: 'Squeeze your glutes hard at the top and control the weight on the way down.',
  },
  'Leg Press': {
    sub1: 'Smith Machine Squat',
    sub2: 'Barbell Squat',
    note: 'Feet lower on the platform for more quad focus. Get as deep as you can without excessive back rounding.',
  },
  'Bayesian Cable Curl': {
    sub1: 'Incline DB Curl',
    sub2: 'Standing DB Curl',
    note: 'As you curl, optionally lean forward to prevent the cable from hitting your wrist at the top. Control the negative and feel a deep stretch at the bottom of each rep.',
  },
  'Overhead Cable Triceps Extension': {
    sub1: 'Overhead DB Triceps Extension',
    sub2: 'Skull Crusher',
    note: 'Feel a deep stretch on the triceps throughout the entire negative.',
  },
  'Modified Zottman Curl': {
    sub1: 'DB Hammer Curl',
    sub2: 'Preacher Hammer Curl',
    note: 'Hammer curl on the way up and supinated curl (palms up) on the way down.',
  },
  'Cable Triceps Kickback': {
    sub1: 'Seated Dip Machine',
    sub2: 'Close-Grip Dip',
    note: 'Keep your upper arm behind your torso throughout the ROM.',
  },
  'DB Wrist Curl': {
    sub1: 'Cable Wrist Curl',
    note: 'Smooth, controlled reps.',
  },
  'DB Wrist Extension': {
    sub1: 'Cable Wrist Extension',
    note: 'Smooth, controlled reps.',
  },
  'Alternating DB Curl': {
    sub1: 'Barbell Curl',
    sub2: 'EZ-Bar Curl',
    note: 'Slow, controlled reps!',
  },
  'Machine Lateral Raise': {
    sub1: 'High-Cable Lateral Raise',
    sub2: 'DB Lateral Raise',
    note: 'Focus on squeezing your side delt to move the weight.',
  },
  'Dead Hang (optional)': {
    note: 'Try to add a few more seconds each week!',
  },
};

function ex(
  name: string,
  lastSetIntensity: string,
  warmup: string,
  sets: number,
  repRange: string,
  rirS1: string,
  rirS2: string,
  rest: string,
): BlockExercise {
  const info = exerciseNotes[name];
  return {
    name,
    lastSetIntensity,
    warmup,
    sets,
    repRange,
    rirS1,
    rirS2,
    rest,
    substitutions: info ? { sub1: info.sub1, sub2: info.sub2 } : undefined,
    note: info?.note,
  };
}

// ============================================================
// Day templates - reused across weeks with different RIR values
// ============================================================

function upper1(rirs: { ip: [string, string]; pd: [string, string]; yr: [string, string]; pu: [string, string]; ks: [string, string]; pc: [string, string]; tp: [string, string]; df: [string, string] }, intensities?: { pd?: string; pu?: string; pc?: string; tp?: string }): BlockDay {
  return {
    dayName: 'Upper 1',
    exercises: [
      ex('Barbell Incline Press', 'N/A', '2-4', 2, '6-8', rirs.ip[0], rirs.ip[1], '3-5 min'),
      ex('Pec Deck', intensities?.pd || 'N/A', '1-2', 2, '6-8', rirs.pd[0], rirs.pd[1], '1-2 min'),
      ex('Incline DB Y-Raise', 'N/A', '0-1', 2, '8-10', rirs.yr[0], rirs.yr[1], '1-2 min'),
      ex('Pull-Up (Wide Grip)', intensities?.pu || 'N/A', '1-2', 2, '6-8', rirs.pu[0], rirs.pu[1], '2-3 min'),
      ex('Kelso Shrug', 'N/A', '1-2', 2, '6-8', rirs.ks[0], rirs.ks[1], '2-3 min'),
      ex('EZ-Bar Preacher Curl', intensities?.pc || 'N/A', '0-1', 2, '6-8', rirs.pc[0], rirs.pc[1], '1-2 min'),
      ex('Triceps Pressdown', intensities?.tp || 'N/A', '0-1', 2, '6-8', rirs.tp[0], rirs.tp[1], '1-2 min'),
      ex('Dragon Flag', 'N/A', '0-1', 2, '6-8', rirs.df[0], rirs.df[1], '1-2 min'),
    ],
  };
}

function lower1(rirs: { lc: [string, string]; sq: [string, string]; lu: [string, string]; le: [string, string]; ha: [string, string]; cr: [string, string] }, intensities?: { lc?: string; le?: string; cr?: string }): BlockDay {
  return {
    dayName: 'Lower 1',
    exercises: [
      ex('Lying Leg Curl', intensities?.lc || 'N/A', '1-2', 2, '6-8', rirs.lc[0], rirs.lc[1], '1-2 min'),
      ex('Squat (Your Choice)', 'N/A', '2-4', 2, '6-8', rirs.sq[0], rirs.sq[1], '3-5 min'),
      ex('Smith Machine Lunge', 'N/A', '2-4', 1, '6-8', rirs.lu[0], rirs.lu[1], '2-4 min'),
      ex('Leg Extension', intensities?.le || 'N/A', '1-2', 2, '6-8', rirs.le[0], rirs.le[1], '1-2 min'),
      ex('Machine Hip Abduction', 'N/A', '0-1', 1, '6-8', rirs.ha[0], rirs.ha[1], '1-2 min'),
      ex('Standing Calf Raise', intensities?.cr || 'N/A', '0-1', 2, '6-8', rirs.cr[0], rirs.cr[1], '1-2 min'),
    ],
  };
}

function upper2(rirs: { lp: [string, string]; tr: [string, string]; ms: [string, string]; cp: [string, string]; hc: [string, string]; rp: [string, string]; cc: [string, string] }, intensities?: { lp?: string; tr?: string; cp?: string }): BlockDay {
  return {
    dayName: 'Upper 2',
    exercises: [
      ex('Close-Grip Lat Pulldown', intensities?.lp || 'N/A', '2-3', 2, '8-10', rirs.lp[0], rirs.lp[1], '2-3 min'),
      ex('Chest-Supported T-Bar Row', intensities?.tr || 'N/A', '2-3', 2, '8-10', rirs.tr[0], rirs.tr[1], '2-3 min'),
      ex('Machine Shrug', 'N/A', '1-2', 1, '6-8', rirs.ms[0], rirs.ms[1], '1-2 min'),
      ex('Machine Chest Press', intensities?.cp || 'N/A', '2-4', 2, '8-10', rirs.cp[0], rirs.cp[1], '3-5 min'),
      ex('High-Cable Lateral Raise', 'N/A', '0-1', 2, '8-10', rirs.hc[0], rirs.hc[1], '1-2 min'),
      ex('1-Arm Reverse Pec Deck', 'N/A', '0-1', 1, '8-10', rirs.rp[0], rirs.rp[1], '1-2 min'),
      ex('Cable Crunch', 'N/A', '0-1', 2, '6-8', rirs.cc[0], rirs.cc[1], '1-2 min'),
    ],
  };
}

function lower2(rirs: { le: [string, string]; rd: [string, string]; ht: [string, string]; lp: [string, string]; cr: [string, string] }, intensities?: { le?: string; cr?: string }): BlockDay {
  return {
    dayName: 'Lower 2',
    exercises: [
      ex('Leg Extension', intensities?.le || 'N/A', '1-2', 2, '8-10', rirs.le[0], rirs.le[1], '1-2 min'),
      ex('Barbell RDL', 'N/A', '2-3', 2, '6-8', rirs.rd[0], rirs.rd[1], '2-3 min'),
      ex('Machine Hip Thrust', 'N/A', '2-4', 2, '6-8', rirs.ht[0], rirs.ht[1], '2-3 min'),
      ex('Leg Press', 'N/A', '2-4', 1, '6-8', rirs.lp[0], rirs.lp[1], '2-3 min'),
      ex('Standing Calf Raise', intensities?.cr || 'N/A', '0-1', 2, '8-10', rirs.cr[0], rirs.cr[1], '1-2 min'),
    ],
  };
}

function armsDelts(rirs: { bc: [string, string]; ot: [string, string]; zc: [string, string]; tk: [string, string]; wc: [string, string]; we: [string, string]; ac: [string, string]; ml: [string, string]; dh: [string, string] }, intensities?: { tk?: string; ac?: string; ml?: string }): BlockDay {
  return {
    dayName: 'Arms/Delts',
    exercises: [
      ex('Bayesian Cable Curl', 'N/A', '0-1', 2, '6-8', rirs.bc[0], rirs.bc[1], '1-2 min'),
      ex('Overhead Cable Triceps Extension', 'N/A', '0-1', 2, '8-10', rirs.ot[0], rirs.ot[1], '1-2 min'),
      ex('Modified Zottman Curl', 'N/A', '0-1', 1, '8-10', rirs.zc[0], rirs.zc[1], '1-2 min'),
      ex('Cable Triceps Kickback', intensities?.tk || 'N/A', '0-1', 2, '8-10', rirs.tk[0], rirs.tk[1], '1-2 min'),
      ex('DB Wrist Curl', 'N/A', '0-1', 2, '8-10', rirs.wc[0], rirs.wc[1], '1-2 min'),
      ex('DB Wrist Extension', 'N/A', '0-1', 2, '8-10', rirs.we[0], rirs.we[1], '1-2 min'),
      ex('Alternating DB Curl', intensities?.ac || 'N/A', '0-1', 1, '6-8', rirs.ac[0], rirs.ac[1], '1-2 min'),
      ex('Machine Lateral Raise', intensities?.ml || 'N/A', '0-1', 2, '8-10', rirs.ml[0], rirs.ml[1], '1-2 min'),
      ex('Dead Hang (optional)', 'N/A', '0-1', 2, 'N/A', rirs.dh[0], rirs.dh[1], '1-2 min'),
    ],
  };
}

function restDay(): BlockDay {
  return { dayName: 'Rest Day', exercises: [] };
}

// ============================================================
// Week builders
// ============================================================

// Week 1 - Intro Week (higher RIR)
const week1: BlockWeek = {
  weekNumber: 1,
  label: 'Intro Week',
  days: [
    upper1({ ip: ['2', '1'], pd: ['1', '0'], yr: ['1', '0'], pu: ['2', '1'], ks: ['2', '1'], pc: ['1', '0'], tp: ['1', '0'], df: ['1', '0'] }),
    lower1({ lc: ['1', '0'], sq: ['3', '2'], lu: ['1', 'N/A'], le: ['1', '0'], ha: ['0', 'N/A'], cr: ['1', '0'] }),
    restDay(),
    upper2({ lp: ['2', '1'], tr: ['2', '1'], ms: ['1', 'N/A'], cp: ['2', '1'], hc: ['1', '0'], rp: ['0', 'N/A'], cc: ['1', '0'] }),
    lower2({ le: ['1', '0'], rd: ['3', '2'], ht: ['2', '1'], lp: ['1', 'N/A'], cr: ['1', '0'] }),
    armsDelts({ bc: ['1', '0'], ot: ['1', '0'], zc: ['0', 'N/A'], tk: ['1', '0'], wc: ['1', '0'], we: ['1', '0'], ac: ['0', 'N/A'], ml: ['1', '0'], dh: ['0', '0'] }),
    restDay(),
  ],
};

// Weeks 2-6 - Standard training (lower RIR, push to failure)
function standardWeek(weekNum: number): BlockWeek {
  return {
    weekNumber: weekNum,
    label: `Week ${weekNum}`,
    days: [
      upper1({ ip: ['1', '0'], pd: ['0', '0'], yr: ['0', '0'], pu: ['1', '0'], ks: ['1', '0'], pc: ['0', '0'], tp: ['0', '0'], df: ['0', '0'] }),
      lower1({ lc: ['0', '0'], sq: ['1', '0'], lu: ['0', 'N/A'], le: ['0', '0'], ha: ['0', 'N/A'], cr: ['0', '0'] }),
      restDay(),
      upper2({ lp: ['1', '0'], tr: ['1', '0'], ms: ['0', 'N/A'], cp: ['1', '0'], hc: ['0', '0'], rp: ['0', 'N/A'], cc: ['0', '0'] }),
      lower2({ le: ['0', '0'], rd: ['2', '1'], ht: ['1', '0'], lp: ['0', 'N/A'], cr: ['0', '0'] }),
      armsDelts({ bc: ['0', '0'], ot: ['0', '0'], zc: ['0', 'N/A'], tk: ['0', '0'], wc: ['0', '0'], we: ['0', '0'], ac: ['0', 'N/A'], ml: ['0', '0'], dh: ['0', '0'] }),
      restDay(),
    ],
  };
}

// Week 7 - Deload Week (higher RIR like week 1)
const week7: BlockWeek = {
  weekNumber: 7,
  label: 'Deload Week',
  days: [
    upper1({ ip: ['2', '1'], pd: ['1', '0'], yr: ['1', '0'], pu: ['2', '1'], ks: ['2', '1'], pc: ['1', '0'], tp: ['1', '0'], df: ['1', '0'] }),
    lower1({ lc: ['1', '0'], sq: ['3', '2'], lu: ['1', 'N/A'], le: ['1', '0'], ha: ['0', 'N/A'], cr: ['1', '0'] }),
    restDay(),
    upper2({ lp: ['2', '1'], tr: ['2', '1'], ms: ['1', 'N/A'], cp: ['2', '1'], hc: ['1', '0'], rp: ['0', 'N/A'], cc: ['1', '0'] }),
    lower2({ le: ['1', '0'], rd: ['3', '2'], ht: ['2', '1'], lp: ['1', 'N/A'], cr: ['1', '0'] }),
    armsDelts({ bc: ['1', '0'], ot: ['1', '0'], zc: ['0', 'N/A'], tk: ['1', '0'], wc: ['1', '0'], we: ['1', '0'], ac: ['0', 'N/A'], ml: ['1', '0'], dh: ['0', '0'] }),
    restDay(),
  ],
};

// Weeks 8-12 - Intensification (same RIR as 2-6 but with last-set intensity techniques)
function intensificationWeek(weekNum: number): BlockWeek {
  return {
    weekNumber: weekNum,
    label: `Week ${weekNum}`,
    days: [
      upper1(
        { ip: ['1', '0'], pd: ['0', '0'], yr: ['0', '0'], pu: ['1', '0'], ks: ['1', '0'], pc: ['0', '0'], tp: ['0', '0'], df: ['0', '0'] },
        { pd: 'Two Drop Sets (~25% per)', pu: 'Lengthened Partials (Extend Set)', pc: 'Myo-reps', tp: 'Myo-reps' },
      ),
      lower1(
        { lc: ['0', '0'], sq: ['1', '0'], lu: ['0', 'N/A'], le: ['0', '0'], ha: ['0', 'N/A'], cr: ['0', '0'] },
        { lc: 'Lengthened Partials (Extend Set)', le: 'Lengthened Partials (Extend Set)', cr: 'Lengthened Partials (Extend Set)' },
      ),
      restDay(),
      upper2(
        { lp: ['1', '0'], tr: ['1', '0'], ms: ['0', 'N/A'], cp: ['1', '0'], hc: ['0', '0'], rp: ['0', 'N/A'], cc: ['0', '0'] },
        { lp: 'Lengthened Partials (Extend Set)', tr: 'Two Drop Sets (~25% per)', cp: 'Weighted Static Hold (30 sec)' },
      ),
      lower2(
        { le: ['0', '0'], rd: ['2', '1'], ht: ['1', '0'], lp: ['0', 'N/A'], cr: ['0', '0'] },
        { le: 'Lengthened Partials (Extend Set)', cr: 'Lengthened Partials (Extend Set)' },
      ),
      armsDelts(
        { bc: ['0', '0'], ot: ['0', '0'], zc: ['0', 'N/A'], tk: ['0', '0'], wc: ['0', '0'], we: ['0', '0'], ac: ['0', 'N/A'], ml: ['0', '0'], dh: ['0', '0'] },
        { tk: 'Two Drop Sets (~25% per)', ac: 'Two Drop Sets (~25% per)', ml: 'Myo-reps' },
      ),
      restDay(),
    ],
  };
}

export const minMaxProgram: BlockProgram = {
  id: 'minmax',
  name: 'Jeff Nippard Min Max Program',
  frequency: '5x Per Week',
  programNotes: [
    'Due to the lower volume in this program, it\'s essential that you approach each set with focused intent and high effort.',
    'Nearly every set in this program should be taken to failure, or 1 rep shy of failure. The only exceptions are in Week 1 (an intro week) and Week 7 (a deload week), where you won\'t train quite as hard.',
    'RIR of 0 means you hit failure (zero reps in the tank). RIR of 1 means you stop 1 rep shy of failure.',
    'For heavy compound lifts (Squat, Barbell Incline Press, Leg Press, Smith Machine Lunge), RIR of 0 means you couldn\'t complete another rep, but you don\'t need to actually attempt and fail the final rep unless you want to.',
    'For all other exercises, RIR of 0 means go for another rep even if you think you can\'t get it. Go until you physically can\'t complete the rep.',
  ],
  warmupProtocol: 'Start each workout with about 5 minutes of light cardio to raise your core body temperature. Each exercise includes the recommended number of exercise-specific warm-up sets, which should be light and not fatiguing.',
  blocks: [
    {
      blockNumber: 1,
      blockName: 'Block 1',
      weeks: [
        week1,
        standardWeek(2),
        standardWeek(3),
        standardWeek(4),
        standardWeek(5),
        standardWeek(6),
      ],
    },
    {
      blockNumber: 2,
      blockName: 'Block 2',
      weeks: [
        week7,
        intensificationWeek(8),
        intensificationWeek(9),
        intensificationWeek(10),
        intensificationWeek(11),
        intensificationWeek(12),
      ],
    },
  ],
};
