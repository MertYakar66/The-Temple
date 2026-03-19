import { describe, it, expect } from 'vitest';
import { getDateStamp, parseDateStamp, isDateStampInRange } from './date';

describe('getDateStamp', () => {
  it('formats date as yyyy-MM-dd', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(getDateStamp(date)).toBe('2024-01-15');
  });

  it('pads single-digit month and day', () => {
    const date = new Date(2024, 2, 5); // Mar 5, 2024
    expect(getDateStamp(date)).toBe('2024-03-05');
  });

  // Edge case: leap year
  it('handles leap year Feb 29', () => {
    const date = new Date(2024, 1, 29);
    expect(getDateStamp(date)).toBe('2024-02-29');
  });

  // Edge case: year boundary
  it('handles Dec 31', () => {
    const date = new Date(2024, 11, 31);
    expect(getDateStamp(date)).toBe('2024-12-31');
  });
});

describe('parseDateStamp', () => {
  it('parses yyyy-MM-dd string to Date', () => {
    const result = parseDateStamp('2024-01-15');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(15);
  });

  // Round-trip
  it('round-trips through getDateStamp and parseDateStamp', () => {
    const original = new Date(2024, 5, 20);
    const stamp = getDateStamp(original);
    const parsed = parseDateStamp(stamp);
    expect(getDateStamp(parsed)).toBe(stamp);
  });
});

describe('isDateStampInRange', () => {
  const start = new Date(2024, 0, 10); // Jan 10
  const end = new Date(2024, 0, 20);   // Jan 20

  it('returns true for date within range', () => {
    expect(isDateStampInRange('2024-01-15', start, end)).toBe(true);
  });

  it('returns true for start boundary', () => {
    expect(isDateStampInRange('2024-01-10', start, end)).toBe(true);
  });

  it('returns true for end boundary', () => {
    expect(isDateStampInRange('2024-01-20', start, end)).toBe(true);
  });

  it('returns false for date before range', () => {
    expect(isDateStampInRange('2024-01-09', start, end)).toBe(false);
  });

  it('returns false for date after range', () => {
    expect(isDateStampInRange('2024-01-21', start, end)).toBe(false);
  });
});
