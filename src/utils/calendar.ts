/**
 * calendar utils — recurrence engine + view-grid helpers.
 *
 * `generateRecurrences` is the recurrence expansion. Active Batch 4
 * territory (docs/AUDIT_STATE.md): exception handling
 * (`seriesMasterId` + `originalDate` overrides), weekly `daysOfWeek`
 * semantics, and monthly recurrence (especially "nth weekday of month"
 * via `weekOfMonth`) have known gaps. Vitest table-driven tests should
 * land before behavior changes.
 *
 * Cloud Functions don't currently call this; Batch 5 will either share
 * it or extract a server-safe variant.
 */
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  setHours,
  setMinutes,
  getDay,
  isBefore,
  isAfter,
  differenceInMinutes,
} from 'date-fns';
import type { CalendarEvent, RecurrenceRule } from '../types/calendar';

/**
 * Get all dates to display in a month grid (includes days from prev/next months)
 */
export function getMonthGridDates(year: number, month: number, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1): Date[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

/**
 * Get week dates from a reference date
 */
export function getWeekDates(date: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1): Date[] {
  const start = startOfWeek(date, { weekStartsOn });
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

/**
 * Get weekday headers
 */
export function getWeekdayHeaders(weekStartsOn: number = 1): string[] {
  const base = new Date(2024, 0, 7); // Known Sunday
  const headers: string[] = [];
  for (let i = 0; i < 7; i++) {
    headers.push(format(addDays(base, (weekStartsOn + i) % 7), 'EEE'));
  }
  return headers;
}

/**
 * Generate occurrences of a recurring event within a date range
 */
export function generateRecurrences(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number = 500,
): CalendarEvent[] {
  const rule = event.recurrenceRule;
  if (!rule) return [event];

  const eventStart = parseISO(event.startDate);
  const eventEnd = parseISO(event.endDate);
  const duration = differenceInMinutes(eventEnd, eventStart);
  const occurrences: CalendarEvent[] = [];
  let count = 0;
  let current = eventStart;

  const ruleEndDate = rule.endDate ? parseISO(rule.endDate) : null;

  while (count < maxOccurrences) {
    if (isAfter(current, rangeEnd)) break;
    if (ruleEndDate && isAfter(current, ruleEndDate)) break;
    if (rule.endType === 'after_count' && rule.endCount && count >= rule.endCount) break;

    const occEnd = addMinutesToDate(current, duration);

    if (!isBefore(occEnd, rangeStart)) {
      occurrences.push({
        ...event,
        id: count === 0 ? event.id : `${event.id}_${format(current, 'yyyyMMdd')}`,
        startDate: current.toISOString(),
        endDate: occEnd.toISOString(),
        seriesMasterId: event.id,
        originalDate: current.toISOString(),
      });
    }

    current = getNextOccurrence(current, rule);
    count++;
  }

  return occurrences;
}

function addMinutesToDate(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function getNextOccurrence(current: Date, rule: RecurrenceRule): Date {
  switch (rule.frequency) {
    case 'daily':
      return addDays(current, rule.interval);
    case 'weekly': {
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const currentDay = getDay(current);
        const sorted = [...rule.daysOfWeek].sort((a, b) => a - b);
        const nextIdx = sorted.findIndex((d) => d > currentDay);
        if (nextIdx >= 0) {
          return addDays(current, sorted[nextIdx] - currentDay);
        }
        // Wrap to next week
        const daysToNext = 7 - currentDay + sorted[0] + (rule.interval - 1) * 7;
        return addDays(current, daysToNext);
      }
      return addWeeks(current, rule.interval);
    }
    case 'monthly':
      return addMonths(current, rule.interval);
    case 'yearly':
      return addYears(current, rule.interval);
    default:
      return addDays(current, 1);
  }
}

/**
 * Get events for a specific date (including recurring)
 */
export function getEventsForDate(
  events: CalendarEvent[],
  date: Date,
  visibleCalendarIds: Set<string>,
): CalendarEvent[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const result: CalendarEvent[] = [];

  for (const event of events) {
    if (event.isDeleted) continue;
    if (!visibleCalendarIds.has(event.calendarId)) continue;

    if (event.recurrenceRule && !event.isRecurrenceException) {
      const occurrences = generateRecurrences(event, dayStart, dayEnd);
      result.push(...occurrences);
    } else {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);

      if (event.isAllDay) {
        const eventStartDay = new Date(start);
        eventStartDay.setHours(0, 0, 0, 0);
        const eventEndDay = new Date(end);
        eventEndDay.setHours(23, 59, 59, 999);
        if (isWithinInterval(date, { start: eventStartDay, end: eventEndDay }) ||
            isSameDay(date, start) || isSameDay(date, end)) {
          result.push(event);
        }
      } else {
        if (isSameDay(date, start) || isSameDay(date, end) ||
            isWithinInterval(date, { start, end })) {
          result.push(event);
        }
      }
    }
  }

  return result.sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    return parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
  });
}

/**
 * Get events within a date range (for month/week views)
 */
export function getEventsInRange(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  visibleCalendarIds: Set<string>,
): CalendarEvent[] {
  const result: CalendarEvent[] = [];

  for (const event of events) {
    if (event.isDeleted) continue;
    if (!visibleCalendarIds.has(event.calendarId)) continue;

    if (event.recurrenceRule && !event.isRecurrenceException) {
      result.push(...generateRecurrences(event, rangeStart, rangeEnd));
    } else {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      if (!isAfter(start, rangeEnd) && !isBefore(end, rangeStart)) {
        result.push(event);
      }
    }
  }

  return result.sort((a, b) =>
    parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
  );
}

/**
 * Get the top position (in %) for a timed event on a day grid
 */
export function getEventTopPercent(event: CalendarEvent): number {
  const start = parseISO(event.startDate);
  return ((start.getHours() * 60 + start.getMinutes()) / 1440) * 100;
}

/**
 * Get the height (in %) for a timed event on a day grid
 */
export function getEventHeightPercent(event: CalendarEvent): number {
  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);
  const mins = differenceInMinutes(end, start);
  return Math.max((mins / 1440) * 100, 1.4); // minimum ~20min visible
}

/**
 * Create a default start/end datetime from a date and optional hour
 */
export function createDefaultEventTimes(date: Date, hour?: number, durationMinutes: number = 60) {
  const start = hour !== undefined
    ? setMinutes(setHours(new Date(date), hour), 0)
    : setMinutes(setHours(new Date(date), new Date().getHours() + 1), 0);
  const end = addMinutesToDate(start, durationMinutes);
  return { start, end };
}

/**
 * Format time for display
 */
export function formatEventTime(dateStr: string, use24Hour: boolean = false): string {
  const date = parseISO(dateStr);
  return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
}

/**
 * Search events by text
 */
export function searchEvents(events: CalendarEvent[], query: string): CalendarEvent[] {
  const lower = query.toLowerCase();
  return events.filter((e) => {
    if (e.isDeleted) return false;
    return (
      e.title.toLowerCase().includes(lower) ||
      (e.location?.toLowerCase().includes(lower)) ||
      (e.notes?.toLowerCase().includes(lower)) ||
      e.attendees.some((a) => a.name.toLowerCase().includes(lower) || a.email.toLowerCase().includes(lower))
    );
  });
}
