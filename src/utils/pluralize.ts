/**
 * Format a count with a correctly pluralized noun.
 *
 * @example
 * pluralize(1, 'day')      // "1 day"
 * pluralize(3, 'day')      // "3 days"
 * pluralize(1, 'exercise') // "1 exercise"
 */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
