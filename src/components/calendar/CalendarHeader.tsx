import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Search, Calendar as CalendarIcon, Inbox, Settings } from 'lucide-react';
import { useCalendarStore } from '../../store/useCalendarStore';
import type { CalendarViewType } from '../../types/calendar';

interface CalendarHeaderProps {
  onAddEvent: () => void;
  onSearch: () => void;
  onManageCalendars: () => void;
  onSettings: () => void;
  onInbox: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const VIEW_LABELS: Record<CalendarViewType, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  upcoming: 'List',
};

export function CalendarHeader({
  onAddEvent,
  onSearch,
  onManageCalendars,
  onSettings,
  onInbox,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  const currentView = useCalendarStore((s) => s.currentView);
  const setCurrentView = useCalendarStore((s) => s.setCurrentView);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const unreadCount = useCalendarStore((s) => s.getUnreadInvitationCount());

  const date = parseISO(selectedDate);

  const getTitle = () => {
    switch (currentView) {
      case 'day':
        return format(date, 'EEE, MMM d, yyyy');
      case 'week':
        return format(date, 'MMM yyyy');
      case 'month':
        return format(date, 'MMMM yyyy');
      case 'upcoming':
        return 'Upcoming';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 pt-3 pb-2">
      {/* Top row: actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={onManageCalendars}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <CalendarIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onInbox}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
          >
            <Inbox className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={onSettings}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onSearch}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={onAddEvent}
            className="p-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Title row with nav */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white min-w-0">{getTitle()}</h1>
          <button onClick={onNext} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onToday}
          className="text-sm font-medium text-primary-600 dark:text-primary-400 px-3 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
        >
          Today
        </button>
      </div>

      {/* View selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
        {(['month', 'week', 'day', 'upcoming'] as CalendarViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentView === view
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {VIEW_LABELS[view]}
          </button>
        ))}
      </div>
    </div>
  );
}
