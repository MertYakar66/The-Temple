// ============================================
// Calendar Module Types
// ============================================

export type CalendarViewType = 'day' | 'week' | 'month' | 'upcoming';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ParticipationStatus = 'accepted' | 'declined' | 'maybe' | 'pending';

export type AvailabilityStatus = 'busy' | 'free' | 'tentative';

export type CalendarType = 'personal' | 'shared' | 'subscribed' | 'holiday';

export type AlertUnit = 'minutes' | 'hours' | 'days';

// ============================================
// Recurrence
// ============================================

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // every N days/weeks/months/years
  daysOfWeek?: number[]; // 0=Sun..6=Sat (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly by date)
  weekOfMonth?: number; // 1-5 (for monthly by ordinal, e.g. 2nd Tuesday)
  endType: 'never' | 'on_date' | 'after_count';
  endDate?: string; // ISO date
  endCount?: number;
}

// ============================================
// Alert
// ============================================

export interface CalendarAlert {
  id: string;
  amount: number;
  unit: AlertUnit;
}

// ============================================
// Attendee
// ============================================

export interface Attendee {
  id: string;
  name: string;
  email: string;
  status: ParticipationStatus;
  isOrganizer?: boolean;
}

// ============================================
// Calendar Event
// ============================================

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  startDate: string; // ISO datetime
  endDate: string; // ISO datetime
  isAllDay: boolean;
  location?: string | null;
  locationPlaceId?: string | null;
  videoCallUrl?: string | null;
  notes?: string | null;
  timezone: string;
  alerts: CalendarAlert[];
  travelTime?: number | null; // minutes before event; null clears
  recurrenceRule?: RecurrenceRule | null;
  attendees: Attendee[];
  organizer?: string | null;
  availabilityStatus: AvailabilityStatus;
  seriesMasterId?: string; // for recurring instance exceptions
  isRecurrenceException?: boolean;
  originalDate?: string; // original date of this exception instance
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

// ============================================
// Calendar Container
// ============================================

export interface CalendarContainer {
  id: string;
  name: string;
  color: string;
  type: CalendarType;
  isVisible: boolean;
  isReadOnly: boolean;
  isDefault: boolean;
  sortOrder: number;
  subscriptionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Calendar Settings
// ============================================

export interface CalendarSettings {
  defaultCalendarId: string;
  defaultEventDuration: number; // minutes
  defaultAlertMinutes: number;
  defaultAllDayAlertMinutes: number;
  startOfWeek: number; // 0=Sun..6=Sat
  showWeekNumbers: boolean;
  timeZoneOverride?: string;
  use24HourTime: boolean;
  weekViewStartsToday: boolean;
}

// ============================================
// Invitation
// ============================================

export interface Invitation {
  id: string;
  eventId: string;
  eventTitle: string;
  organizerName: string;
  organizerEmail: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location?: string;
  status: ParticipationStatus;
  receivedAt: string;
  isRead: boolean;
}

// ============================================
// Default values
// ============================================

export const DEFAULT_CALENDAR_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
];

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  defaultCalendarId: '',
  defaultEventDuration: 60,
  defaultAlertMinutes: 15,
  defaultAllDayAlertMinutes: 1440, // 1 day before
  startOfWeek: 1, // Monday
  showWeekNumbers: false,
  use24HourTime: false,
  weekViewStartsToday: false,
};
