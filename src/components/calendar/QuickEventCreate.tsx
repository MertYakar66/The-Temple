import { useState, useRef, useEffect } from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { X } from 'lucide-react';
import { useCalendarStore } from '../../store/useCalendarStore';

interface QuickEventCreateProps {
  date: Date;
  startHour?: number;
  endHour?: number;
  startMinute?: number;
  endMinute?: number;
  position?: { top: number; left: number };
  onCreated: (eventId: string) => void;
  onFullEditor: (date: Date, startHour?: number, endHour?: number) => void;
  onClose: () => void;
}

export function QuickEventCreate({
  date,
  startHour,
  endHour,
  startMinute = 0,
  endMinute = 0,
  position,
  onCreated,
  onFullEditor,
  onClose,
}: QuickEventCreateProps) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const settings = useCalendarStore((s) => s.settings);

  useEffect(() => {
    // Focus immediately
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const sh = startHour ?? new Date().getHours();
  const eh = endHour ?? sh + 1;
  const startDate = setMinutes(setHours(new Date(date), sh), startMinute);
  const endDate = setMinutes(setHours(new Date(date), eh), endMinute);

  const timeLabel = settings.use24HourTime
    ? `${format(startDate, 'HH:mm')} – ${format(endDate, 'HH:mm')}`
    : `${format(startDate, 'h:mm a')} – ${format(endDate, 'h:mm a')}`;

  const handleSubmit = () => {
    const t = title.trim() || 'New Event';
    const id = addEvent({
      calendarId: settings.defaultCalendarId,
      title: t,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isAllDay: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alerts: settings.defaultAlertMinutes > 0
        ? [{ id: 'default', amount: settings.defaultAlertMinutes, unit: 'minutes' as const }]
        : [],
      attendees: [],
      availabilityStatus: 'busy' as const,
    });
    onCreated(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
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
        <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(date, 'EEE, MMM d')} &middot; {timeLabel}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Event title"
            className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 border-b-2 border-primary-500 pb-1 mb-3"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => onFullEditor(date, sh, eh)}
              className="flex-1 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
            >
              More Options
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
