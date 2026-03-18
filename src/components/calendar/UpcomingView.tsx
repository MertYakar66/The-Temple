import { useMemo } from 'react';
import { format, parseISO, addDays, startOfDay, isSameDay, isToday } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';
import { getEventsInRange, formatEventTime } from '../../utils/calendar';

interface UpcomingViewProps {
  onSelectEvent: (eventId: string) => void;
}

export function UpcomingView({ onSelectEvent }: UpcomingViewProps) {
  const events = useCalendarStore((s) => s.events);
  const calendars = useCalendarStore((s) => s.calendars);
  const settings = useCalendarStore((s) => s.settings);
  const visibleIds = useCalendarStore((s) => s.getVisibleCalendarIds());

  const calMap = useMemo(() => {
    const m = new Map<string, typeof calendars[0]>();
    calendars.forEach((c) => m.set(c.id, c));
    return m;
  }, [calendars]);

  // Get next 90 days of events grouped by date
  const grouped = useMemo(() => {
    const today = startOfDay(new Date());
    const end = addDays(today, 90);
    const rangeEvents = getEventsInRange(events, today, end, visibleIds);

    const groups: { date: Date; events: typeof rangeEvents }[] = [];
    let currentDate: Date | null = null;
    let currentGroup: typeof rangeEvents = [];

    for (const ev of rangeEvents) {
      const evDate = startOfDay(parseISO(ev.startDate));
      if (!currentDate || !isSameDay(currentDate, evDate)) {
        if (currentDate && currentGroup.length > 0) {
          groups.push({ date: currentDate, events: currentGroup });
        }
        currentDate = evDate;
        currentGroup = [ev];
      } else {
        currentGroup.push(ev);
      }
    }
    if (currentDate && currentGroup.length > 0) {
      groups.push({ date: currentDate, events: currentGroup });
    }

    return groups;
  }, [events, visibleIds]);

  if (grouped.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming events</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Events for the next 90 days will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {grouped.map((group) => {
        const today = isToday(group.date);
        return (
          <div key={group.date.toISOString()}>
            {/* Date header */}
            <div className={`sticky top-0 z-10 px-4 py-2 border-b border-gray-100 dark:border-gray-700/50 ${
              today
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'bg-gray-50 dark:bg-gray-850'
            }`}>
              <p className={`text-sm font-semibold ${
                today ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
              }`}>
                {today ? 'Today' : format(group.date, 'EEEE, MMMM d')}
              </p>
            </div>

            {/* Events */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {group.events.map((ev) => {
                const cal = calMap.get(ev.calendarId);
                const color = cal?.color || '#3B82F6';
                return (
                  <button
                    key={ev.id}
                    onClick={() => onSelectEvent(ev.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-3"
                  >
                    <div
                      className="w-1 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: color, height: '2rem' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{ev.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ev.isAllDay
                          ? 'All day'
                          : `${formatEventTime(ev.startDate, settings.use24HourTime)} – ${formatEventTime(ev.endDate, settings.use24HourTime)}`
                        }
                      </p>
                      {ev.location && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{ev.location}</p>
                      )}
                    </div>
                    {cal && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{cal.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
