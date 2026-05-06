// TZ override.
//
// This test must run in a non-UTC timezone to distinguish Option A from
// Option B of the Batch 3 #3 fix:
//   - Option A (the fix): parseDateStamp + getDateStamp end-to-end.
//   - Option B (the regression): naïve swap to getDateStamp only —
//     `new Date('YYYY-MM-DD')` parses as UTC midnight (May 4 17:00 PDT),
//     then getDateStamp formats local-aware → date stamps shift back one day.
// In TZ=UTC both implementations produce identical output and the test
// passes vacuously. In TZ=America/Los_Angeles the regression manifests
// concretely on the i=0 iteration of getWeeklyStats and on the
// "is yesterday's stamp the right one" check inside updateStreaks.
//
// Setting process.env.TZ here works in Node 25 because date-fns reads
// the local offset at call time (via Date.prototype.getTimezoneOffset)
// rather than caching it at process start. Restored in afterAll.
//
// `process` isn't in tsconfig.app's types list (vite/client only), so
// we declare a minimal local ambient — scoped to this test file; doesn't
// broaden the app's type surface.
declare const process: { env: Record<string, string | undefined> };
const __originalTZ = process.env.TZ;
process.env.TZ = 'America/Los_Angeles';

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { useDietStore, dietStoreMigrate } from './useDietStore';
import { defaultFoods } from '../data/foods';

const FOOD_ID = defaultFoods[0].id; // 'chicken-breast'

afterAll(() => {
  if (__originalTZ === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = __originalTZ;
  }
});

describe('useDietStore — Batch 3 date-stamp fix (Option A: parseDateStamp + getDateStamp)', () => {
  beforeEach(() => {
    useDietStore.getState().resetStore();
  });

  it('TZ override is in effect (sanity — without this, regression tests pass vacuously)', () => {
    // The fix is observably equivalent to the bug version in TZ=UTC.
    // The regression sentinel only exists when local TZ differs from UTC.
    // If this assertion fails, the process.env.TZ override at top of file
    // didn't take effect — fix the override before trusting the tests
    // below.
    //
    // new Date('2026-05-05') is parsed as UTC midnight (per ECMAScript).
    // In UTC, getDate() returns 5. In PST/PDT (UTC-7 or UTC-8), it
    // returns 4 because UTC midnight is the previous local day.
    expect(new Date('2026-05-05').getDate()).toBe(4);
  });

  it('updateStreaks increments loggingStreak when called on consecutive local days', () => {
    // Log on a "yesterday" stamp first.
    useDietStore.getState().logFood({
      date: '2026-05-04',
      mealType: 'breakfast',
      type: 'food',
      foodId: FOOD_ID,
      servings: 1,
    });
    expect(useDietStore.getState().streaks.lastLogDate).toBe('2026-05-04');
    expect(useDietStore.getState().streaks.loggingStreak).toBe(1);

    // Log on "today". updateStreaks computes yesterday-of-today via
    // parseDateStamp + getDateStamp; it should match the prior lastLogDate
    // ('2026-05-04') and increment the streak to 2.
    //
    // Regression sentinel: the naïve fix (just getDateStamp on
    // new Date('2026-05-05')) returns '2026-05-03' in PST — the streak
    // would NOT match and would reset to 1. This expectation fails under
    // the naïve fix.
    useDietStore.getState().logFood({
      date: '2026-05-05',
      mealType: 'lunch',
      type: 'food',
      foodId: FOOD_ID,
      servings: 1,
    });
    expect(useDietStore.getState().streaks.lastLogDate).toBe('2026-05-05');
    expect(useDietStore.getState().streaks.loggingStreak).toBe(2);
  });

  it('getWeeklyStats walks seven local-aware date stamps starting from weekStartDate', () => {
    // Log a food on each of the seven days of the week starting 2026-05-05
    // (Tuesday). Use the input stamps directly — these are what the user
    // would see and what getWeeklyStats should walk.
    const expectedStamps = [
      '2026-05-05',
      '2026-05-06',
      '2026-05-07',
      '2026-05-08',
      '2026-05-09',
      '2026-05-10',
      '2026-05-11',
    ];
    for (const stamp of expectedStamps) {
      useDietStore.getState().logFood({
        date: stamp,
        mealType: 'breakfast',
        type: 'food',
        foodId: FOOD_ID,
        servings: 1,
      });
    }

    const stats = useDietStore.getState().getWeeklyStats('2026-05-05');

    // Fix walks the same seven local-aware stamps we logged on; finds all
    // seven entries.
    //
    // Regression sentinel: the naïve fix (new Date(weekStart) +
    // getDateStamp inside the loop) walks ['2026-05-04', '2026-05-05',
    // ..., '2026-05-10'] in PST — six match, one ('2026-05-04') doesn't,
    // and '2026-05-11' is missed entirely. totalDaysLogged would be 6.
    expect(stats.totalDaysLogged).toBe(7);
  });

  it('getWeeklyStats does not include the day before the requested weekStart', () => {
    // Pin the regression case explicitly: a food logged on the day BEFORE
    // weekStart must NOT appear in the weekly stats. The naïve fix would
    // count it (because its first iteration yields the prior local day).
    useDietStore.getState().logFood({
      date: '2026-05-04', // day before weekStart
      mealType: 'breakfast',
      type: 'food',
      foodId: FOOD_ID,
      servings: 1,
    });

    const stats = useDietStore.getState().getWeeklyStats('2026-05-05');

    // Fix: zero entries in the requested week.
    // Naïve fix: one entry (the '2026-05-04' food, picked up via the
    //   off-by-one i=0 iteration). totalDaysLogged would be 1.
    expect(stats.totalDaysLogged).toBe(0);
  });
});

describe('dietStoreMigrate (persist v1)', () => {
  it('drops dietSettings.mealReminders and preserves every other field', () => {
    // Hand-construct an "old shape" persisted blob — what a v0
    // localStorage entry from before Batch 3 would look like. The
    // migration must strip mealReminders without touching any sibling.
    const oldShape = {
      customFoods: [{ id: 'f1', name: 'Tofu' }],
      recipes: [{ id: 'r1', name: 'Salad' }],
      meals: [{ id: 'm1', name: 'Lunch combo' }],
      foodLog: [{ id: 'l1', date: '2026-05-05' }],
      recentFoodIds: ['f1'],
      dietSettings: {
        goals: {
          dailyCalories: 2500,
          dailyProtein: 180,
          dailyCarbs: 250,
          dailyFat: 80,
          goalType: 'maintenance',
          trainingDayCalorieAdjustment: 300,
          trainingDayProteinAdjustment: 20,
        },
        mealReminders: [
          { id: 'reminder-breakfast', mealType: 'breakfast', time: '08:00', enabled: true },
          { id: 'reminder-lunch', mealType: 'lunch', time: '12:30', enabled: false },
        ],
        proteinPriority: true,
      },
      streaks: { proteinStreak: 5, loggingStreak: 7, lastProteinHitDate: '2026-05-05', lastLogDate: '2026-05-05' },
    };

    const result = dietStoreMigrate(oldShape) as typeof oldShape & {
      dietSettings: Omit<(typeof oldShape)['dietSettings'], 'mealReminders'>;
    };

    // Sibling fields preserved unchanged (the only failure mode worth
    // catching — accidentally widening the migration to drop more).
    expect(result.customFoods).toEqual(oldShape.customFoods);
    expect(result.recipes).toEqual(oldShape.recipes);
    expect(result.meals).toEqual(oldShape.meals);
    expect(result.foodLog).toEqual(oldShape.foodLog);
    expect(result.recentFoodIds).toEqual(oldShape.recentFoodIds);
    expect(result.streaks).toEqual(oldShape.streaks);
    expect(result.dietSettings.goals).toEqual(oldShape.dietSettings.goals);
    expect(result.dietSettings.proteinPriority).toBe(true);

    // mealReminders is gone.
    expect(result.dietSettings).not.toHaveProperty('mealReminders');
  });

  it('is a no-op when dietSettings is absent', () => {
    const blob = { customFoods: [], foodLog: [] };
    expect(dietStoreMigrate(blob)).toEqual(blob);
  });

  it('is a no-op when dietSettings has no mealReminders key', () => {
    // E.g. partial shape from a hand-edited localStorage or a user who
    // already cleared their reminders via an earlier client.
    const blob = { dietSettings: { goals: { dailyCalories: 2500 }, proteinPriority: true } };
    expect(dietStoreMigrate(blob)).toEqual(blob);
  });

  it('handles non-object input safely', () => {
    expect(dietStoreMigrate(null)).toBe(null);
    expect(dietStoreMigrate(undefined)).toBe(undefined);
    expect(dietStoreMigrate('not an object')).toBe('not an object');
  });
});
