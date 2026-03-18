import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  CalendarEvent,
  CalendarContainer,
  CalendarSettings,
  CalendarViewType,
  Invitation,
} from '../types/calendar';
import { DEFAULT_CALENDAR_SETTINGS, DEFAULT_CALENDAR_COLORS } from '../types/calendar';

interface CalendarState {
  // Events
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => string;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  deleteEventSeries: (seriesMasterId: string) => void;
  getEvent: (id: string) => CalendarEvent | undefined;

  // Calendars
  calendars: CalendarContainer[];
  addCalendar: (cal: Omit<CalendarContainer, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCalendar: (id: string, updates: Partial<CalendarContainer>) => void;
  deleteCalendar: (id: string) => void;
  toggleCalendarVisibility: (id: string) => void;
  getVisibleCalendarIds: () => Set<string>;

  // Settings
  settings: CalendarSettings;
  updateSettings: (updates: Partial<CalendarSettings>) => void;

  // View state
  currentView: CalendarViewType;
  selectedDate: string; // ISO date string
  setCurrentView: (view: CalendarViewType) => void;
  setSelectedDate: (date: string) => void;

  // Invitations
  invitations: Invitation[];
  addInvitation: (inv: Omit<Invitation, 'id' | 'receivedAt' | 'isRead'>) => void;
  respondToInvitation: (id: string, status: Invitation['status']) => void;
  markInvitationRead: (id: string) => void;
  getUnreadInvitationCount: () => number;

  // Cloud sync
  loadFromCloud: (data: Record<string, unknown>) => void;
  getCloudSyncData: () => Record<string, unknown>;
  resetStore: () => void;
}

const DEFAULT_CALENDARS: CalendarContainer[] = [
  {
    id: 'cal-personal',
    name: 'Personal',
    color: DEFAULT_CALENDAR_COLORS[0],
    type: 'personal',
    isVisible: true,
    isReadOnly: false,
    isDefault: true,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cal-work',
    name: 'Work',
    color: DEFAULT_CALENDAR_COLORS[1],
    type: 'personal',
    isVisible: true,
    isReadOnly: false,
    isDefault: false,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cal-training',
    name: 'Training',
    color: DEFAULT_CALENDAR_COLORS[2],
    type: 'personal',
    isVisible: true,
    isReadOnly: false,
    isDefault: false,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialSettings: CalendarSettings = {
  ...DEFAULT_CALENDAR_SETTINGS,
  defaultCalendarId: 'cal-personal',
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      // Events
      events: [],

      addEvent: (eventData) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const event: CalendarEvent = {
          ...eventData,
          id,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };
        set((state) => ({ events: [...state.events, event] }));
        return id;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, isDeleted: true, updatedAt: new Date().toISOString() } : e
          ),
        }));
      },

      deleteEventSeries: (seriesMasterId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === seriesMasterId || e.seriesMasterId === seriesMasterId
              ? { ...e, isDeleted: true, updatedAt: new Date().toISOString() }
              : e
          ),
        }));
      },

      getEvent: (id) => get().events.find((e) => e.id === id && !e.isDeleted),

      // Calendars
      calendars: DEFAULT_CALENDARS,

      addCalendar: (calData) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const cal: CalendarContainer = {
          ...calData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ calendars: [...state.calendars, cal] }));
        return id;
      },

      updateCalendar: (id, updates) => {
        set((state) => ({
          calendars: state.calendars.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteCalendar: (id) => {
        set((state) => ({
          calendars: state.calendars.filter((c) => c.id !== id),
          events: state.events.map((e) =>
            e.calendarId === id ? { ...e, isDeleted: true } : e
          ),
        }));
      },

      toggleCalendarVisibility: (id) => {
        set((state) => ({
          calendars: state.calendars.map((c) =>
            c.id === id ? { ...c, isVisible: !c.isVisible } : c
          ),
        }));
      },

      getVisibleCalendarIds: () => {
        return new Set(get().calendars.filter((c) => c.isVisible).map((c) => c.id));
      },

      // Settings
      settings: initialSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      // View state
      currentView: 'month',
      selectedDate: new Date().toISOString(),

      setCurrentView: (view) => set({ currentView: view }),
      setSelectedDate: (date) => set({ selectedDate: date }),

      // Invitations
      invitations: [],

      addInvitation: (invData) => {
        const inv: Invitation = {
          ...invData,
          id: uuidv4(),
          receivedAt: new Date().toISOString(),
          isRead: false,
        };
        set((state) => ({ invitations: [...state.invitations, inv] }));
      },

      respondToInvitation: (id, status) => {
        set((state) => ({
          invitations: state.invitations.map((inv) =>
            inv.id === id ? { ...inv, status } : inv
          ),
        }));
      },

      markInvitationRead: (id) => {
        set((state) => ({
          invitations: state.invitations.map((inv) =>
            inv.id === id ? { ...inv, isRead: true } : inv
          ),
        }));
      },

      getUnreadInvitationCount: () => {
        return get().invitations.filter((inv) => !inv.isRead && inv.status === 'pending').length;
      },

      // Cloud sync
      loadFromCloud: (data) => {
        set({
          events: (data.events as CalendarEvent[]) ?? get().events,
          calendars: (data.calendars as CalendarContainer[]) ?? get().calendars,
          settings: (data.settings as CalendarSettings) ?? get().settings,
          invitations: (data.invitations as Invitation[]) ?? get().invitations,
        });
      },

      getCloudSyncData: () => {
        const state = get();
        return {
          events: state.events,
          calendars: state.calendars,
          settings: state.settings,
          invitations: state.invitations,
        };
      },

      resetStore: () => {
        set({
          events: [],
          calendars: DEFAULT_CALENDARS,
          settings: initialSettings,
          currentView: 'month',
          selectedDate: new Date().toISOString(),
          invitations: [],
        });
      },
    }),
    {
      name: 'calendar-storage',
      version: 1,
    }
  )
);
