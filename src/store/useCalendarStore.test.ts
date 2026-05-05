import { describe, it, expect, beforeEach } from 'vitest';
import { useCalendarStore } from './useCalendarStore';

/**
 * Walk an object recursively and return paths that hold a literal
 * `undefined` value. Firestore rejects setDoc payloads containing any
 * `undefined`, so this is the proxy we use to confirm that a store's
 * cloud-sync output stays Firestore-safe after Batch 1's null-emit fixes.
 *
 * `JSON.stringify` itself drops keys with `undefined` values, so a string
 * search wouldn't catch the violation — we walk the live object.
 */
function findUndefinedPaths(obj: unknown, path = ''): string[] {
  if (obj === undefined) return [path || '<root>'];
  if (obj === null || typeof obj !== 'object') return [];
  const paths: string[] = [];
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => paths.push(...findUndefinedPaths(v, `${path}[${i}]`)));
  } else {
    for (const [k, v] of Object.entries(obj)) {
      paths.push(...findUndefinedPaths(v, path ? `${path}.${k}` : k));
    }
  }
  return paths;
}

describe('useCalendarStore — Batch 1 null-emit invariants', () => {
  beforeEach(() => {
    useCalendarStore.getState().resetStore();
  });

  it('updateEvent({ location: null }) clears the field (NOT undefined, NOT the prior value)', () => {
    const id = useCalendarStore.getState().addEvent({
      calendarId: 'cal-personal',
      title: 'Test event',
      startDate: '2026-01-01T10:00:00.000Z',
      endDate: '2026-01-01T11:00:00.000Z',
      isAllDay: false,
      location: '123 Main St',
      timezone: 'America/New_York',
      alerts: [],
      attendees: [],
      availabilityStatus: 'busy',
    });

    expect(useCalendarStore.getState().getEvent(id)?.location).toBe('123 Main St');

    // Editor's null-emit pattern (commit b484873): location.trim() || null.
    useCalendarStore.getState().updateEvent(id, { location: null });
    const cleared = useCalendarStore.getState().getEvent(id);
    expect(cleared?.location).toBeNull();
    // Critical: must not be undefined (Firestore would reject) and must not
    // still be '123 Main St' (the bug the fix addresses — undefined was
    // preserved by setDoc({merge:true})).
    expect(cleared?.location).not.toBe(undefined);
    expect(cleared?.location).not.toBe('123 Main St');
  });

  it('getCloudSyncData() output contains no undefined values after null-emit edits', () => {
    // Mirror what the editor produces post-Batch 1: optional fields explicitly
    // null'd rather than left undefined.
    useCalendarStore.getState().addEvent({
      calendarId: 'cal-personal',
      title: 'All-cleared event',
      startDate: '2026-01-01T10:00:00.000Z',
      endDate: '2026-01-01T11:00:00.000Z',
      isAllDay: false,
      location: null,
      locationPlaceId: null,
      videoCallUrl: null,
      notes: null,
      timezone: 'America/New_York',
      alerts: [],
      travelTime: null,
      recurrenceRule: null,
      attendees: [],
      availabilityStatus: 'busy',
    });

    const cloudData = useCalendarStore.getState().getCloudSyncData();
    const undefinedPaths = findUndefinedPaths(cloudData);
    expect(undefinedPaths, 'Firestore would reject these paths').toEqual([]);

    // Round-trip through JSON to also verify the result re-parses cleanly
    // and structurally matches the input.
    const roundtripped = JSON.parse(JSON.stringify(cloudData));
    expect(roundtripped).toStrictEqual(cloudData);
  });
});
