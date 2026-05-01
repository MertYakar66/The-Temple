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

  const startSync = useCallback((uid: string) => {
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
  }, []);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Clear any existing data from previous user before loading new user's data
        useStore.getState().resetStore();
        useDietStore.getState().resetStore();
        useCalendarStore.getState().resetStore();

        // Load data from Firestore
        try {
          const [workoutData, dietData, calendarData] = await Promise.all([
            loadWorkoutData(user.uid),
            loadDietData(user.uid),
            loadCalendarData(user.uid),
          ]);

          if (workoutData) {
            useStore.getState().loadFromCloud(workoutData);
          }
          if (dietData) {
            useDietStore.getState().loadFromCloud(dietData);
          }
          if (calendarData) {
            useCalendarStore.getState().loadFromCloud(calendarData);
          }
        } catch (error) {
          console.error('Failed to load cloud data:', error);
        }

        // Start syncing store changes to Firestore
        startSync(user.uid);
      } else {
        // User logged out — stop syncing and clear local data
        stopSync();
        useStore.getState().resetStore();
        useDietStore.getState().resetStore();
        useCalendarStore.getState().resetStore();
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
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
