import { useMemo } from 'react';
import { format, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';
import { getMonthGridDates, getWeekdayHeaders, getEventsForDate } from '../../utils/calendar';
import { EventChip } from './EventChip';

interface MonthViewProps {
  onSelectDate: (date: Date) => void;
  onSelectEvent: (eventId: string, rect: DOMRect) => void;
  onQuickCreate: (date: Date, rect: DOMRect) => void;
}

export function MonthView({ onSelectDate, onSelectEvent, onQuickCreate }: MonthViewProps) {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const events = useCalendarStore((s) => s.events);
  const calendars = useCalendarStore((s) => s.calendars);
  const settings = useCalendarStore((s) => s.settings);

  const date = parseISO(selectedDate);
  const weekStartsOn = settings.startOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const visibleIds = useMemo(
    () => new Set(calendars.filter((c) => c.isVisible).map((c) => c.id)),
    [calendars]
  );

  const gridDates = useMemo(
    () => getMonthGridDates(date.getFullYear(), date.getMonth(), weekStartsOn),
    [date.getFullYear(), date.getMonth(), weekStartsOn]
  );

  const weekHeaders = useMemo(() => getWeekdayHeaders(weekStartsOn), [weekStartsOn]);

  const calMap = useMemo(() => {
    const m = new Map<string, typeof calendars[0]>();
    calendars.forEach((c) => m.set(c.id, c));
    return m;
  }, [calendars]);

  const handleDayClick = (d: Date, e: React.MouseEvent) => {
    const isAlreadySelected = isSameDay(d, date);
    if (isAlreadySelected) {
      // Second tap on selected date → open quick create
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      onQuickCreate(d, new DOMRect(rect.left, rect.bottom, rect.width, 0));
    } else {
      onSelectDate(d);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {weekHeaders.map((day) => (
          <div key={day} className="text-center py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {gridDates.map((d, idx) => {
          const isCurrentMonth = isSameMonth(d, date);
          const isSelected = isSameDay(d, date);
          const isCurrentDay = isToday(d);
          const dayEvents = getEventsForDate(events, d, visibleIds);

          return (
            <div
              key={idx}
              onClick={(e) => handleDayClick(d, e)}
              className={`relative border-b border-r border-gray-100 dark:border-gray-700/50 p-1 text-left flex flex-col min-h-[4.5rem] transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 ${
                isCurrentMonth
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-850'
              } ${isSelected ? 'ring-2 ring-inset ring-primary-500' : ''}`}
            >
              <span
                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mx-auto mb-0.5 ${
                  isCurrentDay
                    ? 'bg-primary-600 text-white'
                    : isCurrentMonth
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {format(d, 'd')}
              </span>

              <div className="space-y-0.5 overflow-hidden flex-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <EventChip
                    key={ev.id}
                    event={ev}
                    calendar={calMap.get(ev.calendarId)}
                    compact
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      onSelectEvent(ev.id, (clickEvent.currentTarget as HTMLElement).getBoundingClientRect());
                    }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
