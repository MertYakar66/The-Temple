import { describe, it, expect } from 'vitest';
import { pluralize } from './pluralize';

describe('pluralize', () => {
  it('uses the singular noun when the count is 1', () => {
    expect(pluralize(1, 'day')).toBe('1 day');
    expect(pluralize(1, 'exercise')).toBe('1 exercise');
  });

  it('uses the plural noun when the count is 0', () => {
    expect(pluralize(0, 'day')).toBe('0 days');
    expect(pluralize(0, 'exercise')).toBe('0 exercises');
  });

  it('uses the plural noun when the count is greater than 1', () => {
    expect(pluralize(2, 'day')).toBe('2 days');
    expect(pluralize(7, 'exercise')).toBe('7 exercises');
  });

  it('defaults the plural to the singular plus "s"', () => {
    expect(pluralize(3, 'training day')).toBe('3 training days');
  });

  it('uses the explicit plural argument when provided', () => {
    expect(pluralize(1, 'foot', 'feet')).toBe('1 foot');
    expect(pluralize(3, 'foot', 'feet')).toBe('3 feet');
  });
});
