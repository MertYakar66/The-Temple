import { describe, it, expect } from 'vitest';
import {
  convertWeight,
  kgToDisplay,
  displayToKg,
  formatWeight,
  getWeightUnit,
} from './weight';

describe('convertWeight', () => {
  it('returns same value when from === to', () => {
    expect(convertWeight(100, 'metric', 'metric')).toBe(100);
    expect(convertWeight(220, 'imperial', 'imperial')).toBe(220);
  });

  it('converts kg to lbs', () => {
    const result = convertWeight(100, 'metric', 'imperial');
    expect(result).toBeCloseTo(220.462, 1);
  });

  it('converts lbs to kg', () => {
    const result = convertWeight(220, 'imperial', 'metric');
    expect(result).toBeCloseTo(99.79, 1);
  });

  it('handles zero', () => {
    expect(convertWeight(0, 'metric', 'imperial')).toBe(0);
  });
});

describe('kgToDisplay', () => {
  it('returns kg unchanged for metric', () => {
    expect(kgToDisplay(80, 'metric')).toBe(80);
  });

  it('converts to lbs for imperial', () => {
    expect(kgToDisplay(80, 'imperial')).toBeCloseTo(176.37, 1);
  });
});

describe('displayToKg', () => {
  it('returns value unchanged for metric', () => {
    expect(displayToKg(80, 'metric')).toBe(80);
  });

  it('converts lbs to kg for imperial', () => {
    expect(displayToKg(176, 'imperial')).toBeCloseTo(79.83, 1);
  });

  // Round-trip: kg → display → kg should be close to original
  it('round-trips metric → imperial → metric', () => {
    const original = 85;
    const displayed = kgToDisplay(original, 'imperial');
    const roundTripped = displayToKg(displayed, 'imperial');
    expect(roundTripped).toBeCloseTo(original, 2);
  });
});

describe('formatWeight', () => {
  it('formats metric with 1 decimal by default', () => {
    expect(formatWeight(80.567, 'metric')).toBe('80.6');
  });

  it('formats imperial with conversion', () => {
    const result = formatWeight(100, 'imperial');
    expect(parseFloat(result)).toBeCloseTo(220.5, 0);
  });

  it('respects custom decimal places', () => {
    expect(formatWeight(80, 'metric', 0)).toBe('80');
    expect(formatWeight(80, 'metric', 2)).toBe('80.00');
  });
});

describe('getWeightUnit', () => {
  it('returns kg for metric', () => {
    expect(getWeightUnit('metric')).toBe('kg');
  });

  it('returns lbs for imperial', () => {
    expect(getWeightUnit('imperial')).toBe('lbs');
  });
});
