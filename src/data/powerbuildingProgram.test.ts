import { describe, it, expect } from 'vitest';
import { powerbuildingProgram } from './powerbuildingProgram';

describe('powerbuildingProgram', () => {
  const weeks = powerbuildingProgram.blocks[0].weeks;

  it('has a stable id and one block of 10 weeks', () => {
    expect(powerbuildingProgram.id).toBe('powerbuilding');
    expect(powerbuildingProgram.blocks).toHaveLength(1);
    expect(weeks).toHaveLength(10);
    expect(weeks.map((w) => w.weekNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('alternates 5-day Full Body (odd) and 6-day Upper/Lower (even) for weeks 1-9', () => {
    for (const w of weeks.slice(0, 9)) {
      expect(w.days.length).toBe(w.weekNumber % 2 === 1 ? 5 : 6);
    }
  });

  it('leaves week 10 as an empty Peak placeholder', () => {
    expect(weeks[9].days).toEqual([]);
    expect(weeks[9].label).toBe('Peak Week');
  });

  it('gives every exercise the required block fields', () => {
    for (const w of weeks) {
      for (const day of w.days) {
        expect(day.dayName).toBeTruthy();
        expect(day.exercises.length).toBeGreaterThan(0);
        for (const e of day.exercises) {
          expect(e.name).toBeTruthy();
          expect(e.sets).toBeGreaterThan(0);
          expect(e.repRange).toBeTruthy();
          expect(typeof e.warmup).toBe('string');
          // PowerBuilding has one RPE per exercise → rirS1 only, rirS2 always N/A.
          expect(e.rirS2).toBe('N/A');
          expect(e.rest).toBeTruthy();
        }
      }
    }
  });

  it('stores RPE converted to RIR (10 - RPE) in rirS1, or N/A', () => {
    for (const w of weeks) {
      for (const day of w.days) {
        for (const e of day.exercises) {
          if (e.rirS1 === 'N/A') continue;
          const n = Number(e.rirS1);
          expect(Number.isNaN(n)).toBe(false);
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(10);
        }
      }
    }
  });
});
