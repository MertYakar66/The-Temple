/**
 * AuthContext — authentication + cloud sync controller.
 *
 * Owns the lifecycle for all three Zustand stores: on sign-in, reset → load
 * from Firestore → start subscriptions; on sign-out, flush → stop → reset.
 * The only file in `src/` that calls Firebase Auth methods directly; pages
 * go through `useAuth()`.
 *
 * Cancellation-safe `onAuthStateChanged`. Firebase can emit the listener
 * more than once for a single cold load (a cached-user emission, then a
 * verified emission), and React StrictMode double-invokes the effect in dev.
 * The callback is guarded so a late or duplicate emission can never wipe a
 * live session:
 *   - `resolveAuthAction` (see ./authSession) classifies each emission as
 *     `establish` / `skip` / `sign-out` from (owned uid, incoming uid,
 *     intentional-sign-out flag). A re-fire for the already-owned uid is a
 *     `skip`; an unexpected `null` (a transient emission, not an in-app
 *     sign-out) is also a `skip` — neither resets nor reloads.
 *   - Each `establish` chain owns an `AbortController`; a newer chain aborts
 *     the older, which bails after its `await` instead of clobbering state.
 *   - `resetStore()` is fused with `loadFromCloud()` AFTER the await, as one
 *     synchronous block — nothing can interleave between empty and hydrated.
 * See docs/plans/fix-authcontext-race.md.
 */
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { useDietStore } from '../store/useDietStore';
import { useCalendarStore } from '../store/useCalendarStore';
import {
  loadWorkoutData,
  loadDietData,
  loadCalendarData,
  debouncedSaveWorkoutData,
  debouncedSaveDietData,
  debouncedSaveCalendarData,
  cancelPendingSyncs,
  saveWorkoutData,
  saveDietData,
  saveCalendarData,
  deleteUserCloudData,
} from '../lib/firestoreSync';
import { revokeSiriToken } from '../lib/siriToken';
import { resolveAuthAction } from './authSession';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubWorkoutRef = useRef<(() => void) | null>(null);
  const unsubDietRef = useRef<(() => void) | null>(null);
  const unsubCalendarRef = useRef<(() => void) | null>(null);
  // Cancellation + dedup state for the onAuthStateChanged callback.
  // - controllerRef: aborts an in-flight establish chain when superseded.
  // - establishedUidRef: the uid of the session currently owned (in-flight
  //   or established) — drives the same-uid dedup; cleared only by a genuine
  //   sign-out or the effect cleanup.
  // - intentionalSignOutRef: set by logout()/deleteAccount() so the null
  //   emission they trigger is treated as a real sign-out, not as noise.
  // See docs/plans/fix-authcontext-race.md §2.
  const controllerRef = useRef<AbortController | null>(null);
  const establishedUidRef = useRef<string | null>(null);
  const intentionalSignOutRef = useRef(false);

  const stopSync = useCallback(() => {
    cancelPendingSyncs();
    if (unsubWorkoutRef.current) {
      unsubWorkoutRef.current();
      unsubWorkoutRef.current = null;
    }
    if (unsubDietRef.current) {
      unsubDietRef.current();
      unsubDietRef.current = null;
    }
    if (unsubCalendarRef.current) {
      unsubCalendarRef.current();
      unsubCalendarRef.current = null;
    }
  }, []);

  const startSync = useCallback((uid: string) => {
    // Defense in depth: never leak a prior subscription by overwriting a live
    // unsub ref. The establish chain already calls stopSync before this, but
    // any future caller that forgets to should still get clean teardown.
    stopSync();

    // Zustand `subscribe` fires on EVERY state change, including ephemeral UI
    // state (`currentView`, `selectedDate`, `newPRs`, etc.) that we don't sync.
    // Compare slice references against the previous state and skip writes when
    // nothing relevant changed — avoids wasted Firestore writes during calendar
    // navigation, PR celebration clears, etc.
    unsubWorkoutRef.current = useStore.subscribe((state, prevState) => {
      if (
        state.user === prevState.user &&
        state.workoutSessions === prevState.workoutSessions &&
        state.currentSession === prevState.currentSession &&
        state.routines === prevState.routines &&
        state.exercises === prevState.exercises &&
        state.personalRecords === prevState.personalRecords &&
        state.weightEntries === prevState.weightEntries &&
        state.exerciseGoals === prevState.exerciseGoals &&
        state.blockCustomizations === prevState.blockCustomizations
      ) return;
      debouncedSaveWorkoutData(uid, state.getCloudSyncData());
    });

    unsubDietRef.current = useDietStore.subscribe((state, prevState) => {
      if (
        state.customFoods === prevState.customFoods &&
        state.recipes === prevState.recipes &&
        state.meals === prevState.meals &&
        state.foodLog === prevState.foodLog &&
        state.recentFoodIds === prevState.recentFoodIds &&
        state.dietSettings === prevState.dietSettings &&
        state.streaks === prevState.streaks
      ) return;
      debouncedSaveDietData(uid, state.getCloudSyncData());
    });

    unsubCalendarRef.current = useCalendarStore.subscribe((state, prevState) => {
      if (
        state.events === prevState.events &&
        state.calendars === prevState.calendars &&
        state.settings === prevState.settings &&
        state.invitations === prevState.invitations
      ) return;
      debouncedSaveCalendarData(uid, state.getCloudSyncData());
    });
  }, [stopSync]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      const nextUid = user?.uid ?? null;
      const action = resolveAuthAction(
        establishedUidRef.current,
        nextUid,
        intentionalSignOutRef.current,
      );

      // `skip` — a re-fire for the uid we already own, OR an unexpected `null`
      // (a transient emission, or a session loss not initiated in-app).
      // Either way: nothing destructive. A resetStore/loadFromCloud here would
      // wipe a live session — the bug this controller exists to prevent.
      if (action === 'skip') {
        setLoading(false);
        return;
      }

      // `sign-out` — a genuine in-app sign-out (logout()/deleteAccount() set
      // the flag before triggering this null emission). Tear the session down.
      if (action === 'sign-out') {
        intentionalSignOutRef.current = false;
        controllerRef.current?.abort();
        controllerRef.current = null;
        establishedUidRef.current = null;
        stopSync();
        useStore.getState().resetStore();
        useDietStore.getState().resetStore();
        useCalendarStore.getState().resetStore();
        setLoading(false);
        return;
      }

      // `action === 'establish'` — a newly signed-in user (cold sign-in or a
      // user switch). resolveAuthAction only returns 'establish' for a
      // non-null uid, so `user` is non-null here; the guard keeps the
      // type-checker happy and fails safe.
      if (!user) {
        setLoading(false);
        return;
      }
      intentionalSignOutRef.current = false;

      // Supersede any in-flight chain, then claim the session up-front so a
      // re-fire that lands mid-await dedups instead of starting a duplicate.
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const { signal } = controller;
      establishedUidRef.current = user.uid;

      // Drop any prior chain's subscribers + cancel its pending debounced
      // writes before this chain loads.
      stopSync();

      let workoutData: Record<string, unknown> | null = null;
      let dietData: Record<string, unknown> | null = null;
      let calendarData: Record<string, unknown> | null = null;
      try {
        const results = await Promise.all([
          loadWorkoutData(user.uid),
          loadDietData(user.uid),
          loadCalendarData(user.uid),
        ]);
        workoutData = results[0];
        dietData = results[1];
        calendarData = results[2];
      } catch (error) {
        if (signal.aborted) return;
        console.error('Failed to load cloud data:', error);
      }

      // Still the owning chain? A newer establish or a sign-out aborts this
      // controller and moves establishedUidRef. A transiently-null
      // `auth.currentUser` is NOT treated as a transition — establishedUidRef
      // is the authority (see docs/plans/fix-authcontext-race.md §2.6).
      if (signal.aborted) return;
      if (establishedUidRef.current !== user.uid) return;
      if (auth.currentUser && auth.currentUser.uid !== user.uid) return;

      // Destructive phase — reset + hydrate as one synchronous block. Nothing
      // (no user write, no other chain) can interleave between the stores
      // being emptied and being hydrated.
      useStore.getState().resetStore();
      useDietStore.getState().resetStore();
      useCalendarStore.getState().resetStore();
      if (workoutData) {
        useStore.getState().loadFromCloud(workoutData);
      }
      if (dietData) {
        useDietStore.getState().loadFromCloud(dietData);
      }
      if (calendarData) {
        useCalendarStore.getState().loadFromCloud(calendarData);
      }

      // Subscribe AFTER hydration so the reset/load above never trips a sync
      // subscriber (no empty-state write).
      startSync(user.uid);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Abort the in-flight chain and drop the owned-session marker so a
      // StrictMode remount (or a real remount) re-hydrates instead of
      // dedup-bailing into a never-completed chain (stuck loading screen).
      controllerRef.current?.abort();
      controllerRef.current = null;
      establishedUidRef.current = null;
      stopSync();
    };
  }, [startSync, stopSync]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Send verification email immediately after signup
    await sendEmailVerification(credential.user);
  };

  const logout = async () => {
    // Flush current state to Firestore before signing out
    const user = auth.currentUser;
    if (user) {
      stopSync();
      try {
        await Promise.all([
          saveWorkoutData(user.uid, useStore.getState().getCloudSyncData()),
          saveDietData(user.uid, useDietStore.getState().getCloudSyncData()),
          saveCalendarData(user.uid, useCalendarStore.getState().getCloudSyncData()),
        ]);
      } catch (error) {
        console.error('Failed to save data before logout:', error);
      }
    }
    // Mark this as an in-app sign-out so the onAuthStateChanged null emission
    // is handled as a genuine sign-out, not ignored as a transient.
    intentionalSignOutRef.current = true;
    await signOut(auth);
    // Clear persisted localStorage data on logout
    localStorage.removeItem('workout-tracker-storage');
    localStorage.removeItem('diet-tracker-storage');
    localStorage.removeItem('calendar-storage');
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const sendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    await sendEmailVerification(user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const reauthenticate = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Not signed in');
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  const changePassword = async (newPassword: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    await updatePassword(user, newPassword);
  };

  const deleteAccount = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Not signed in');

    // Re-authenticate first (required by Firebase for account deletion)
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    const uid = user.uid;

    // Stop syncing before deletion
    stopSync();

    // Delete all user data: Firestore, Siri tokens, then the auth account
    try {
      await revokeSiriToken(uid);
    } catch {
      // Siri token may not exist — continue
    }
    await deleteUserCloudData(uid);

    // Mark this as an in-app sign-out before the account deletion triggers
    // the onAuthStateChanged null emission.
    intentionalSignOutRef.current = true;

    // Delete the Firebase Auth account (point of no return)
    await deleteUser(user);

    // Clear local data
    localStorage.removeItem('workout-tracker-storage');
    localStorage.removeItem('diet-tracker-storage');
    localStorage.removeItem('calendar-storage');
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
    sendVerificationEmail,
    resetPassword,
    reauthenticate,
    changePassword,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
