import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
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
} from '../lib/firestoreSync';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
    // Subscribe to workout store changes → save to Firestore
    unsubWorkoutRef.current = useStore.subscribe(() => {
      const data = useStore.getState().getCloudSyncData();
      debouncedSaveWorkoutData(uid, data);
    });

    // Subscribe to diet store changes → save to Firestore
    unsubDietRef.current = useDietStore.subscribe(() => {
      const data = useDietStore.getState().getCloudSyncData();
      debouncedSaveDietData(uid, data);
    });

    // Subscribe to calendar store changes → save to Firestore
    unsubCalendarRef.current = useCalendarStore.subscribe(() => {
      const data = useCalendarStore.getState().getCloudSyncData();
      debouncedSaveCalendarData(uid, data);
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
    await createUserWithEmailAndPassword(auth, email, password);
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

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
