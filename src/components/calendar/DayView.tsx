import { useMemo, useRef, useEffect } from 'react';
import { format, parseISO, isToday, differenceInMinutes, setHours as setDateHours, setMinutes as setDateMinutes, setSeconds as setDateSeconds } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';
import { getEventsForDate, formatEventTime } from '../../utils/calendar';

const HOUR_HEIGHT = 60; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface DayViewProps {
  onSelectEvent: (eventId: string) => void;
  onCreateEvent: (date: Date, hour?: number) => void;
}

export function DayView({ onSelectEvent, onCreateEvent }: DayViewProps) {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const events = useCalendarStore((s) => s.events);
  const calendars = useCalendarStore((s) => s.calendars);
  const settings = useCalendarStore((s) => s.settings);

  const visibleIds = useMemo(
    () => new Set(calendars.filter((c) => c.isVisible).map((c) => c.id)),
    [calendars]
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const date = parseISO(selectedDate);
  const dayIsToday = isToday(date);

  const dayEvents = useMemo(
    () => getEventsForDate(events, date, visibleIds),
    [events, date, visibleIds]
  );

  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay);

  const calMap = useMemo(() => {
    const m = new Map<string, typeof calendars[0]>();
    calendars.forEach((c) => m.set(c.id, c));
    return m;
  }, [calendars]);

  // Scroll to current hour on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollTo = (now.getHours() - 1) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, []);

  const getEventStyle = (event: typeof timedEvents[0]) => {
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);
    const startMins = start.getHours() * 60 + start.getMinutes();
    const duration = Math.max(differenceInMinutes(end, start), 15);
    const top = (startMins / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 20);
    return { top, height };
  };

  const currentTimeTop = dayIsToday
    ? ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) * HOUR_HEIGHT
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-1.5 space-y-1 bg-gray-50 dark:bg-gray-850">
          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">All Day</p>
          {allDayEvents.map((ev) => {
            const cal = calMap.get(ev.calendarId);
            const color = cal?.color || '#3B82F6';
            return (
              <button
                key={ev.id}
                onClick={() => onSelectEvent(ev.id)}
                className="w-full text-left text-xs px-2 py-1 rounded font-medium truncate"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {ev.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/50 flex"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              <span className="text-[10px] text-gray-400 dark:text-gray-500 w-12 text-right pr-2 -mt-2 flex-shrink-0">
                {format(setDateSeconds(setDateMinutes(setDateHours(new Date(), hour), 0), 0), settings.use24HourTime ? 'HH:mm' : 'h a')}
              </span>
              <button
                onClick={() => onCreateEvent(date, hour)}
                className="flex-1 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
                style={{ height: HOUR_HEIGHT }}
              />
            </div>
          ))}

          {/* Current time indicator */}
          {currentTimeTop !== null && (
            <div
              className="absolute left-10 right-0 z-20 flex items-center"
              style={{ top: currentTimeTop }}
            >
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1.5" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          )}

          {/* Timed events */}
          <div className="absolute left-12 right-2 top-0 bottom-0">
            {timedEvents.map((ev) => {
              const { top, height } = getEventStyle(ev);
              const cal = calMap.get(ev.calendarId);
              const color = cal?.color || '#3B82F6';
              return (
                <button
                  key={ev.id}
                  onClick={() => onSelectEvent(ev.id)}
                  className="absolute left-0 right-0 rounded-lg px-2 py-1 overflow-hidden text-left hover:opacity-90 transition-opacity shadow-sm"
                  style={{
                    top,
                    height,
                    backgroundColor: `${color}20`,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{ev.title}</p>
                  {height > 30 && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatEventTime(ev.startDate, settings.use24HourTime)} – {formatEventTime(ev.endDate, settings.use24HourTime)}
                    </p>
                  )}
                  {height > 50 && ev.location && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{ev.location}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
