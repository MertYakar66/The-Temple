import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useCalendarStore } from '../store/useCalendarStore';

const COMMON_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver',
  'America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'America/Mexico_City',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
  'Europe/Amsterdam', 'Europe/Moscow', 'Europe/Istanbul',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Tokyo',
  'Asia/Seoul', 'Asia/Singapore', 'Asia/Hong_Kong',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
  'Pacific/Auckland', 'Africa/Cairo', 'Africa/Johannesburg',
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DURATIONS = [15, 30, 45, 60, 90, 120];
const ALERT_OPTIONS = [
  { label: 'None', value: 0 },
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

export function CalendarSettings() {
  const navigate = useNavigate();
  const settings = useCalendarStore((s) => s.settings);
  const calendars = useCalendarStore((s) => s.calendars);
  const updateSettings = useCalendarStore((s) => s.updateSettings);

  const editableCalendars = calendars.filter((c) => !c.isReadOnly);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 dark:text-gray-300">
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-white ml-3">Calendar Settings</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Default Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
          <div className="px-4 py-3">
            <label className="text-xs text-gray-500 dark:text-gray-400">Default Calendar</label>
            <select
              value={settings.defaultCalendarId}
              onChange={(e) => updateSettings({ defaultCalendarId: e.target.value })}
              className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none mt-1"
            >
              {editableCalendars.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Event Defaults */}
        <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Event Defaults</p>
          </div>
          <div className="px-4 py-3">
            <label className="text-xs text-gray-500 dark:text-gray-400">Default Duration</label>
            <select
              value={settings.defaultEventDuration}
              onChange={(e) => updateSettings({ defaultEventDuration: Number(e.target.value) })}
              className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none mt-1"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d} minutes</option>
              ))}
            </select>
          </div>
          <div className="px-4 py-3">
            <label className="text-xs text-gray-500 dark:text-gray-400">Default Alert</label>
            <select
              value={settings.defaultAlertMinutes}
              onChange={(e) => updateSettings({ defaultAlertMinutes: Number(e.target.value) })}
              className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none mt-1"
            >
              {ALERT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="px-4 py-3">
            <label className="text-xs text-gray-500 dark:text-gray-400">All-Day Event Alert</label>
            <select
              value={settings.defaultAllDayAlertMinutes}
              onChange={(e) => updateSettings({ defaultAllDayAlertMinutes: Number(e.target.value) })}
              className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none mt-1"
            >
              <option value={0}>None</option>
              <option value={540}>9 AM day of event</option>
              <option value={1440}>1 day before</option>
              <option value={2880}>2 days before</option>
            </select>
          </div>
        </div>

        {/* Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Display</p>
          </div>
          <div className="px-4 py-3">
            <label className="text-xs text-gray-500 dark:text-gray-400">Start Week On</label>
            <select
              value={settings.startOfWeek}
              onChange={(e) => updateSettings({ startOfWeek: Number(e.target.value) })}
              className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none mt-1"
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>

          {/* 24-hour time */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-900 dark:text-white">24-Hour Time</span>
            <button
              onClick={() => updateSettings({ use24HourTime: !settings.use24HourTime })}
              className={`w-11 h-6 rounded-full transition-colors ${
                settings.use24HourTime ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.use24HourTime ? 'ml-[1.375rem]' : 'ml-0.5'
              }`} />
            </button>
          </div>

          {/* Week numbers */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-900 dark:text-white">Show Week Numbers</span>
            <button
              onClick={() => updateSettings({ showWeekNumbers: !settings.showWeekNumbers })}
              className={`w-11 h-6 rounded-full transition-colors ${
                settings.showWeekNumbers ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.showWeekNumbers ? 'ml-[1.375rem]' : 'ml-0.5'
              }`} />
            </button>
          </div>

          {/* Week view starts today */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-900 dark:text-white">Week View Starts Today</span>
            <button
              onClick={() => updateSettings({ weekViewStartsToday: !settings.weekViewStartsToday })}
              className={`w-11 h-6 rounded-full transition-colors ${
                settings.weekViewStartsToday ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.weekViewStartsToday ? 'ml-[1.375rem]' : 'ml-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Time Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Time Zone</p>
          </div>
          <div className="px-4 py-3">
            <label className="text-xs text-gray-500 dark:text-gray-400">Time Zone Override</label>
            <select
              value={settings.timeZoneOverride || ''}
              onChange={(e) => updateSettings({ timeZoneOverride: e.target.value || undefined })}
              className="w-full text-sm bg-transparent text-gray-900 dark:text-white outline-none mt-1"
            >
              <option value="">Device Default ({Intl.DateTimeFormat().resolvedOptions().timeZone})</option>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
