import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Source-of-truth tests for the load/save primitives that AuthContext's
 * sign-in and logout flows depend on.
 *
 * The whole clobber-guard fix (AuthContext bug #1) hinges on a load being able
 * to distinguish "no cloud doc yet" (new user → null) from "the read FAILED"
 * (transient/offline → throw). Likewise the atomic-logout fix (bug #2) needs a
 * save to REJECT on failure so the flush can be detected as failed. These
 * tests pin both behaviours at the Firestore boundary.
 *
 * `firebase/firestore` and `./firebase` are mocked; the real firestoreSync
 * module is exercised.
 */

const g = vi.hoisted(() => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/firestore', () => ({
  doc: g.doc,
  getDoc: g.getDoc,
  setDoc: g.setDoc,
  deleteDoc: g.deleteDoc,
}));

vi.mock('./firebase', () => ({ db: {} }));

import {
  loadWorkoutData,
  loadDietData,
  loadCalendarData,
  saveWorkoutData,
  saveDietData,
  saveCalendarData,
} from './firestoreSync';

describe('firestoreSync — loads distinguish no-doc from read error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    g.setDoc.mockResolvedValue(undefined);
  });

  it('returns null when the doc does not exist (legitimate new user)', async () => {
    g.getDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
    await expect(loadWorkoutData('u')).resolves.toBeNull();
    await expect(loadDietData('u')).resolves.toBeNull();
    await expect(loadCalendarData('u')).resolves.toBeNull();
  });

  it('returns the document data when it exists', async () => {
    g.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ workoutSessions: [1] }) });
    await expect(loadWorkoutData('u')).resolves.toEqual({ workoutSessions: [1] });
  });

  it('THROWS on a transient read error instead of swallowing it to null', async () => {
    g.getDoc.mockRejectedValue(new Error('unavailable'));
    // The bug: current code returns null here, making a failed read
    // indistinguishable from a new user. A failed read must reject.
    await expect(loadWorkoutData('u')).rejects.toThrow('unavailable');
    await expect(loadDietData('u')).rejects.toThrow('unavailable');
    await expect(loadCalendarData('u')).rejects.toThrow('unavailable');
  });
});

describe('firestoreSync — saves propagate write errors (so logout can detect flush failure)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    g.getDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
  });

  it('resolves on a successful write', async () => {
    g.setDoc.mockResolvedValue(undefined);
    await expect(saveWorkoutData('u', { a: 1 })).resolves.toBeUndefined();
  });

  it('REJECTS on a failed write instead of swallowing it', async () => {
    g.setDoc.mockRejectedValue(new Error('permission-denied'));
    await expect(saveWorkoutData('u', {})).rejects.toThrow('permission-denied');
    await expect(saveDietData('u', {})).rejects.toThrow('permission-denied');
    await expect(saveCalendarData('u', {})).rejects.toThrow('permission-denied');
  });
});
