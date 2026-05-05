/**
 * Cloud Functions — Siri integration endpoints.
 *
 * Four HTTPS endpoints (siriDailyBriefing, siriSchedule, siriWorkout,
 * siriNutrition) deployed to us-central1. Each authenticates via a
 * per-user random token validated against `siriTokens/{token}` and
 * cached in-process for 60 s.
 *
 * BYPASSES FIRESTORE RULES via Admin SDK — input validation matters.
 *
 * Active Batch 5 territory (docs/AUDIT_STATE.md):
 *  - The `todayDateString(tz)` fallback at line ~99 falls back to UTC
 *    when `tz` is missing or invalid. Should require `tz` (return 400)
 *    or use `users/{uid}/data/siriConfig.timezone`.
 *  - Functions read stored events without expanding `recurrenceRule`,
 *    so weekly events speak the original master start date instead of
 *    today's occurrence. Need server-side expansion (likely shared
 *    with src/utils/calendar.ts after Batch 4).
 */
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// ============================================
// Auth helper: validate Siri token → userId
// ============================================

const TOKEN_PATTERN = /^[A-Za-z0-9]{8}-[A-Za-z0-9]{8}-[A-Za-z0-9]{8}-[A-Za-z0-9]{8}$/;

// In-process token → userId cache with TTL. Warm function instances reuse this
// map across requests, saving one Firestore read per call on hot paths. A
// 60-second TTL is short enough that revoked tokens stop working quickly.
const TOKEN_CACHE_TTL_MS = 60 * 1000;
const TOKEN_CACHE_MAX = 128;
const tokenCache = new Map<string, { userId: string; expiresAt: number }>();

function cacheGet(token: string): string | null {
  const entry = tokenCache.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    tokenCache.delete(token);
    return null;
  }
  return entry.userId;
}

function cacheSet(token: string, userId: string): void {
  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    // Evict the oldest entry. Map preserves insertion order.
    const oldestKey = tokenCache.keys().next().value;
    if (oldestKey !== undefined) tokenCache.delete(oldestKey);
  }
  tokenCache.set(token, { userId, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
}

async function authenticateToken(
  req: { headers: Record<string, unknown>; query: Record<string, unknown> }
): Promise<string | null> {
  const token =
    (req.headers["x-siri-token"] as string) ||
    (req.query.token as string);
  if (!token || !TOKEN_PATTERN.test(token)) return null;

  const cached = cacheGet(token);
  if (cached) return cached;

  try {
    const snap = await db.collection("siriTokens").doc(token).get();
    if (!snap.exists) return null;
    const userId = (snap.data()?.userId as string) || null;
    if (userId) cacheSet(token, userId);
    return userId;
  } catch (err) {
    console.error("Token lookup failed:", err);
    return null;
  }
}

// ============================================
// Formatting helpers
// ============================================

function formatTime(isoDate: string, tz?: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "Unknown time";
  try {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      ...(tz ? { timeZone: tz } : {}),
    });
  } catch {
    // invalid timezone, fall back to UTC formatting
    const h = d.getUTCHours();
    const m = d.getUTCMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  }
}

function todayDateString(tz?: string): string {
  try {
    if (tz) {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    }
  } catch {
    // invalid timezone, fall through to UTC
  }
  return new Date().toISOString().split("T")[0];
}

// Returns 0=Sun..6=Sat, matching JS Date.getDay() and the app's Routine.dayOfWeek
function getDayOfWeek(tz?: string): number {
  try {
    if (tz) {
      const dayName = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "short",
      }).format(new Date());
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

// Safe macro accumulator — handles missing/corrupted data
function sumMacros(entries: unknown[]): { calories: number; protein: number; carbs: number; fat: number } {
  return entries.reduce<{ calories: number; protein: number; carbs: number; fat: number }>(
    (acc, raw) => {
      const entry = raw as Record<string, unknown>;
      const macros = entry?.macros as Record<string, number> | undefined;
      const servings = typeof entry?.servings === "number" ? entry.servings : 1;
      if (!macros) return acc;
      return {
        calories: acc.calories + (macros.calories || 0) * servings,
        protein: acc.protein + (macros.protein || 0) * servings,
        carbs: acc.carbs + (macros.carbs || 0) * servings,
        fat: acc.fat + (macros.fat || 0) * servings,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Safe array getter from Firestore data
function safeArray<T>(data: Record<string, unknown> | undefined, key: string): T[] {
  if (!data) return [];
  const val = data[key];
  return Array.isArray(val) ? val as T[] : [];
}

// Build a Map<id, name> for O(1) lookups — previously each routine exercise
// triggered a linear scan across the full exercise list per render.
function buildExerciseNameMap(exercises: Exercise[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const ex of exercises) {
    if (ex?.id && ex?.name) map.set(ex.id, ex.name);
  }
  return map;
}

// Shared "today" filter: same event shape logic used across endpoints.
function filterTodayEvents(events: CalendarEvent[], today: string): CalendarEvent[] {
  return events
    .filter((e) => !e.isDeleted && typeof e.startDate === "string" && e.startDate.startsWith(today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// Routines whose dayOfWeek array covers the given weekday.
function filterTodayRoutines(routines: Routine[], dayOfWeek: number): Routine[] {
  return routines.filter(
    (r) => Array.isArray(r.dayOfWeek) && r.dayOfWeek.includes(dayOfWeek)
  );
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
  exercises?: RoutineExercise[];
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
  try {
    const userId = await authenticateToken(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized. Invalid or missing Siri token." });
      return;
    }

    const tz = (req.query.tz as string) || undefined;
    const today = todayDateString(tz);
    const dayOfWeek = getDayOfWeek(tz);

    const [calendarSnap, workoutSnap, dietSnap] = await Promise.all([
      db.doc(`users/${userId}/data/calendar`).get(),
      db.doc(`users/${userId}/data/workout`).get(),
      db.doc(`users/${userId}/data/diet`).get(),
    ]);

    const parts: string[] = [];

    // --- Schedule ---
    const events = filterTodayEvents(
      safeArray<CalendarEvent>(calendarSnap.data(), "events"),
      today
    );

    if (events.length > 0) {
      const eventLines = events.map((e) => {
        const time = e.isAllDay ? "All day" : formatTime(e.startDate, tz);
        return `${time} — ${e.title || "Untitled"}${e.location ? ` at ${e.location}` : ""}`;
      });
      parts.push(
        `You have ${events.length} event${events.length !== 1 ? "s" : ""} today: ${eventLines.join(". ")}.`
      );
    } else {
      parts.push("You have no events scheduled for today.");
    }

    // --- Workout ---
    const wData = workoutSnap.data();
    const routines = safeArray<Routine>(wData, "routines");
    const exerciseMap = buildExerciseNameMap(safeArray<Exercise>(wData, "exercises"));
    const todayRoutines = filterTodayRoutines(routines, dayOfWeek);

    if (todayRoutines.length > 0) {
      const routineParts = todayRoutines.map((r) => {
        const rExercises = r.exercises || [];
        const exerciseNames = rExercises
          .map((re) => exerciseMap.get(re.exerciseId) || "Unknown exercise")
          .slice(0, 5);
        const suffix = rExercises.length > 5
          ? ` and ${rExercises.length - 5} more`
          : "";
        return `${r.name}: ${exerciseNames.join(", ")}${suffix}`;
      });
      parts.push(`Today's workout: ${routineParts.join(". ")}.`);
    } else {
      parts.push("No workout scheduled for today. It's a rest day.");
    }

    // --- Nutrition ---
    const dData = dietSnap.data();
    const foodLog = safeArray<FoodLogEntry>(dData, "foodLog");
    const dietSettings = (dData?.dietSettings as DietSettings) || undefined;
    const todayLog = foodLog.filter((entry) => entry.date === today);

    if (dietSettings?.goals) {
      const totals = sumMacros(todayLog);
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
  } catch (err) {
    console.error("siriDailyBriefing error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ============================================
// ENDPOINT: Today's Schedule
// ============================================

export const siriSchedule = onRequest({ cors: true }, async (req, res) => {
  try {
    const userId = await authenticateToken(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized. Invalid or missing Siri token." });
      return;
    }

    const tz = (req.query.tz as string) || undefined;
    const today = todayDateString(tz);

    const calendarSnap = await db.doc(`users/${userId}/data/calendar`).get();
    const events = filterTodayEvents(
      safeArray<CalendarEvent>(calendarSnap.data(), "events"),
      today
    );

    if (events.length === 0) {
      res.json({ text: "You have no events scheduled for today." });
      return;
    }

    const lines = events.map((e) => {
      const time = e.isAllDay ? "All day" : formatTime(e.startDate, tz);
      return `${time} — ${e.title || "Untitled"}${e.location ? ` at ${e.location}` : ""}`;
    });

    res.json({
      text: `You have ${events.length} event${events.length !== 1 ? "s" : ""} today. ${lines.join(". ")}.`,
    });
  } catch (err) {
    console.error("siriSchedule error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ============================================
// ENDPOINT: Today's Workout
// ============================================

export const siriWorkout = onRequest({ cors: true }, async (req, res) => {
  try {
    const userId = await authenticateToken(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized. Invalid or missing Siri token." });
      return;
    }

    const tz = (req.query.tz as string) || undefined;
    const dayOfWeek = getDayOfWeek(tz);

    const workoutSnap = await db.doc(`users/${userId}/data/workout`).get();
    const wData = workoutSnap.data();
    const routines = safeArray<Routine>(wData, "routines");
    const exerciseMap = buildExerciseNameMap(safeArray<Exercise>(wData, "exercises"));

    const todayRoutines = filterTodayRoutines(routines, dayOfWeek);

    if (todayRoutines.length === 0) {
      res.json({ text: "No workout scheduled for today. It's a rest day. Enjoy your recovery!" });
      return;
    }

    const parts = todayRoutines.map((r) => {
      const rExercises = r.exercises || [];
      const exerciseDetails = rExercises.map((re) => {
        const name = exerciseMap.get(re.exerciseId) || "Unknown exercise";
        return `${name}, ${re.targetSets || 0} sets of ${re.targetReps || 0} reps`;
      });
      return `${r.name}: ${exerciseDetails.join(". ")}`;
    });

    res.json({
      text: `Today's workout: ${parts.join(". ")}.`,
    });
  } catch (err) {
    console.error("siriWorkout error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ============================================
// ENDPOINT: Today's Nutrition
// ============================================

export const siriNutrition = onRequest({ cors: true }, async (req, res) => {
  try {
    const userId = await authenticateToken(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized. Invalid or missing Siri token." });
      return;
    }

    const tz = (req.query.tz as string) || undefined;
    const today = todayDateString(tz);

    const dietSnap = await db.doc(`users/${userId}/data/diet`).get();
    const dData = dietSnap.data();
    const foodLog = safeArray<FoodLogEntry>(dData, "foodLog");
    const dietSettings = (dData?.dietSettings as DietSettings) || undefined;
    const todayLog = foodLog.filter((entry) => entry.date === today);

    if (!dietSettings?.goals) {
      res.json({ text: "You haven't set up your nutrition goals yet. Open the app to configure them." });
      return;
    }

    const totals = sumMacros(todayLog);
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
      const macros = entry.macros;
      const servings = typeof entry.servings === "number" ? entry.servings : 1;
      const meal = entry.mealType || "Other";
      acc[meal] = (acc[meal] || 0) + Math.round((macros?.calories || 0) * servings);
      return acc;
    }, {});

    const mealParts = Object.entries(mealBreakdown)
      .map(([meal, cal]) => `${meal}: ${cal} cal`)
      .join(", ");

    res.json({
      text: `Today's nutrition: ${Math.round(totals.calories)} of ${goals.dailyCalories} calories, ${Math.round(totals.protein)}g of ${goals.dailyProtein}g protein. ${calRemaining > 0 ? `${calRemaining} calories and ${protRemaining}g protein remaining.` : "You've reached your calorie target."} Breakdown: ${mealParts}.`,
    });
  } catch (err) {
    console.error("siriNutrition error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});
