/**
 * Canonical date-stamp helpers for the client.
 *
 * Use `getDateStamp(date)` for any "what day is it" string in storage.
 * BANNED: `new Date().toISOString().split('T')[0]` — that uses UTC and
 * breaks for non-UTC users (rolls over at the wrong moment). See
 * docs/DATA_POLICY.md §2.
 *
 * Cloud Functions can't import this (server-side); they use
 * `Intl.DateTimeFormat` with the `?tz=` query param. The fallback in
 * `todayDateString` in functions/src/index.ts still uses the banned
 * pattern (Batch 5).
 *
 * Tests: src/utils/date.test.ts.
 */
import { endOfDay, format, parseISO, startOfDay } from 'date-fns';

export const getDateStamp = (date: Date = new Date()) => format(date, 'yyyy-MM-dd');

export const parseDateStamp = (dateStamp: string) => parseISO(dateStamp);

export const isDateStampInRange = (dateStamp: string, start: Date, end: Date) => {
  const date = parseDateStamp(dateStamp);
  const rangeStart = startOfDay(start);
  const rangeEnd = endOfDay(end);

  return date >= rangeStart && date <= rangeEnd;
};
