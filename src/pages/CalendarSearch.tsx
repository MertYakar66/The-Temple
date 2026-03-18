import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCalendarStore } from '../store/useCalendarStore';
import { searchEvents, formatEventTime } from '../utils/calendar';

export function CalendarSearch() {
  const navigate = useNavigate();
  const events = useCalendarStore((s) => s.events);
  const calendars = useCalendarStore((s) => s.calendars);
  const settings = useCalendarStore((s) => s.settings);
  const [query, setQuery] = useState('');

  const calMap = useMemo(() => {
    const m = new Map<string, typeof calendars[0]>();
    calendars.forEach((c) => m.set(c.id, c));
    return m;
  }, [calendars]);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return searchEvents(events, query).sort(
      (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    );
  }, [events, query]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events..."
              className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white outline-none placeholder-gray-400"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {query.length < 2 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Search by title, location, notes, or attendees</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No events found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {results.map((ev) => {
              const cal = calMap.get(ev.calendarId);
              const color = cal?.color || '#3B82F6';
              const start = parseISO(ev.startDate);

              return (
                <button
                  key={ev.id}
                  onClick={() => navigate(`/calendar/event?id=${ev.id}`)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-3"
                >
                  <div
                    className="w-1 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: color, height: '2rem' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{highlightMatch(ev.title, query)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(start, 'MMM d, yyyy')} &middot;{' '}
                      {ev.isAllDay ? 'All day' : formatEventTime(ev.startDate, settings.use24HourTime)}
                    </p>
                    {ev.location && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{ev.location}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-yellow-200 dark:bg-yellow-800 rounded">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
