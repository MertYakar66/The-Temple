import { parseISO, format } from 'date-fns';
import type { CalendarEvent, CalendarContainer } from '../../types/calendar';

interface EventChipProps {
  event: CalendarEvent;
  calendar?: CalendarContainer;
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function EventChip({ event, calendar, compact = false, onClick }: EventChipProps) {
  const color = calendar?.color || '#3B82F6';

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-1 text-left px-1 py-0.5 rounded text-xs truncate hover:opacity-80 transition-opacity"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="truncate font-medium">{event.title}</span>
      </button>
    );
  }

  const startTime = event.isAllDay
    ? 'All day'
    : format(parseISO(event.startDate), 'h:mm a');

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
      style={{ backgroundColor: `${color}15`, borderLeft: `3px solid ${color}` }}
    >
      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{event.title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{startTime}</p>
      {event.location && (
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{event.location}</p>
      )}
    </button>
  );
}
