import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { format, parseISO, isSameDay, isToday, differenceInMinutes, setHours as setDateHours, setMinutes as setDateMinutes, setSeconds as setDateSeconds } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';
import { getWeekDates, getEventsForDate, formatEventTime } from '../../utils/calendar';

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface WeekViewProps {
  onSelectEvent: (eventId: string, rect: DOMRect) => void;
  onSelectDate: (date: Date) => void;
  onQuickCreate: (date: Date, startHour: number, endHour: number, startMin: number, endMin: number, rect: DOMRect) => void;
  onCreateEvent: (date: Date, hour?: number) => void;
}

function snapToQuarter(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

export function WeekView({ onSelectEvent, onSelectDate, onQuickCreate }: WeekViewProps) {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const events = useCalendarStore((s) => s.events);
  const calendars = useCalendarStore((s) => s.calendars);
  const settings = useCalendarStore((s) => s.settings);
  const scrollRef = useRef<HTMLDivElement>(null);

  const date = parseISO(selectedDate);
  const weekStartsOn = settings.startOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const visibleIds = useMemo(
    () => new Set(calendars.filter((c) => c.isVisible).map((c) => c.id)),
    [calendars]
  );
  const weekDates = useMemo(() => getWeekDates(date, weekStartsOn), [date, weekStartsOn]);

  const calMap = useMemo(() => {
    const m = new Map<string, typeof calendars[0]>();
    calendars.forEach((c) => m.set(c.id, c));
    return m;
  }, [calendars]);

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

  // Drag-to-create state
  const [dragging, setDragging] = useState(false);
  const [dragColIdx, setDragColIdx] = useState(-1);
  const [dragStart, setDragStart] = useState(0);
  const [dragEnd, setDragEnd] = useState(0);
  const dragActiveRef = useRef(false);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getMinutesFromY = useCallback((clientY: number, colEl: HTMLElement | null) => {
    if (!colEl || !scrollRef.current) return 0;
    const rect = colEl.getBoundingClientRect();
    const scrollTop = scrollRef.current.scrollTop;
    const y = clientY - rect.top + scrollTop;
    const minutes = (y / (24 * HOUR_HEIGHT)) * 1440;
    return Math.max(0, Math.min(1440, snapToQuarter(minutes)));
  }, []);

  const handleColPointerDown = useCallback((e: React.PointerEvent, colIdx: number) => {
    if ((e.target as HTMLElement).closest('[data-event]')) return;
    const mins = getMinutesFromY(e.clientY, colRefs.current[colIdx]);
    setDragColIdx(colIdx);
    setDragStart(mins);
    setDragEnd(mins + 30);
    setDragging(true);
    dragActiveRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [getMinutesFromY]);

  const handleColPointerMove = useCallback((e: React.PointerEvent, colIdx: number) => {
    if (!dragActiveRef.current || colIdx !== dragColIdx) return;
    const mins = getMinutesFromY(e.clientY, colRefs.current[colIdx]);
    setDragEnd(mins);
  }, [getMinutesFromY, dragColIdx]);

  const handleColPointerUp = useCallback((e: React.PointerEvent, colIdx: number) => {
    if (!dragActiveRef.current || colIdx !== dragColIdx) return;
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

    const colEl = colRefs.current[colIdx];
    if (colEl) {
      const rect = colEl.getBoundingClientRect();
      const popoverRect = new DOMRect(rect.left, Math.min(rect.top + 40, window.innerHeight - 200), rect.width, 0);
      onQuickCreate(weekDates[colIdx], sh, eh, sm, em, popoverRect);
    }
  }, [dragStart, dragEnd, dragColIdx, weekDates, onQuickCreate]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div />
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
                    data-event
                    onClick={(e) => onSelectEvent(ev.id, (e.target as HTMLElement).getBoundingClientRect())}
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
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/30 pointer-events-none"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              <span className="absolute left-0 text-[10px] text-gray-400 dark:text-gray-500 w-12 text-right pr-1 -mt-2">
                {format(setDateSeconds(setDateMinutes(setDateHours(new Date(), hour), 0), 0), settings.use24HourTime ? 'HH:mm' : 'h a')}
              </span>
            </div>
          ))}

          {/* Day columns */}
          {dayEventsList.map((dayData, colIdx) => {
            const isCurrentDay = isToday(dayData.date);
            const isDragCol = dragging && colIdx === dragColIdx;
            const dTop = (Math.min(dragStart, dragEnd) / 60) * HOUR_HEIGHT;
            const dHeight = Math.max((Math.abs(dragEnd - dragStart) / 60) * HOUR_HEIGHT, 12);

            return (
              <div
                key={colIdx}
                ref={(el) => { colRefs.current[colIdx] = el; }}
                className="relative border-l border-gray-100 dark:border-gray-700/50 select-none"
                style={{ gridColumn: colIdx + 2 }}
                onPointerDown={(e) => handleColPointerDown(e, colIdx)}
                onPointerMove={(e) => handleColPointerMove(e, colIdx)}
                onPointerUp={(e) => handleColPointerUp(e, colIdx)}
              >
                {/* Drag preview */}
                {isDragCol && (
                  <div
                    className="absolute left-0.5 right-0.5 rounded border-2 border-dashed border-primary-400 bg-primary-100/50 dark:bg-primary-900/30 z-30 pointer-events-none"
                    style={{ top: dTop, height: dHeight }}
                  />
                )}

                {/* Current time line */}
                {isCurrentDay && (
                  <div
                    className="absolute left-0 right-0 z-20 h-0.5 bg-red-500 pointer-events-none"
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
                      data-event
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev.id, (e.currentTarget as HTMLElement).getBoundingClientRect());
                      }}
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
