import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, setHours, setMinutes } from 'date-fns';
import { parseISO } from 'date-fns';
import { useCalendarStore } from '../store/useCalendarStore';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { DayView } from '../components/calendar/DayView';
import { UpcomingView } from '../components/calendar/UpcomingView';
import { QuickEventCreate } from '../components/calendar/QuickEventCreate';
import { EventDetailPopover } from '../components/calendar/EventDetailPopover';

interface PopoverState {
  type: 'create' | 'detail';
  // create-specific
  date?: Date;
  startHour?: number;
  endHour?: number;
  startMinute?: number;
  endMinute?: number;
  // detail-specific
  eventId?: string;
  // common
  position?: { top: number; left: number };
}

export function Calendar() {
  const navigate = useNavigate();
  const currentView = useCalendarStore((s) => s.currentView);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const setCurrentView = useCalendarStore((s) => s.setCurrentView);

  const [popover, setPopover] = useState<PopoverState | null>(null);

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
    if (currentView === 'month') {
      setCurrentView('day');
    }
  }, [setSelectedDate, currentView, setCurrentView]);

  // Event clicked → show detail popover
  const handleSelectEvent = useCallback((eventId: string, rect: DOMRect) => {
    const left = Math.min(rect.left, window.innerWidth - 288);
    const top = rect.bottom + 8 > window.innerHeight - 100
      ? Math.max(rect.top - 220, 10)
      : rect.bottom + 8;
    setPopover({ type: 'detail', eventId, position: { top, left: Math.max(left, 8) } });
  }, []);

  // Quick create from DayView/WeekView drag
  const handleQuickCreate = useCallback((d: Date, startHour: number, endHour: number, startMin: number, endMin: number, rect: DOMRect) => {
    const left = Math.min(rect.x, window.innerWidth - 288);
    const top = Math.min(rect.y, window.innerHeight - 200);
    setPopover({
      type: 'create',
      date: d,
      startHour,
      endHour,
      startMinute: startMin,
      endMinute: endMin,
      position: { top: Math.max(top, 10), left: Math.max(left, 8) },
    });
  }, []);

  // Quick create from MonthView (date click)
  const handleMonthQuickCreate = useCallback((d: Date, rect: DOMRect) => {
    const now = new Date();
    const sh = now.getHours();
    const left = Math.min(rect.x, window.innerWidth - 288);
    const top = Math.min(rect.y + rect.height, window.innerHeight - 200);
    setPopover({
      type: 'create',
      date: d,
      startHour: sh,
      endHour: sh + 1,
      startMinute: 0,
      endMinute: 0,
      position: { top: Math.max(top, 10), left: Math.max(left, 8) },
    });
  }, []);

  // Full editor navigation
  const handleCreateEvent = useCallback((d: Date, hour?: number) => {
    const params = new URLSearchParams();
    params.set('date', d.toISOString());
    if (hour !== undefined) params.set('hour', String(hour));
    navigate(`/calendar/event/edit?${params.toString()}`);
  }, [navigate]);

  const handleFullEditor = useCallback((d: Date, startHour?: number, endHour?: number) => {
    const params = new URLSearchParams();
    if (startHour !== undefined) {
      const startDate = setMinutes(setHours(new Date(d), startHour), 0);
      params.set('date', startDate.toISOString());
      params.set('hour', String(startHour));
      if (endHour !== undefined) params.set('endHour', String(endHour));
    } else {
      params.set('date', d.toISOString());
    }
    setPopover(null);
    navigate(`/calendar/event/edit?${params.toString()}`);
  }, [navigate]);

  const handleEditEvent = useCallback((eventId: string) => {
    setPopover(null);
    navigate(`/calendar/event/edit?id=${eventId}`);
  }, [navigate]);

  const handleAddEvent = useCallback(() => {
    handleCreateEvent(date);
  }, [handleCreateEvent, date]);

  const closePopover = useCallback(() => setPopover(null), []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
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
          onQuickCreate={handleMonthQuickCreate}
        />
      )}

      {currentView === 'week' && (
        <WeekView
          onSelectDate={handleSelectDate}
          onSelectEvent={handleSelectEvent}
          onQuickCreate={handleQuickCreate}
          onCreateEvent={handleCreateEvent}
        />
      )}

      {currentView === 'day' && (
        <DayView
          onSelectEvent={handleSelectEvent}
          onQuickCreate={handleQuickCreate}
          onCreateEvent={handleCreateEvent}
        />
      )}

      {currentView === 'upcoming' && (
        <UpcomingView
          onSelectEvent={handleSelectEvent}
        />
      )}

      {/* Quick Event Create Popover */}
      {popover?.type === 'create' && popover.date && (
        <QuickEventCreate
          date={popover.date}
          startHour={popover.startHour}
          endHour={popover.endHour}
          startMinute={popover.startMinute}
          endMinute={popover.endMinute}
          position={popover.position}
          onCreated={(id) => {
            setPopover({ type: 'detail', eventId: id, position: popover.position });
          }}
          onFullEditor={handleFullEditor}
          onClose={closePopover}
        />
      )}

      {/* Event Detail Popover */}
      {popover?.type === 'detail' && popover.eventId && (
        <EventDetailPopover
          eventId={popover.eventId}
          position={popover.position}
          onEdit={handleEditEvent}
          onClose={closePopover}
        />
      )}
    </div>
  );
}
