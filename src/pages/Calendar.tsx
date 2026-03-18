import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { parseISO } from 'date-fns';
import { useCalendarStore } from '../store/useCalendarStore';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { DayView } from '../components/calendar/DayView';
import { UpcomingView } from '../components/calendar/UpcomingView';

export function Calendar() {
  const navigate = useNavigate();
  const currentView = useCalendarStore((s) => s.currentView);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const setCurrentView = useCalendarStore((s) => s.setCurrentView);

  const date = parseISO(selectedDate);

  const handlePrev = useCallback(() => {
    const d = parseISO(selectedDate);
    switch (currentView) {
      case 'day':
        setSelectedDate(subDays(d, 1).toISOString());
        break;
      case 'week':
        setSelectedDate(subWeeks(d, 1).toISOString());
        break;
      case 'month':
        setSelectedDate(subMonths(d, 1).toISOString());
        break;
      case 'upcoming':
        // Scroll back by a week in upcoming view
        setSelectedDate(subWeeks(d, 1).toISOString());
        break;
    }
  }, [currentView, selectedDate, setSelectedDate]);

  const handleNext = useCallback(() => {
    const d = parseISO(selectedDate);
    switch (currentView) {
      case 'day':
        setSelectedDate(addDays(d, 1).toISOString());
        break;
      case 'week':
        setSelectedDate(addWeeks(d, 1).toISOString());
        break;
      case 'month':
        setSelectedDate(addMonths(d, 1).toISOString());
        break;
      case 'upcoming':
        setSelectedDate(addWeeks(d, 1).toISOString());
        break;
    }
  }, [currentView, selectedDate, setSelectedDate]);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date().toISOString());
  }, [setSelectedDate]);

  const handleSelectDate = useCallback((d: Date) => {
    setSelectedDate(d.toISOString());
    // Tapping a day in month view drills into day view
    if (currentView === 'month') {
      setCurrentView('day');
    }
  }, [setSelectedDate, currentView, setCurrentView]);

  const handleSelectEvent = useCallback((eventId: string) => {
    navigate(`/calendar/event?id=${eventId}`);
  }, [navigate]);

  const handleCreateEvent = useCallback((d: Date, hour?: number) => {
    const params = new URLSearchParams();
    params.set('date', d.toISOString());
    if (hour !== undefined) params.set('hour', String(hour));
    navigate(`/calendar/event/edit?${params.toString()}`);
  }, [navigate]);

  const handleAddEvent = useCallback(() => {
    handleCreateEvent(date);
  }, [handleCreateEvent, date]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <CalendarHeader
        onAddEvent={handleAddEvent}
        onSearch={() => navigate('/calendar/search')}
        onManageCalendars={() => navigate('/calendar/manage')}
        onSettings={() => navigate('/calendar/settings')}
        onInbox={() => navigate('/calendar/invitations')}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      {currentView === 'month' && (
        <MonthView
          onSelectDate={handleSelectDate}
          onSelectEvent={handleSelectEvent}
          onCreateEvent={handleCreateEvent}
        />
      )}

      {currentView === 'week' && (
        <WeekView
          onSelectDate={handleSelectDate}
          onSelectEvent={handleSelectEvent}
          onCreateEvent={handleCreateEvent}
        />
      )}

      {currentView === 'day' && (
        <DayView
          onSelectEvent={handleSelectEvent}
          onCreateEvent={handleCreateEvent}
        />
      )}

      {currentView === 'upcoming' && (
        <UpcomingView
          onSelectEvent={handleSelectEvent}
        />
      )}
    </div>
  );
}
