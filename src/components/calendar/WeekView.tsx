import { useMemo, useRef, useEffect } from 'react';
import { format, parseISO, isSameDay, isToday, differenceInMinutes, setHours as setDateHours, setMinutes as setDateMinutes, setSeconds as setDateSeconds } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';
import { getWeekDates, getEventsForDate, formatEventTime } from '../../utils/calendar';

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface WeekViewProps {
  onSelectEvent: (eventId: string) => void;
  onSelectDate: (date: Date) => void;
  onCreateEvent: (date: Date, hour?: number) => void;
}

export function WeekView({ onSelectEvent, onSelectDate, onCreateEvent }: WeekViewProps) {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const events = useCalendarStore((s) => s.events);
  const calendars = useCalendarStore((s) => s.calendars);
  const settings = useCalendarStore((s) => s.settings);
  const visibleIds = useCalendarStore((s) => s.getVisibleCalendarIds());
  const scrollRef = useRef<HTMLDivElement>(null);

  const date = parseISO(selectedDate);
  const weekStartsOn = settings.startOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const weekDates = useMemo(() => getWeekDates(date, weekStartsOn), [date, weekStartsOn]);

  const calMap = useMemo(() => {
    const m = new Map<string, typeof calendars[0]>();
    calendars.forEach((c) => m.set(c.id, c));
    return m;
  }, [calendars]);

  // Per-day events
  const dayEventsList = useMemo(() => {
    return weekDates.map((d) => ({
      date: d,
      allDay: getEventsForDate(events, d, visibleIds).filter((e) => e.isAllDay),
      timed: getEventsForDate(events, d, visibleIds).filter((e) => !e.isAllDay),
    }));
  }, [weekDates, events, visibleIds]);

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      scrollRef.current.scrollTop = Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT);
    }
  }, []);

  const currentTimeTop = ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) * HOUR_HEIGHT;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div /> {/* spacer for time column */}
        {weekDates.map((d, i) => {
          const today = isToday(d);
          const selected = isSameDay(d, date);
          return (
            <button
              key={i}
              onClick={() => onSelectDate(d)}
              className={`text-center py-2 border-l border-gray-100 dark:border-gray-700/50 ${
                selected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{format(d, 'EEE')}</p>
              <p className={`text-sm font-semibold ${
                today ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
              }`}>
                {format(d, 'd')}
              </p>
            </button>
          );
        })}
      </div>

      {/* All-day row */}
      {dayEventsList.some((d) => d.allDay.length > 0) && (
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
          <div className="text-[10px] text-gray-400 px-1 py-1 text-right">All Day</div>
          {dayEventsList.map((d, i) => (
            <div key={i} className="border-l border-gray-100 dark:border-gray-700/50 px-0.5 py-1 space-y-0.5">
              {d.allDay.slice(0, 2).map((ev) => {
                const cal = calMap.get(ev.calendarId);
                const color = cal?.color || '#3B82F6';
                return (
                  <button
                    key={ev.id}
                    onClick={() => onSelectEvent(ev.id)}
                    className="w-full text-[10px] px-1 py-0.5 rounded truncate font-medium text-left"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {ev.title}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="relative grid grid-cols-[3rem_repeat(7,1fr)]" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Time labels & hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/30"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              <span className="absolute left-0 text-[10px] text-gray-400 dark:text-gray-500 w-12 text-right pr-1 -mt-2">
                {format(setDateSeconds(setDateMinutes(setDateHours(new Date(), hour), 0), 0), settings.use24HourTime ? 'HH:mm' : 'h a')}
              </span>
            </div>
          ))}

          {/* Day columns with events */}
          {dayEventsList.map((dayData, colIdx) => {
            const isCurrentDay = isToday(dayData.date);
            return (
              <div
                key={colIdx}
                className="relative border-l border-gray-100 dark:border-gray-700/50"
                style={{ gridColumn: colIdx + 2 }}
              >
                {/* Click zones for creating events */}
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => onCreateEvent(dayData.date, hour)}
                    className="absolute left-0 right-0 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  />
                ))}

                {/* Current time line */}
                {isCurrentDay && (
                  <div
                    className="absolute left-0 right-0 z-20 h-0.5 bg-red-500"
                    style={{ top: currentTimeTop }}
                  >
                    <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  </div>
                )}

                {/* Events */}
                {dayData.timed.map((ev) => {
                  const start = parseISO(ev.startDate);
                  const end = parseISO(ev.endDate);
                  const startMins = start.getHours() * 60 + start.getMinutes();
                  const duration = Math.max(differenceInMinutes(end, start), 15);
                  const top = (startMins / 60) * HOUR_HEIGHT;
                  const height = Math.max((duration / 60) * HOUR_HEIGHT, 16);
                  const cal = calMap.get(ev.calendarId);
                  const color = cal?.color || '#3B82F6';

                  return (
                    <button
                      key={ev.id}
                      onClick={() => onSelectEvent(ev.id)}
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden text-left hover:opacity-90 transition-opacity z-10"
                      style={{
                        top,
                        height,
                        backgroundColor: `${color}25`,
                        borderLeft: `2px solid ${color}`,
                      }}
                    >
                      <p className="text-[10px] font-medium text-gray-900 dark:text-white truncate leading-tight">
                        {ev.title}
                      </p>
                      {height > 20 && (
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">
                          {formatEventTime(ev.startDate, settings.use24HourTime)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
