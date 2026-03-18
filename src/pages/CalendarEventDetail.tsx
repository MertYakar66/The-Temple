import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft,
  Edit2,
  MapPin,
  Video,
  Clock,
  Bell,
  Repeat,
  FileText,
  Calendar as CalendarIcon,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useCalendarStore } from '../store/useCalendarStore';
import { formatEventTime } from '../utils/calendar';

export function CalendarEventDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');

  const getEvent = useCalendarStore((s) => s.getEvent);
  const calendars = useCalendarStore((s) => s.calendars);
  const settings = useCalendarStore((s) => s.settings);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);

  const event = eventId ? getEvent(eventId) : null;
  const calendar = event ? calendars.find((c) => c.id === event.calendarId) : null;

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Event not found</p>
      </div>
    );
  }

  const color = calendar?.color || '#3B82F6';
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const handleEdit = () => {
    navigate(`/calendar/event/edit?id=${event.id}`);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this event?')) {
      deleteEvent(event.id);
      navigate(-1);
    }
  };

  const recurrenceLabel = event.recurrenceRule
    ? `Every ${event.recurrenceRule.interval > 1 ? event.recurrenceRule.interval + ' ' : ''}${event.recurrenceRule.frequency}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div
        className="px-4 pt-4 pb-6"
        style={{ backgroundColor: `${color}15` }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleEdit}
              className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
            {calendar && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{calendar.name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2 space-y-3">
        {/* Date & Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              {event.isAllDay ? (
                <p className="text-sm text-gray-900 dark:text-white">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                  {format(startDate, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd') &&
                    ` – ${format(endDate, 'EEEE, MMMM d, yyyy')}`}
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {format(startDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatEventTime(event.startDate, settings.use24HourTime)} – {formatEventTime(event.endDate, settings.use24HourTime)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-900 dark:text-white">{event.location}</p>
            </div>
          </div>
        )}

        {/* Video call */}
        {event.videoCallUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-gray-400" />
              <a
                href={event.videoCallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                Join Video Call <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Recurrence */}
        {recurrenceLabel && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Repeat className="w-5 h-5 text-gray-400" />
              <p className="text-sm text-gray-900 dark:text-white capitalize">{recurrenceLabel}</p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {event.alerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                {event.alerts.map((alert) => (
                  <p key={alert.id} className="text-sm text-gray-900 dark:text-white">
                    {alert.amount} {alert.unit} before
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{event.notes}</p>
            </div>
          </div>
        )}

        {/* Attendees */}
        {event.attendees.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="space-y-2">
                {event.attendees.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {a.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
