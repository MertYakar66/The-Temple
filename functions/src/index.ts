import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// ============================================
// Auth helper: validate Siri token → userId
// ============================================

async function authenticateToken(
  req: { headers: Record<string, unknown>; query: Record<string, unknown> }
): Promise<string | null> {
  const token =
    (req.headers["x-siri-token"] as string) ||
    (req.query.token as string);
  if (!token) return null;

  const snap = await db.collection("siriTokens").doc(token).get();
  if (!snap.exists) return null;

  return (snap.data()?.userId as string) || null;
}

// ============================================
// Formatting helpers
// ============================================

function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

function todayDateString(tz?: string): string {
  // Returns YYYY-MM-DD for "today" in the given timezone
  try {
    if (tz) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      return parts; // en-CA gives YYYY-MM-DD
    }
  } catch {
    // invalid timezone, fall through
  }
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeek(tz?: string): number {
  try {
    if (tz) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "short",
      });
      const dayName = formatter.format(new Date());
      const map: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
      };
      return map[dayName] ?? new Date().getDay();
    }
  } catch {
    // fall through
  }
  return new Date().getDay();
}

// ============================================
// Interfaces matching Firestore data shapes
// ============================================

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location?: string;
  isDeleted: boolean;
  calendarId: string;
}

interface Routine {
  id: string;
  name: string;
  program?: string;
  dayOfWeek?: number[];
  exercises: RoutineExercise[];
}

interface RoutineExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  restSeconds: number;
  notes?: string;
}

interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
}

interface FoodLogEntry {
  date: string;
  mealType: string;
  type: string;
  food?: { name: string };
  recipe?: { name: string };
  meal?: { name: string };
  servings: number;
  macros: { calories: number; protein: number; carbs: number; fat: number };
}

interface DietGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  goalType: string;
}

interface DietSettings {
  goals: DietGoals;
}

// ============================================
// ENDPOINT: Daily Briefing (full summary)
// ============================================

export const siriDailyBriefing = onRequest({ cors: true }, async (req, res) => {
  const userId = await authenticateToken(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized. Invalid or missing Siri token." });
    return;
  }

  const tz = (req.query.tz as string) || undefined;
  const today = todayDateString(tz);
  const dayOfWeek = getDayOfWeek(tz);

  // Load all data in parallel
  const [calendarSnap, workoutSnap, dietSnap] = await Promise.all([
    db.doc(`users/${userId}/data/calendar`).get(),
    db.doc(`users/${userId}/data/workout`).get(),
    db.doc(`users/${userId}/data/diet`).get(),
  ]);

  const parts: string[] = [];

  // --- Schedule ---
  const calData = calendarSnap.data();
  const events = ((calData?.events as CalendarEvent[]) || [])
    .filter((e) => !e.isDeleted && e.startDate.startsWith(today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (events.length > 0) {
    const eventLines = events.map((e) => {
      const time = e.isAllDay ? "All day" : formatTime(e.startDate);
      return `${time} — ${e.title}${e.location ? ` at ${e.location}` : ""}`;
    });
    parts.push(
      `You have ${events.length} event${events.length !== 1 ? "s" : ""} today: ${eventLines.join(". ")}.`
    );
  } else {
    parts.push("You have no events scheduled for today.");
  }

  // --- Workout ---
  const wData = workoutSnap.data();
  const routines = (wData?.routines as Routine[]) || [];
  const exercises = (wData?.exercises as Exercise[]) || [];
  const todayRoutines = routines.filter(
    (r) => r.dayOfWeek && r.dayOfWeek.includes(dayOfWeek)
  );

  if (todayRoutines.length > 0) {
    const routineParts = todayRoutines.map((r) => {
      const exerciseNames = r.exercises
        .map((re) => {
          const ex = exercises.find((e) => e.id === re.exerciseId);
          return ex ? ex.name : "Unknown exercise";
        })
        .slice(0, 5);
      const suffix = r.exercises.length > 5
        ? ` and ${r.exercises.length - 5} more`
        : "";
      return `${r.name}: ${exerciseNames.join(", ")}${suffix}`;
    });
    parts.push(`Today's workout: ${routineParts.join(". ")}.`);
  } else {
    parts.push("No workout scheduled for today. It's a rest day.");
  }

  // --- Nutrition ---
  const dData = dietSnap.data();
  const foodLog = (dData?.foodLog as FoodLogEntry[]) || [];
  const dietSettings = dData?.dietSettings as DietSettings | undefined;
  const todayLog = foodLog.filter((entry) => entry.date === today);

  if (dietSettings?.goals) {
    const totals = todayLog.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.macros.calories * entry.servings,
        protein: acc.protein + entry.macros.protein * entry.servings,
        carbs: acc.carbs + entry.macros.carbs * entry.servings,
        fat: acc.fat + entry.macros.fat * entry.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const goals = dietSettings.goals;
    const calRemaining = Math.round(goals.dailyCalories - totals.calories);
    const protRemaining = Math.round(goals.dailyProtein - totals.protein);

    if (todayLog.length === 0) {
      parts.push(
        `You haven't logged any food yet today. Your targets are ${goals.dailyCalories} calories and ${goals.dailyProtein}g protein.`
      );
    } else {
      parts.push(
        `Nutrition so far: ${Math.round(totals.calories)} of ${goals.dailyCalories} calories, ${Math.round(totals.protein)}g of ${goals.dailyProtein}g protein. You have ${calRemaining} calories and ${protRemaining}g protein remaining.`
      );
    }
  }

  res.json({ text: parts.join(" ") });
});

// ============================================
// ENDPOINT: Today's Schedule
// ============================================

export const siriSchedule = onRequest({ cors: true }, async (req, res) => {
  const userId = await authenticateToken(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized. Invalid or missing Siri token." });
    return;
  }

  const tz = (req.query.tz as string) || undefined;
  const today = todayDateString(tz);

  const calendarSnap = await db.doc(`users/${userId}/data/calendar`).get();
  const calData = calendarSnap.data();
  const events = ((calData?.events as CalendarEvent[]) || [])
    .filter((e) => !e.isDeleted && e.startDate.startsWith(today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (events.length === 0) {
    res.json({ text: "You have no events scheduled for today." });
    return;
  }

  const lines = events.map((e) => {
    const time = e.isAllDay ? "All day" : formatTime(e.startDate);
    return `${time} — ${e.title}${e.location ? ` at ${e.location}` : ""}`;
  });

  res.json({
    text: `You have ${events.length} event${events.length !== 1 ? "s" : ""} today. ${lines.join(". ")}.`,
  });
});

// ============================================
// ENDPOINT: Today's Workout
// ============================================

export const siriWorkout = onRequest({ cors: true }, async (req, res) => {
  const userId = await authenticateToken(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized. Invalid or missing Siri token." });
    return;
  }

  const tz = (req.query.tz as string) || undefined;
  const dayOfWeek = getDayOfWeek(tz);

  const workoutSnap = await db.doc(`users/${userId}/data/workout`).get();
  const wData = workoutSnap.data();
  const routines = (wData?.routines as Routine[]) || [];
  const exercises = (wData?.exercises as Exercise[]) || [];

  const todayRoutines = routines.filter(
    (r) => r.dayOfWeek && r.dayOfWeek.includes(dayOfWeek)
  );

  if (todayRoutines.length === 0) {
    res.json({ text: "No workout scheduled for today. It's a rest day. Enjoy your recovery!" });
    return;
  }

  const parts = todayRoutines.map((r) => {
    const exerciseDetails = r.exercises.map((re) => {
      const ex = exercises.find((e) => e.id === re.exerciseId);
      const name = ex ? ex.name : "Unknown exercise";
      return `${name}, ${re.targetSets} sets of ${re.targetReps} reps`;
    });
    return `${r.name}: ${exerciseDetails.join(". ")}`;
  });

  res.json({
    text: `Today's workout: ${parts.join(". ")}.`,
  });
});

// ============================================
// ENDPOINT: Today's Nutrition
// ============================================

export const siriNutrition = onRequest({ cors: true }, async (req, res) => {
  const userId = await authenticateToken(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized. Invalid or missing Siri token." });
    return;
  }

  const tz = (req.query.tz as string) || undefined;
  const today = todayDateString(tz);

  const dietSnap = await db.doc(`users/${userId}/data/diet`).get();
  const dData = dietSnap.data();
  const foodLog = (dData?.foodLog as FoodLogEntry[]) || [];
  const dietSettings = dData?.dietSettings as DietSettings | undefined;
  const todayLog = foodLog.filter((entry) => entry.date === today);

  if (!dietSettings?.goals) {
    res.json({ text: "You haven't set up your nutrition goals yet. Open the app to configure them." });
    return;
  }

  const totals = todayLog.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.macros.calories * entry.servings,
      protein: acc.protein + entry.macros.protein * entry.servings,
      carbs: acc.carbs + entry.macros.carbs * entry.servings,
      fat: acc.fat + entry.macros.fat * entry.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goals = dietSettings.goals;
  const calRemaining = Math.round(goals.dailyCalories - totals.calories);
  const protRemaining = Math.round(goals.dailyProtein - totals.protein);

  if (todayLog.length === 0) {
    res.json({
      text: `You haven't logged any food yet today. Your daily targets are ${goals.dailyCalories} calories, ${goals.dailyProtein}g protein, ${goals.dailyCarbs}g carbs, and ${goals.dailyFat}g fat.`,
    });
    return;
  }

  const mealBreakdown = todayLog.reduce<Record<string, number>>((acc, entry) => {
    const meal = entry.mealType || "Other";
    acc[meal] = (acc[meal] || 0) + Math.round(entry.macros.calories * entry.servings);
    return acc;
  }, {});

  const mealParts = Object.entries(mealBreakdown)
    .map(([meal, cal]) => `${meal}: ${cal} cal`)
    .join(", ");

  res.json({
    text: `Today's nutrition: ${Math.round(totals.calories)} of ${goals.dailyCalories} calories, ${Math.round(totals.protein)}g of ${goals.dailyProtein}g protein. ${calRemaining > 0 ? `${calRemaining} calories and ${protRemaining}g protein remaining.` : "You've reached your calorie target."} Breakdown: ${mealParts}.`,
  });
});
