import { endOfDay, format, parseISO, startOfDay } from 'date-fns';

export const getDateStamp = (date: Date = new Date()) => format(date, 'yyyy-MM-dd');

export const parseDateStamp = (dateStamp: string) => parseISO(dateStamp);

export const isDateStampInRange = (dateStamp: string, start: Date, end: Date) => {
  const date = parseDateStamp(dateStamp);
  const rangeStart = startOfDay(start);
  const rangeEnd = endOfDay(end);

  return date >= rangeStart && date <= rangeEnd;
};
