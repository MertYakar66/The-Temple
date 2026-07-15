import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Integration test for the AuthContext cloud-sync race fix.
 *
 * Reproduces the race deterministically in jsdom — no Firebase, no
 * Playwright. `firebase/auth`, `../lib/firebase`, `../lib/firestoreSync` and
 * `../lib/siriToken` are mocked; the three Zustand stores are REAL, so
 * assertions read real store state. The test drives `onAuthStateChanged`
 * emission sequences by hand and asserts that a write made between fires
 * survives. See docs/plans/fix-authcontext-race.md §5.2.
 */

// Hoisted so the vi.mock factories below can reference them safely.
const h = vi.hoisted(() => ({
  authCb: { fn: null as null | ((user: unknown) => unknown) },
  authUnsub: vi.fn(),
  fakeAuth: { currentUser: null as null | { uid: string; email?: string } },
  loadWorkoutData: vi.fn(),
  loadDietData: vi.fn(),
  loadCalendarData: vi.fn(),
  debouncedSaveWorkoutData: vi.fn(),
  debouncedSaveDietData: vi.fn(),
  debouncedSaveCalendarData: vi.fn(),
  cancelPendingSyncs: vi.fn(),
  saveWorkoutData: vi.fn(() => Promise.resolve()),
  saveDietData: vi.fn(() => Promise.resolve()),
  saveCalendarData: vi.fn(() => Promise.resolve()),
  deleteUserCloudData: vi.fn(() => Promise.resolve()),
  revokeSiriToken: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (user: unknown) => unknown) => {
    h.authCb.fn = cb;
    return h.authUnsub;
  }),
  signOut: vi.fn(() => Promise.resolve()),
  deleteUser: vi.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
  signInWithPopup: vi.fn(() => Promise.resolve()),
  sendEmailVerification: vi.fn(() => Promise.resolve()),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  reauthenticateWithCredential: vi.fn(() => Promise.resolve()),
  updatePassword: vi.fn(() => Promise.resolve()),
  GoogleAuthProvider: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
}));

vi.mock('../lib/firebase', () => ({ auth: h.fakeAuth, db: {} }));

vi.mock('../lib/firestoreSync', () => ({
  loadWorkoutData: h.loadWorkoutData,
  loadDietData: h.loadDietData,
  loadCalendarData: h.loadCalendarData,
  debouncedSaveWorkoutData: h.debouncedSaveWorkoutData,
  debouncedSaveDietData: h.debouncedSaveDietData,
  debouncedSaveCalendarData: h.debouncedSaveCalendarData,
  cancelPendingSyncs: h.cancelPendingSyncs,
  saveWorkoutData: h.saveWorkoutData,
  saveDietData: h.saveDietData,
  saveCalendarData: h.saveCalendarData,
  deleteUserCloudData: h.deleteUserCloudData,
}));

vi.mock('../lib/siriToken', () => ({ revokeSiriToken: h.revokeSiriToken }));

// Imported after the mocks so the mocked modules are wired in.
import { StrictMode, act, useEffect } from 'react';
import { render, cleanup } from '@testing-library/react';
import { signOut, deleteUser } from 'firebase/auth';
import { AuthProvider, useAuth } from './AuthContext';
// Raw source text of AuthContext (Vite `?raw`) — used by the invariant-#5
// guard to assert the startSync equality filter covers every persisted slice.
// Avoids Node fs/path/process, which aren't in tsconfig.app's type surface.
import authContextSource from './AuthContext.tsx?raw';
import { useStore } from '../store/useStore';
import { useDietStore } from '../store/useDietStore';
import { useCalendarStore } from '../store/useCalendarStore';
import type { CalendarEvent } from '../types/calendar';

// --- Helpers -------------------------------------------------------------

// The latest auth-context value, mirrored out of <Probe> via an effect so
// the test can read `loading` / `currentUser` and call `logout()`. Updated
// in an effect (not during render) per the react-hooks/globals rule.
const cap: { current: ReturnType<typeof useAuth> | null } = { current: null };

function Probe() {
  const api = useAuth();
  useEffect(() => {
    cap.current = api;
  });
  return null;
}

function renderProvider(opts?: { strict?: boolean }) {
  const tree = (
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  return render(opts?.strict ? <StrictMode>{tree}</StrictMode> : tree);
}

/** Drive one onAuthStateChanged emission and flush the async chain. */
async function fire(user: { uid: string } | null): Promise<void> {
  await act(async () => {
    await h.authCb.fn?.(user);
  });
}

/** A valid `addEvent` input (Omit of the store-assigned fields). */
function makeCalendarEvent(
  title: string,
): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> {
  return {
    calendarId: 'cal-personal',
    title,
    startDate: '2026-01-01T10:00:00.000Z',
    endDate: '2026-01-01T11:00:00.000Z',
    isAllDay: false,
    location: null,
    timezone: 'America/New_York',
    alerts: [],
    attendees: [],
    availabilityStatus: 'busy',
  };
}

/** A fully-formed stored event, as it would appear inside a cloud doc. */
function makeStoredEvent(id: string, title: string): CalendarEvent {
  return {
    ...makeCalendarEvent(title),
    id,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isDeleted: false,
  };
}

// --- Tests ---------------------------------------------------------------

describe('AuthContext — cloud-sync race', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cap.current = null;
    h.authCb.fn = null;
    h.fakeAuth.currentUser = null;
    h.loadWorkoutData.mockResolvedValue(null);
    h.loadDietData.mockResolvedValue(null);
    h.loadCalendarData.mockResolvedValue(null);
    useStore.getState().resetStore();
    useDietStore.getState().resetStore();
    useCalendarStore.getState().resetStore();
  });

  afterEach(() => {
    cleanup();
  });

  it('cold load with no cached user: resolves loading, runs no chain', async () => {
    renderProvider();
    await fire(null);

    expect(cap.current?.loading).toBe(false);
    expect(cap.current?.currentUser).toBeNull();
    expect(h.debouncedSaveWorkoutData).not.toHaveBeenCalled();
  });

  it('establish: hydrates the stores from cloud and starts sync', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    h.loadCalendarData.mockResolvedValue({ events: [makeStoredEvent('cloud-evt', 'cloud')] });
    renderProvider();

    await fire(X);

    expect(cap.current?.loading).toBe(false);
    expect(useCalendarStore.getState().events).toHaveLength(1);
    expect(useCalendarStore.getState().events[0].id).toBe('cloud-evt');

    // Sync is active: a store change schedules exactly one debounced write.
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('local'));
    });
    expect(h.debouncedSaveCalendarData).toHaveBeenCalledTimes(1);
  });

  it('Race B: a same-uid re-fire after establish does not wipe a local write', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    // A stale cloud doc — a second chain would wipe via loadFromCloud.
    h.loadCalendarData.mockResolvedValue({ events: [] });
    renderProvider();

    await fire(X);
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('user write'));
    });
    expect(useCalendarStore.getState().events).toHaveLength(1);

    // The verified emission for the same uid — must be a no-op.
    await fire(X);

    expect(useCalendarStore.getState().events).toHaveLength(1);
    expect(useCalendarStore.getState().events[0].title).toBe('user write');
  });

  it('Race B: an unexpected null between same-uid fires does not wipe', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    h.loadCalendarData.mockResolvedValue({ events: [] });
    renderProvider();

    await fire(X);
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('user write'));
    });
    expect(useCalendarStore.getState().events).toHaveLength(1);

    // Transient null — NOT preceded by an in-app logout.
    h.fakeAuth.currentUser = null;
    await fire(null);
    expect(useCalendarStore.getState().events).toHaveLength(1);

    // Verified re-fire of the same user.
    h.fakeAuth.currentUser = X;
    await fire(X);
    expect(useCalendarStore.getState().events).toHaveLength(1);
    expect(useCalendarStore.getState().events[0].title).toBe('user write');
  });

  it('Race A: overlapping fires hydrate once — no leak, no wipe', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    h.loadCalendarData.mockResolvedValue({ events: [] });
    renderProvider();

    // Fire twice before the first chain's loads resolve: the first suspends
    // at its await, the second runs synchronously and dedups.
    const fired: Promise<unknown>[] = [];
    await act(async () => {
      fired.push(Promise.resolve(h.authCb.fn?.(X)));
      fired.push(Promise.resolve(h.authCb.fn?.(X)));
      await Promise.all(fired);
    });

    expect(cap.current?.loading).toBe(false);

    // Exactly one subscriber set installed — one change ⇒ one debounced write
    // (a leaked subscriber from the second chain would make this 2).
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('e'));
    });
    expect(h.debouncedSaveCalendarData).toHaveBeenCalledTimes(1);
    expect(useCalendarStore.getState().events).toHaveLength(1);
  });

  it('logout: tears sync down and resets the stores', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    renderProvider();

    await fire(X);
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('to be cleared'));
    });
    expect(useCalendarStore.getState().events).toHaveLength(1);

    // In-app logout sets the intentional flag; signOut is mocked (no real
    // emission), so the null emission it would trigger is driven explicitly.
    await act(async () => {
      await cap.current?.logout();
    });
    h.fakeAuth.currentUser = null;
    await fire(null);

    expect(useCalendarStore.getState().events).toHaveLength(0);
    expect(cap.current?.loading).toBe(false);

    // Sync is torn down — a later store change schedules no write.
    h.debouncedSaveCalendarData.mockClear();
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('after logout'));
    });
    expect(h.debouncedSaveCalendarData).not.toHaveBeenCalled();
  });

  it('user switch X→Y: resets X data and loads Y', async () => {
    const X = { uid: 'user-X' };
    const Y = { uid: 'user-Y' };
    h.fakeAuth.currentUser = X;
    h.loadCalendarData.mockResolvedValue(null); // X: no cloud doc
    renderProvider();

    await fire(X);
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent("X's event"));
    });
    expect(useCalendarStore.getState().events).toHaveLength(1);

    // A different uid — establishes a fresh session.
    h.fakeAuth.currentUser = Y;
    h.loadCalendarData.mockResolvedValue({ events: [] }); // Y: empty cloud doc
    await fire(Y);

    // X's in-memory event is gone; Y's (empty) cloud state is loaded.
    expect(useCalendarStore.getState().events).toHaveLength(0);
    expect(cap.current?.currentUser?.uid).toBe('user-Y');
  });

  it('survives StrictMode double-invoke of the effect', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    h.loadCalendarData.mockResolvedValue({ events: [] });
    renderProvider({ strict: true });

    await fire(X);

    // Not stuck on the loading gate; hydrated; exactly one subscriber set.
    expect(cap.current?.loading).toBe(false);
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('e'));
    });
    expect(useCalendarStore.getState().events).toHaveLength(1);
    expect(h.debouncedSaveCalendarData).toHaveBeenCalledTimes(1);
  });
});

// -------------------------------------------------------------------------
// Data-loss hardening (auth-sync-integrity): three silent-data-loss bugs in
// the sign-in / logout / delete lifecycle. Each behavioural test below fails
// on the pre-fix code and passes after; test 6 is a standing invariant guard.
// -------------------------------------------------------------------------

describe('AuthContext — data-loss hardening (auth-sync-integrity)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cap.current = null;
    h.authCb.fn = null;
    h.fakeAuth.currentUser = null;
    h.loadWorkoutData.mockResolvedValue(null);
    h.loadDietData.mockResolvedValue(null);
    h.loadCalendarData.mockResolvedValue(null);
    h.saveWorkoutData.mockResolvedValue(undefined);
    h.saveDietData.mockResolvedValue(undefined);
    h.saveCalendarData.mockResolvedValue(undefined);
    h.deleteUserCloudData.mockResolvedValue(undefined);
    useStore.getState().resetStore();
    useDietStore.getState().resetStore();
    useCalendarStore.getState().resetStore();
  });

  afterEach(() => {
    cleanup();
  });

  // Bug 1 — the clobber guard (RED before fix).
  it('Bug 1: a cloud-read error does NOT reset stores, start sync, or write', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    renderProvider();

    // localStorage-hydrated last-known state already present in memory.
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('local-known'));
    });
    expect(useCalendarStore.getState().events).toHaveLength(1);

    // One of the three cloud reads fails transiently.
    h.loadWorkoutData.mockRejectedValueOnce(new Error('network down'));
    await fire(X);

    // Stores retained their data — never reset to empty.
    expect(useCalendarStore.getState().events).toHaveLength(1);
    expect(useCalendarStore.getState().events[0].title).toBe('local-known');

    // No cloud write of any kind was issued for this session.
    expect(h.debouncedSaveWorkoutData).not.toHaveBeenCalled();
    expect(h.debouncedSaveDietData).not.toHaveBeenCalled();
    expect(h.debouncedSaveCalendarData).not.toHaveBeenCalled();
    expect(h.saveWorkoutData).not.toHaveBeenCalled();
    expect(h.saveDietData).not.toHaveBeenCalled();
    expect(h.saveCalendarData).not.toHaveBeenCalled();

    // Sync is NOT running: a later edit schedules no debounced write.
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('later edit'));
    });
    expect(h.debouncedSaveCalendarData).not.toHaveBeenCalled();

    // Recoverable: loading resolved and the error is surfaced.
    expect(cap.current?.loading).toBe(false);
    expect(cap.current?.cloudError).toBe(true);
  });

  // Bug 1 — the new-user path must NOT regress (still reset + startSync).
  it('Bug 1 guard: a new user (all loads null) still resets + starts sync', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    renderProvider();

    // Stale in-memory data a correct reset must clear.
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('stale'));
    });
    expect(useCalendarStore.getState().events).toHaveLength(1);

    await fire(X);

    // Reset ran (stale cleared); no error surfaced.
    expect(useCalendarStore.getState().events).toHaveLength(0);
    expect(cap.current?.cloudError).toBe(false);
    expect(cap.current?.loading).toBe(false);

    // Sync started: an edit schedules exactly one debounced write.
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('fresh'));
    });
    expect(h.debouncedSaveCalendarData).toHaveBeenCalledTimes(1);
  });

  // Bug 2 — the happy path must still sign out + clear localStorage.
  it('Bug 2 guard: logout with a successful flush signs out and clears localStorage', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    renderProvider();
    await fire(X);

    const removeSpy = vi.spyOn(localStorage, 'removeItem');
    vi.mocked(signOut).mockClear();

    await act(async () => {
      await cap.current?.logout();
    });

    // Flush succeeded → real sign-out + localStorage cleared.
    expect(vi.mocked(signOut)).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith('workout-tracker-storage');
    expect(removeSpy).toHaveBeenCalledWith('diet-tracker-storage');
    expect(removeSpy).toHaveBeenCalledWith('calendar-storage');
    // The non-debounced flush was actually issued before sign-out.
    expect(h.saveWorkoutData).toHaveBeenCalledWith('user-X', expect.any(Object));
    removeSpy.mockRestore();
  });

  // Bug 2 — a failed flush must NOT discard unsynced data (RED before fix).
  it('Bug 2: a failed flush keeps the user signed in, restarts sync, and throws', async () => {
    const X = { uid: 'user-X' };
    h.fakeAuth.currentUser = X;
    renderProvider();
    await fire(X);

    // The flush fails (offline).
    h.saveWorkoutData.mockRejectedValueOnce(new Error('offline'));
    const removeSpy = vi.spyOn(localStorage, 'removeItem');
    vi.mocked(signOut).mockClear();

    let err: unknown;
    await act(async () => {
      try {
        await cap.current?.logout();
      } catch (e) {
        err = e;
      }
    });

    // Error propagated to the awaiting UI.
    expect(err).toBeInstanceOf(Error);
    // Did NOT sign out and did NOT clear localStorage — unsynced data preserved.
    expect(vi.mocked(signOut)).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalledWith('workout-tracker-storage');
    expect(removeSpy).not.toHaveBeenCalledWith('diet-tracker-storage');
    expect(removeSpy).not.toHaveBeenCalledWith('calendar-storage');

    // Sync restarted → a later edit still schedules a debounced write.
    h.debouncedSaveCalendarData.mockClear();
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('after failed logout'));
    });
    expect(h.debouncedSaveCalendarData).toHaveBeenCalledTimes(1);
    removeSpy.mockRestore();
  });

  // Bug 3 — a failed cloud-data delete must not leave sync stopped (RED before fix).
  it('Bug 3: a failed cloud-data delete restarts sync (never left permanently stopped)', async () => {
    const X = { uid: 'user-X', email: 'x@example.com' };
    h.fakeAuth.currentUser = X;
    renderProvider();
    await fire(X);

    // The Firestore delete fails; the auth account still exists.
    h.deleteUserCloudData.mockRejectedValueOnce(new Error('firestore down'));

    let err: unknown;
    await act(async () => {
      try {
        await cap.current?.deleteAccount('pw');
      } catch (e) {
        err = e;
      }
    });
    expect(err).toBeInstanceOf(Error);

    // The point of no return was never crossed.
    expect(vi.mocked(deleteUser)).not.toHaveBeenCalled();

    // Sync is running again (user still authenticated) → an edit schedules a write.
    h.debouncedSaveCalendarData.mockClear();
    act(() => {
      useCalendarStore.getState().addEvent(makeCalendarEvent('still syncing'));
    });
    expect(h.debouncedSaveCalendarData).toHaveBeenCalledTimes(1);
  });

  // Invariant #5 guard — the startSync equality filter must reference every
  // persisted slice of every store. Derived from each store's own
  // getCloudSyncData() keys (the source of truth), so it also catches a slice
  // added to a store but forgotten in the sync filter.
  it('Invariant #5: startSync equality filter references every persisted slice', () => {
    const src = authContextSource;
    const startIdx = src.indexOf('const startSync');
    const endIdx = src.indexOf('}, [stopSync]);', startIdx);
    expect(startIdx).toBeGreaterThan(-1);
    expect(endIdx).toBeGreaterThan(startIdx);
    const startSyncSrc = src.slice(startIdx, endIdx);

    const stores: Array<[string, string[]]> = [
      ['workout', Object.keys(useStore.getState().getCloudSyncData())],
      ['diet', Object.keys(useDietStore.getState().getCloudSyncData())],
      ['calendar', Object.keys(useCalendarStore.getState().getCloudSyncData())],
    ];

    for (const [name, keys] of stores) {
      for (const key of keys) {
        const re = new RegExp(`state\\.${key}\\s*===\\s*prevState\\.${key}\\b`);
        expect(
          re.test(startSyncSrc),
          `${name} persisted slice "${key}" is missing from the startSync equality check`,
        ).toBe(true);
      }
    }
  });
});
