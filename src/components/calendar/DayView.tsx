import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { format, parseISO, isToday, differenceInMinutes, setHours as setDateHours, setMinutes as setDateMinutes, setSeconds as setDateSeconds } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';
import { getEventsForDate, formatEventTime } from '../../utils/calendar';

const HOUR_HEIGHT = 60; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface DayViewProps {
  onSelectEvent: (eventId: string, rect: DOMRect) => void;
  onQuickCreate: (date: Date, startHour: number, endHour: number, startMin: number, endMin: number, rect: DOMRect) => void;
  onCreateEvent: (date: Date, hour?: number) => void;
}

function snapToQuarter(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

export function DayView({ onSelectEvent, onQuickCreate }: DayViewProps) {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const events = useCalendarStore((s) => s.events);
  const calendars = useCalendarStore((s) => s.calendars);
  const settings = useCalendarStore((s) => s.settings);

  const visibleIds = useMemo(
    () => new Set(calendars.filter((c) => c.isVisible).map((c) => c.id)),
    [calendars]
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Memoize the parsed date — a fresh Date each render would invalidate
  // downstream useMemo deps unnecessarily.
  const date = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const dayIsToday = isToday(date);

  // Partition events into all-day/timed in one pass instead of two filters.
  const { allDayEvents, timedEvents } = useMemo(() => {
    const all = getEventsForDate(events, date, visibleIds);
    const allDay: typeof all = [];
    const timed: typeof all = [];
    for (const ev of all) {
      (ev.isAllDay ? allDay : timed).push(ev);
    }
    return { allDayEvents: allDay, timedEvents: timed };
  }, [events, date, visibleIds]);

  const calMap = useMemo(() => {
    const m = new Map<string, typeof calendars[0]>();
    calendars.forEach((c) => m.set(c.id, c));
    return m;
  }, [calendars]);

  // Drag-to-create state
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0); // minutes from midnight
  const [dragEnd, setDragEnd] = useState(0);
  const dragActiveRef = useRef(false);

  const getMinutesFromY = useCallback((clientY: number) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const y = clientY - rect.top + scrollTop;
    const minutes = (y / (24 * HOUR_HEIGHT)) * 1440;
    return Math.max(0, Math.min(1440, snapToQuarter(minutes)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't start drag on existing events
    if ((e.target as HTMLElement).closest('[data-event]')) return;
    const mins = getMinutesFromY(e.clientY);
    setDragStart(mins);
    setDragEnd(mins + 30); // default 30min
    setDragging(true);
    dragActiveRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [getMinutesFromY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragActiveRef.current) return;
    const mins = getMinutesFromY(e.clientY);
    setDragEnd(mins);
  }, [getMinutesFromY]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragActiveRef.current) return;
    dragActiveRef.current = false;
    setDragging(false);
    e.preventDefault();
    e.stopPropagation();

    const startMins = Math.min(dragStart, dragEnd);
    let endMins = Math.max(dragStart, dragEnd);
    if (endMins - startMins < 15) endMins = startMins + 30;

    const sh = Math.floor(startMins / 60);
    const sm = startMins % 60;
    const eh = Math.floor(endMins / 60);
    const em = endMins % 60;

    // Calculate position for popover
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (gridRect) {
      const top = gridRect.top + (startMins / 1440) * (24 * HOUR_HEIGHT) - (scrollRef.current?.scrollTop || 0);
      const popoverRect = new DOMRect(gridRect.left + 60, Math.min(top, window.innerHeight - 200), gridRect.width - 70, 0);
      onQuickCreate(date, sh, eh, sm, em, popoverRect);
    }
  }, [dragStart, dragEnd, date, onQuickCreate]);

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

  // Drag preview
  const dragTop = (Math.min(dragStart, dragEnd) / 60) * HOUR_HEIGHT;
  const dragHeight = Math.max((Math.abs(dragEnd - dragStart) / 60) * HOUR_HEIGHT, 15);

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
                data-event
                onClick={(e) => onSelectEvent(ev.id, (e.target as HTMLElement).getBoundingClientRect())}
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
        <div
          ref={gridRef}
          className="relative select-none"
          style={{ height: 24 * HOUR_HEIGHT }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/50 flex"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              <span className="text-[10px] text-gray-400 dark:text-gray-500 w-12 text-right pr-2 -mt-2 flex-shrink-0 pointer-events-none">
                {format(setDateSeconds(setDateMinutes(setDateHours(new Date(), hour), 0), 0), settings.use24HourTime ? 'HH:mm' : 'h a')}
              </span>
            </div>
          ))}

          {/* Drag preview */}
          {dragging && (
            <div
              className="absolute left-12 right-2 rounded-lg border-2 border-dashed border-primary-400 bg-primary-100/50 dark:bg-primary-900/30 z-30 pointer-events-none"
              style={{ top: dragTop, height: dragHeight }}
            >
              <p className="text-[10px] text-primary-600 dark:text-primary-400 px-2 pt-0.5 font-medium">
                {format(setDateMinutes(setDateHours(new Date(), Math.floor(Math.min(dragStart, dragEnd) / 60)), Math.min(dragStart, dragEnd) % 60), settings.use24HourTime ? 'HH:mm' : 'h:mm a')}
                {' – '}
                {format(setDateMinutes(setDateHours(new Date(), Math.floor(Math.max(dragStart, dragEnd) / 60)), Math.max(dragStart, dragEnd) % 60), settings.use24HourTime ? 'HH:mm' : 'h:mm a')}
              </p>
            </div>
          )}

          {/* Current time indicator */}
          {currentTimeTop !== null && (
            <div
              className="absolute left-10 right-0 z-20 flex items-center pointer-events-none"
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
                  data-event
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(ev.id, (e.currentTarget as HTMLElement).getBoundingClientRect());
                  }}
                  className="absolute left-0 right-0 rounded-lg px-2 py-1 overflow-hidden text-left hover:opacity-90 transition-opacity shadow-sm z-10"
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
