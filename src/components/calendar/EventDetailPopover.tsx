import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { MapPin, Edit2, Trash2, X, Clock } from 'lucide-react';
import { useCalendarStore } from '../../store/useCalendarStore';

interface EventDetailPopoverProps {
  eventId: string;
  position?: { top: number; left: number };
  onEdit: (eventId: string) => void;
  onClose: () => void;
}

export function EventDetailPopover({ eventId, position, onEdit, onClose }: EventDetailPopoverProps) {
  const events = useCalendarStore((s) => s.events);
  const calendars = useCalendarStore((s) => s.calendars);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const settings = useCalendarStore((s) => s.settings);

  const event = events.find((e) => e.id === eventId && !e.isDeleted);
  const calendar = useMemo(
    () => calendars.find((c) => c.id === event?.calendarId),
    [calendars, event?.calendarId]
  );

  if (!event) return null;

  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);
  const color = calendar?.color || '#3B82F6';
  const timeFormat = settings.use24HourTime ? 'HH:mm' : 'h:mm a';

  const handleDelete = () => {
    if (window.confirm(`Delete "${event.title}"?`)) {
      deleteEvent(eventId);
      onClose();
    }
  };

  const style: React.CSSProperties = position
    ? { position: 'absolute', top: position.top, left: position.left, zIndex: 50 }
    : {};

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        style={style}
        className={`${position ? '' : 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'} z-50 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden`}
      >
        {/* Color bar */}
        <div className="h-1" style={{ backgroundColor: color }} />

        <div className="p-3">
          {/* Title + close */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight flex-1">
              {event.title}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {event.isAllDay
                ? format(start, 'EEE, MMM d') + ' – All day'
                : `${format(start, 'EEE, MMM d')} · ${format(start, timeFormat)} – ${format(end, timeFormat)}`}
            </span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Calendar name */}
          {calendar && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span>{calendar.name}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => onEdit(eventId)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
