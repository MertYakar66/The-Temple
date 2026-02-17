import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Debounce timer references
let workoutSyncTimer: ReturnType<typeof setTimeout> | null = null;
let dietSyncTimer: ReturnType<typeof setTimeout> | null = null;

const SYNC_DEBOUNCE_MS = 2000;

type SyncData = Record<string, unknown>;

// ---------- Workout Store ----------

export async function loadWorkoutData(uid: string): Promise<SyncData | null> {
  try {
    const ref = doc(db, 'users', uid, 'data', 'workout');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as SyncData;
    }
    return null;
  } catch (error) {
    console.error('Failed to load workout data from Firestore:', error);
    return null;
  }
}

export async function saveWorkoutData(uid: string, data: SyncData): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'data', 'workout');
    await setDoc(ref, data, { merge: true });
  } catch (error) {
    console.error('Failed to save workout data to Firestore:', error);
  }
}

export function debouncedSaveWorkoutData(uid: string, data: SyncData): void {
  if (workoutSyncTimer) {
    clearTimeout(workoutSyncTimer);
  }
  workoutSyncTimer = setTimeout(() => {
    saveWorkoutData(uid, data);
  }, SYNC_DEBOUNCE_MS);
}

// ---------- Diet Store ----------

export async function loadDietData(uid: string): Promise<SyncData | null> {
  try {
    const ref = doc(db, 'users', uid, 'data', 'diet');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as SyncData;
    }
    return null;
  } catch (error) {
    console.error('Failed to load diet data from Firestore:', error);
    return null;
  }
}

export async function saveDietData(uid: string, data: SyncData): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'data', 'diet');
    await setDoc(ref, data, { merge: true });
  } catch (error) {
    console.error('Failed to save diet data to Firestore:', error);
  }
}

export function debouncedSaveDietData(uid: string, data: SyncData): void {
  if (dietSyncTimer) {
    clearTimeout(dietSyncTimer);
  }
  dietSyncTimer = setTimeout(() => {
    saveDietData(uid, data);
  }, SYNC_DEBOUNCE_MS);
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
}
