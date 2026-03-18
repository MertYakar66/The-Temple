import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO, addMinutes } from 'date-fns';
import {
  ChevronLeft,
  Trash2,
  MapPin,
  Video,
  FileText,
  Bell,
  Repeat,
  Clock,
  Globe,
  Car,
} from 'lucide-react';
import { useCalendarStore } from '../store/useCalendarStore';
import type {
  CalendarEvent,
  CalendarAlert,
  RecurrenceFrequency,
  RecurrenceRule,
} from '../types/calendar';
import { v4 as uuidv4 } from 'uuid';

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceFrequency | 'none' | 'custom' }[] = [
  { label: 'Never', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const ALERT_OPTIONS = [
  { label: 'None', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
];

export function CalendarEventEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const prefillDate = searchParams.get('date');
  const prefillHour = searchParams.get('hour');

  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const deleteEventSeries = useCalendarStore((s) => s.deleteEventSeries);
  const getEvent = useCalendarStore((s) => s.getEvent);
  const calendars = useCalendarStore((s) => s.calendars);
  const settings = useCalendarStore((s) => s.settings);

  const editableCalendars = calendars.filter((c) => !c.isReadOnly);
  const isEditing = !!eventId;
  const existingEvent = isEditing ? getEvent(eventId) : null;

  // Compute default start/end
  const defaultStart = useMemo(() => {
    if (existingEvent) return existingEvent.startDate;
    const d = prefillDate ? parseISO(prefillDate) : new Date();
    if (prefillHour) {
      d.setHours(parseInt(prefillHour), 0, 0, 0);
    } else {
      d.setHours(d.getHours() + 1, 0, 0, 0);
    }
    return d.toISOString();
  }, [existingEvent, prefillDate, prefillHour]);

  const defaultEnd = useMemo(() => {
    if (existingEvent) return existingEvent.endDate;
    return addMinutes(parseISO(defaultStart), settings.defaultEventDuration).toISOString();
  }, [existingEvent, defaultStart, settings.defaultEventDuration]);

  // Form state
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [startDate, setStartDate] = useState(format(parseISO(defaultStart), "yyyy-MM-dd'T'HH:mm"));
  const [endDate, setEndDate] = useState(format(parseISO(defaultEnd), "yyyy-MM-dd'T'HH:mm"));
  const [isAllDay, setIsAllDay] = useState(existingEvent?.isAllDay || false);
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [videoCallUrl, setVideoCallUrl] = useState(existingEvent?.videoCallUrl || '');
  const [notes, setNotes] = useState(existingEvent?.notes || '');
  const [calendarId, setCalendarId] = useState(
    existingEvent?.calendarId || settings.defaultCalendarId || editableCalendars[0]?.id || ''
  );
  const [alertMinutes, setAlertMinutes] = useState(
    existingEvent?.alerts?.[0]
      ? existingEvent.alerts[0].unit === 'hours'
        ? existingEvent.alerts[0].amount * 60
        : existingEvent.alerts[0].unit === 'days'
        ? existingEvent.alerts[0].amount * 1440
        : existingEvent.alerts[0].amount
      : settings.defaultAlertMinutes
  );
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | 'none'>(
    existingEvent?.recurrenceRule?.frequency || 'none'
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    existingEvent?.recurrenceRule?.interval || 1
  );
  const [travelTime, setTravelTime] = useState(existingEvent?.travelTime || 0);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'on_date' | 'after_count'>(
    existingEvent?.recurrenceRule?.endType || 'never'
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    existingEvent?.recurrenceRule?.endDate ? format(parseISO(existingEvent.recurrenceRule.endDate), 'yyyy-MM-dd') : ''
  );
  const [recurrenceEndCount, setRecurrenceEndCount] = useState(
    existingEvent?.recurrenceRule?.endCount || 10
  );
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>(
    existingEvent?.recurrenceRule?.daysOfWeek || []
  );
  const [availability, setAvailability] = useState(existingEvent?.availabilityStatus || 'busy');
  const [showDelete, setShowDelete] = useState(false);

  const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const TRAVEL_OPTIONS = [
    { label: 'None', value: 0 },
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
  ];

  const toggleWeekday = (day: number) => {
    setRecurrenceDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  // For recurring events, ask scope
  const isRecurring = existingEvent?.recurrenceRule || existingEvent?.seriesMasterId;

  const handleSave = () => {
    if (!title.trim()) return;

    const alerts: CalendarAlert[] = alertMinutes > 0
      ? [{ id: uuidv4(), amount: alertMinutes, unit: 'minutes' }]
      : [];

    const recurrenceRule: RecurrenceRule | undefined =
      recurrence !== 'none'
        ? {
            frequency: recurrence,
            interval: recurrenceInterval,
            daysOfWeek: recurrence === 'weekly' && recurrenceDaysOfWeek.length > 0 ? recurrenceDaysOfWeek : undefined,
            endType: recurrenceEndType,
            endDate: recurrenceEndType === 'on_date' && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
            endCount: recurrenceEndType === 'after_count' ? recurrenceEndCount : undefined,
          }
        : undefined;

    const tz = settings.timeZoneOverride || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const eventData = {
      calendarId,
      title: title.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isAllDay,
      location: location.trim() || undefined,
      videoCallUrl: videoCallUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      timezone: existingEvent?.timezone || tz,
      alerts,
      recurrenceRule,
      attendees: existingEvent?.attendees || [],
      organizer: existingEvent?.organizer,
      availabilityStatus: availability as CalendarEvent['availabilityStatus'],
      travelTime: travelTime > 0 ? travelTime : undefined,
    };

    if (isEditing && eventId) {
      updateEvent(eventId, eventData);
    } else {
      addEvent(eventData);
    }

    navigate(-1);
  };

  const handleDelete = () => {
    if (!eventId) return;
    if (isRecurring) {
      setShowDelete(true);
    } else {
      if (window.confirm('Delete this event?')) {
        deleteEvent(eventId);
        navigate(-1);
      }
    }
  };

  const handleDeleteConfirm = (deleteAll: boolean) => {
    if (!eventId) return;
    if (deleteAll) {
      deleteEventSeries(existingEvent?.seriesMasterId || eventId);
    } else {
      deleteEvent(eventId);
    }
    setShowDelete(false);
    navigate(-1);
  };

  const selectedCal = calendars.find((c) => c.id === calendarId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-300"
        >
          <ChevronLeft className="w-5 h-5" />
          Cancel
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Event' : 'New Event'}
        </h1>
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className="text-primary-600 dark:text-primary-400 font-semibold disabled:opacity-40"
        >
          {isEditing ? 'Save' : 'Add'}
        </button>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Title */}
        <div className="bg-white dark:bg-gray-800 mt-4 mx-4 rounded-xl overflow-hidden">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full px-4 py-3.5 text-lg bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
            autoFocus
          />
        </div>

        {/* Date/Time */}
        <div className="bg-white dark:bg-gray-800 mt-3 mx-4 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
          {/* All-day toggle */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-900 dark:text-white">All-day</span>
            <button
              onClick={() => setIsAllDay(!isAllDay)}
              className={`w-11 h-6 rounded-full transition-colors ${
                isAllDay ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isAllDay ? 'translate-x-5.5 ml-[1.375rem]' : 'translate-x-0.5 ml-0.5'
              }`} />
            </button>
          </div>

          {/* Start */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Starts</label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                value={isAllDay ? startDate.split('T')[0] : startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* End */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Ends</label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                value={isAllDay ? endDate.split('T')[0] : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Calendar selector */}
        <div className="bg-white dark:bg-gray-800 mt-3 mx-4 rounded-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedCal?.color || '#3B82F6' }}
            />
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Calendar</label>
              <select
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none"
              >
                {editableCalendars.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location & Video */}
        <div className="bg-white dark:bg-gray-800 mt-3 mx-4 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center gap-3 px-4 py-3">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="url"
              value={videoCallUrl}
              onChange={(e) => setVideoCallUrl(e.target.value)}
              placeholder="Add video call link"
              className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Alert */}
        <div className="bg-white dark:bg-gray-800 mt-3 mx-4 rounded-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <Bell className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Alert</label>
              <select
                value={alertMinutes}
                onChange={(e) => setAlertMinutes(Number(e.target.value))}
                className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none"
              >
                {ALERT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Recurrence */}
        <div className="bg-white dark:bg-gray-800 mt-3 mx-4 rounded-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <Repeat className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Repeat</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceFrequency | 'none')}
                className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {recurrence !== 'none' && (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Every</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-sm bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white outline-none text-center"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {recurrence === 'daily' ? 'day(s)' : recurrence === 'weekly' ? 'week(s)' : recurrence === 'monthly' ? 'month(s)' : 'year(s)'}
                </span>
              </div>

              {/* Weekly day selection */}
              {recurrence === 'weekly' && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">On days</p>
                  <div className="flex gap-1.5">
                    {WEEKDAY_LABELS.map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleWeekday(idx)}
                        className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                          recurrenceDaysOfWeek.includes(idx)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recurrence end */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <label className="text-xs text-gray-500 dark:text-gray-400">Ends</label>
                <select
                  value={recurrenceEndType}
                  onChange={(e) => setRecurrenceEndType(e.target.value as 'never' | 'on_date' | 'after_count')}
                  className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none mt-1"
                >
                  <option value="never">Never</option>
                  <option value="on_date">On date</option>
                  <option value="after_count">After occurrences</option>
                </select>
              </div>
              {recurrenceEndType === 'on_date' && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none"
                  />
                </div>
              )}
              {recurrenceEndType === 'after_count' && (
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={recurrenceEndCount}
                    onChange={(e) => setRecurrenceEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-sm bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white outline-none text-center"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">occurrences</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Travel Time */}
        <div className="bg-white dark:bg-gray-800 mt-3 mx-4 rounded-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Travel Time</label>
              <select
                value={travelTime}
                onChange={(e) => setTravelTime(Number(e.target.value))}
                className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none"
              >
                {TRAVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white dark:bg-gray-800 mt-3 mx-4 rounded-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Show as</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as CalendarEvent['availabilityStatus'])}
                className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none"
              >
                <option value="busy">Busy</option>
                <option value="free">Free</option>
                <option value="tentative">Tentative</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 mt-3 mx-4 rounded-xl">
          <div className="flex items-start gap-3 px-4 py-3">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes"
              rows={3}
              className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none resize-none"
            />
          </div>
        </div>

        {/* Delete button */}
        {isEditing && (
          <div className="mx-4 mt-6 mb-8">
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Event
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="h-8" />
      </div>

      {/* Delete recurring event modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowDelete(false)}>
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-sm sm:rounded-xl rounded-t-xl p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white text-center mb-4">Delete Recurring Event</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleDeleteConfirm(false)}
                className="w-full py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                This Event Only
              </button>
              <button
                onClick={() => handleDeleteConfirm(true)}
                className="w-full py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                All Events in Series
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="w-full py-3 rounded-lg text-gray-500 dark:text-gray-400 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
