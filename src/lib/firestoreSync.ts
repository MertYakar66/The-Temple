/**
 * firestoreSync — read/write the three per-user data documents.
 *
 * Every write goes through `setDoc(..., { merge: true })`. This means
 * `{ field: undefined }` PRESERVES the prior value silently, while
 * `{ field: null }` clears it. The "null-emit on clear" rule
 * (docs/DATA_POLICY.md §1, §3) exists because of this merge semantics —
 * editor code must emit `null`, not `undefined`, when the user clears
 * an optional field.
 *
 * Error semantics (load-bearing — see docs/sync-model.md):
 *   - `load*Data` returns `null` ONLY when there is no cloud doc yet (a
 *     legitimate new user). A read FAILURE THROWS, so `AuthContext` can tell a
 *     transient/offline error apart from "no doc" and avoid overwriting real
 *     cloud data with empty state.
 *   - `save*Data` PROPAGATES write errors. The debounced background path
 *     swallows them (fire-and-forget, retries on the next change); the explicit
 *     `AuthContext.logout` flush needs the rejection so it can keep the user
 *     signed in rather than clearing localStorage over unsynced edits.
 *
 * Writes are debounced 2 s per store. `AuthContext.logout` calls the
 * non-debounced `save*Data` functions to flush before sign-out — the
 * order matters because Firestore rules require auth.
 */
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

// Debounce timer references
let workoutSyncTimer: ReturnType<typeof setTimeout> | null = null;
let dietSyncTimer: ReturnType<typeof setTimeout> | null = null;
let calendarSyncTimer: ReturnType<typeof setTimeout> | null = null;

const SYNC_DEBOUNCE_MS = 2000;

type SyncData = Record<string, unknown>;

// ---------- Workout Store ----------

export async function loadWorkoutData(uid: string): Promise<SyncData | null> {
  const ref = doc(db, 'users', uid, 'data', 'workout');
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as SyncData) : null;
}

export async function saveWorkoutData(uid: string, data: SyncData): Promise<void> {
  const ref = doc(db, 'users', uid, 'data', 'workout');
  await setDoc(ref, data, { merge: true });
}

export function debouncedSaveWorkoutData(uid: string, data: SyncData): void {
  if (workoutSyncTimer) {
    clearTimeout(workoutSyncTimer);
  }
  workoutSyncTimer = setTimeout(() => {
    saveWorkoutData(uid, data).catch((error) => {
      console.error('Failed to save workout data to Firestore:', error);
    });
  }, SYNC_DEBOUNCE_MS);
}

// ---------- Diet Store ----------

export async function loadDietData(uid: string): Promise<SyncData | null> {
  const ref = doc(db, 'users', uid, 'data', 'diet');
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as SyncData) : null;
}

export async function saveDietData(uid: string, data: SyncData): Promise<void> {
  const ref = doc(db, 'users', uid, 'data', 'diet');
  await setDoc(ref, data, { merge: true });
}

export function debouncedSaveDietData(uid: string, data: SyncData): void {
  if (dietSyncTimer) {
    clearTimeout(dietSyncTimer);
  }
  dietSyncTimer = setTimeout(() => {
    saveDietData(uid, data).catch((error) => {
      console.error('Failed to save diet data to Firestore:', error);
    });
  }, SYNC_DEBOUNCE_MS);
}

// ---------- Calendar Store ----------

export async function loadCalendarData(uid: string): Promise<SyncData | null> {
  const ref = doc(db, 'users', uid, 'data', 'calendar');
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as SyncData) : null;
}

export async function saveCalendarData(uid: string, data: SyncData): Promise<void> {
  const ref = doc(db, 'users', uid, 'data', 'calendar');
  await setDoc(ref, data, { merge: true });
}

export function debouncedSaveCalendarData(uid: string, data: SyncData): void {
  if (calendarSyncTimer) {
    clearTimeout(calendarSyncTimer);
  }
  calendarSyncTimer = setTimeout(() => {
    saveCalendarData(uid, data).catch((error) => {
      console.error('Failed to save calendar data to Firestore:', error);
    });
  }, SYNC_DEBOUNCE_MS);
}

// ---------- Delete User Data ----------

export async function deleteUserCloudData(uid: string): Promise<void> {
  try {
    const workoutRef = doc(db, 'users', uid, 'data', 'workout');
    const dietRef = doc(db, 'users', uid, 'data', 'diet');
    const calendarRef = doc(db, 'users', uid, 'data', 'calendar');
    await Promise.all([deleteDoc(workoutRef), deleteDoc(dietRef), deleteDoc(calendarRef)]);
  } catch (error) {
    console.error('Failed to delete user cloud data:', error);
    throw error;
  }
}

// ---------- Cleanup ----------

export function cancelPendingSyncs(): void {
  if (workoutSyncTimer) {
    clearTimeout(workoutSyncTimer);
    workoutSyncTimer = null;
  }
  if (dietSyncTimer) {
    clearTimeout(dietSyncTimer);
    dietSyncTimer = null;
  }
  if (calendarSyncTimer) {
    clearTimeout(calendarSyncTimer);
    calendarSyncTimer = null;
  }
}
