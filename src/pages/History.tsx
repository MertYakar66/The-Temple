import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Dumbbell,
  Clock,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Utensils,
  Target,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  subDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { useStore } from '../store/useStore';
import { useDietStore } from '../store/useDietStore';
import type { WorkoutSession, MealType, UnitSystem } from '../types';
import {
  getCompletedSetCount,
  getSessionDurationMinutes,
  getTotalVolume,
} from '../utils/workoutMetrics';
import { kgToDisplay, getWeightUnit } from '../utils/weight';
import { getDateStamp, parseDateStamp } from '../utils/date';

// Known display labels for the canonical mealTypes. Custom mealType strings
// (anything not listed here) are humanized at render time via humanizeMealType.
const KNOWN_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
};

// Canonical sort order for known mealTypes. Acts as a sort priority, not a
// filter — custom strings still render, appended in first-appearance order.
const KNOWN_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

function humanizeMealType(mt: MealType): string {
  if (KNOWN_LABELS[mt]) return KNOWN_LABELS[mt];
  return mt
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Optional ?date=YYYY-MM-DD deep-link (e.g. from the Dashboard "Recent
// Workouts" card) opens History on that day. Falls back to today for a
// missing or malformed value.
function getInitialSelectedDate(dateParam: string | null): Date {
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const parsed = parseDateStamp(dateParam);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

// How many day-groups the "All Workouts" list reveals per "Show more" click.
const DAYS_PER_PAGE = 15;

// Human header for a day-group in the All Workouts list: "Today" / "Yesterday"
// for the two most recent days, otherwise the full weekday-date. Parses the
// stamp via parseDateStamp (never `new Date(str)`) to avoid UTC drift.
function formatDayHeader(dateStamp: string, todayStamp: string, yesterdayStamp: string): string {
  if (dateStamp === todayStamp) return 'Today';
  if (dateStamp === yesterdayStamp) return 'Yesterday';
  return format(parseDateStamp(dateStamp), 'EEEE, MMMM d');
}

export function History() {
  const workoutSessions = useStore((state) => state.workoutSessions);
  const routines = useStore((state) => state.routines);
  const user = useStore((state) => state.user);
  const deleteWorkoutSession = useStore((state) => state.deleteWorkoutSession);
  const getLogEntriesForDate = useDietStore((state) => state.getLogEntriesForDate);
  const getDailyMacros = useDietStore((state) => state.getDailyMacros);
  const dietSettings = useDietStore((state) => state.dietSettings);
  const deleteLogEntry = useDietStore((state) => state.deleteLogEntry);
  const foodLog = useDietStore((state) => state.foodLog);

  const unitSystem = user?.unitSystem || 'metric';

  const [searchParams] = useSearchParams();
  const initialDate = getInitialSelectedDate(searchParams.get('date'));

  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
  // "All Workouts" browse list: how many day-groups are currently revealed.
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Presence sets for the calendar grid: build each in a single pass over its
  // source array, then do O(1) membership per day cell (was ~42 full-array
  // filters of workoutSessions and foodLog on every render).
  const workoutDaySet = useMemo(
    () => new Set(workoutSessions.map((ws) => ws.date)),
    [workoutSessions]
  );
  const dietDaySet = useMemo(
    () => new Set(foodLog.map((e) => e.date)),
    [foodLog]
  );

  // Group every workout by its date stamp for the "All Workouts" browse list:
  // newest day first, and within a day newest session first (by startTime).
  // Memoized so pagination / unrelated re-renders don't regroup the full
  // history on every render.
  const workoutsByDay = useMemo(() => {
    const groups = new Map<string, WorkoutSession[]>();
    for (const ws of workoutSessions) {
      const bucket = groups.get(ws.date);
      if (bucket) bucket.push(ws);
      else groups.set(ws.date, [ws]);
    }
    return [...groups.keys()]
      // `YYYY-MM-DD` stamps sort lexicographically == chronologically.
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date,
        sessions: groups
          .get(date)!
          .slice()
          // Newest session first; startTime is an ISO string when present,
          // missing ones (empty) sort to the end of the day.
          .sort((a, b) => (b.startTime ?? '').localeCompare(a.startTime ?? '')),
      }));
  }, [workoutSessions]);

  const todayStamp = getDateStamp();
  const yesterdayStamp = getDateStamp(subDays(new Date(), 1));
  // Sessions hidden below the current page, for the "Show more (N …)" label.
  const remainingWorkouts = workoutsByDay
    .slice(visibleDays)
    .reduce((sum, group) => sum + group.sessions.length, 0);

  const getWorkoutsForDate = (date: Date): WorkoutSession[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return workoutSessions.filter((ws) => ws.date === dateStr);
  };

  const getDietEntriesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getLogEntriesForDate(dateStr);
  };

  const selectedDateWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : [];
  const selectedDateDiet = selectedDate ? getDietEntriesForDate(selectedDate) : [];
  const selectedDateMacros = selectedDate ? getDailyMacros(format(selectedDate, 'yyyy-MM-dd')) : null;

  // Check if selected date had a workout for target calculation
  const isTrainingDay = selectedDateWorkouts.length > 0;

  // Calculate targets for the selected date
  const targets = {
    calories: dietSettings.goals.dailyCalories + (isTrainingDay ? dietSettings.goals.trainingDayCalorieAdjustment : 0),
    protein: dietSettings.goals.dailyProtein + (isTrainingDay ? dietSettings.goals.trainingDayProteinAdjustment : 0),
    carbs: dietSettings.goals.dailyCarbs,
    fat: dietSettings.goals.dailyFat,
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Build the visible mealType list from this day's entries: known
  // mealTypes first (in canonical order), then any custom strings appended
  // in first-appearance order. Empty mealTypes are filtered out — History
  // only shows what was logged. Cheap: operates on the selected day only.
  const presentMealTypes = new Set(selectedDateDiet.map((e) => e.mealType));
  const knownVisible = KNOWN_ORDER.filter((mt) => presentMealTypes.has(mt));
  const seenForCustom = new Set<string>(KNOWN_ORDER);
  const customVisible: MealType[] = [];
  for (const e of selectedDateDiet) {
    if (!seenForCustom.has(e.mealType)) {
      seenForCustom.add(e.mealType);
      customVisible.push(e.mealType);
    }
  }
  const visibleMealTypes: MealType[] = [...knownVisible, ...customVisible];

  const entriesByMealType = visibleMealTypes.reduce((acc, mealType) => {
    acc[mealType] = selectedDateDiet.filter((e) => e.mealType === mealType);
    return acc;
  }, {} as Record<string, typeof selectedDateDiet>);

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History</h1>

      {/* Calendar */}
      <div className="card">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayStr = getDateStamp(day);
            const hasWorkout = workoutDaySet.has(dayStr);
            const hasDiet = dietDaySet.has(dayStr);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                  transition-colors relative
                  ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                  ${isSelected ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  ${isToday && !isSelected ? 'ring-2 ring-primary-600' : ''}
                `}
              >
                <span>{format(day, 'd')}</span>
                {/* Activity indicators */}
                <div className="absolute bottom-1 flex gap-0.5">
                  {hasWorkout && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary-600'}`} />
                  )}
                  {hasDiet && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary-600" />
            <span>Workout</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Diet Logged</span>
          </div>
        </div>
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('workout')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'workout'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Workouts ({selectedDateWorkouts.length})
            </button>
            <button
              onClick={() => setActiveTab('diet')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'diet'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Utensils className="w-4 h-4" />
              Diet ({selectedDateDiet.length})
            </button>
          </div>

          {/* Workout Tab */}
          {activeTab === 'workout' && (
            <>
              {selectedDateWorkouts.length === 0 ? (
                <div className="card text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No workouts on this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateWorkouts.map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      workout={workout}
                      routines={routines}
                      onDelete={() => deleteWorkoutSession(workout.id)}
                      unitSystem={unitSystem}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Diet Tab */}
          {activeTab === 'diet' && (
            <>
              {/* Daily Summary */}
              {selectedDateMacros && selectedDateDiet.length > 0 && (
                <div className="card mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary-500" />
                      Daily Summary
                    </h3>
                    {isTrainingDay && (
                      <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                        Training Day
                      </span>
                    )}
                  </div>

                  {/* Macro comparison grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Calories */}
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(selectedDateMacros.calories)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ {targets.calories}</span>
                      </div>
                      <div className={`text-xs mt-1 flex items-center gap-1 ${
                        selectedDateMacros.calories <= targets.calories * 1.1
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-500'
                      }`}>
                        {selectedDateMacros.calories <= targets.calories ? (
                          <><CheckCircle2 className="w-3 h-3" /> On target</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> {Math.round(selectedDateMacros.calories - targets.calories)} over</>
                        )}
                      </div>
                    </div>

                    {/* Protein */}
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Beef className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Protein</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(selectedDateMacros.protein)}g
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ {targets.protein}g</span>
                      </div>
                      <div className={`text-xs mt-1 flex items-center gap-1 ${
                        selectedDateMacros.protein >= targets.protein * 0.9
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {selectedDateMacros.protein >= targets.protein ? (
                          <><CheckCircle2 className="w-3 h-3" /> Goal hit!</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> {Math.round(targets.protein - selectedDateMacros.protein)}g short</>
                        )}
                      </div>
                    </div>

                    {/* Carbs */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Wheat className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Carbs</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(selectedDateMacros.carbs)}g
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ {targets.carbs}g</span>
                      </div>
                    </div>

                    {/* Fat */}
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplet className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fat</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(selectedDateMacros.fat)}g
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ {targets.fat}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Meals breakdown */}
              {selectedDateDiet.length === 0 ? (
                <div className="card text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No meals logged on this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleMealTypes.map((mealType) => {
                    const mealEntries = entriesByMealType[mealType];
                    const mealMacros = mealEntries.reduce(
                      (acc, e) => ({
                        calories: acc.calories + e.macros.calories,
                        protein: acc.protein + e.macros.protein,
                        carbs: acc.carbs + e.macros.carbs,
                        fat: acc.fat + e.macros.fat,
                      }),
                      { calories: 0, protein: 0, carbs: 0, fat: 0 }
                    );

                    return (
                      <div key={mealType} className="card">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">{humanizeMealType(mealType)}</h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {Math.round(mealMacros.calories)} cal • {Math.round(mealMacros.protein)}g P
                          </span>
                        </div>
                        <div className="space-y-2">
                          {mealEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div className="flex-1">
                                <p className="text-gray-900 dark:text-white">
                                  {entry.type === 'food' && entry.food?.name}
                                  {entry.type === 'meal' && entry.meal?.name}
                                  {entry.type === 'recipe' && entry.recipe?.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {entry.servings !== 1 && `${entry.servings}x • `}
                                  {Math.round(entry.macros.calories)} cal
                                </p>
                              </div>
                              <div className="text-right text-sm text-gray-500 dark:text-gray-400 mr-2">
                                <p>{Math.round(entry.macros.protein)}g P</p>
                                <p>{Math.round(entry.macros.carbs)}g C • {Math.round(entry.macros.fat)}g F</p>
                              </div>
                              <button
                                onClick={() => deleteLogEntry(entry.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* All Workouts — browse every session, grouped by day, newest first.
          The calendar above is the jump-to-a-specific-day control; this is the
          scroll-and-browse-everything control. */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">All Workouts</h2>
        {workoutSessions.length === 0 ? (
          <div className="card text-center py-8">
            <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No workout history yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {workoutsByDay.slice(0, visibleDays).map(({ date, sessions }) => (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {formatDayHeader(date, todayStamp, yesterdayStamp)}
                </h3>
                {sessions.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    routines={routines}
                    onDelete={() => deleteWorkoutSession(workout.id)}
                    unitSystem={unitSystem}
                  />
                ))}
              </div>
            ))}

            {workoutsByDay.length > visibleDays && (
              <button
                onClick={() => setVisibleDays((v) => v + DAYS_PER_PAGE)}
                className="w-full py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Show more ({remainingWorkouts} earlier workout{remainingWorkouts === 1 ? '' : 's'})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkoutCard({
  workout,
  routines,
  onDelete,
  unitSystem,
  compact = false
}: {
  workout: WorkoutSession;
  routines: ReturnType<typeof useStore.getState>['routines'];
  onDelete?: () => void;
  unitSystem: UnitSystem;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const totalSets = getCompletedSetCount(workout.exercises);
  const totalVolume = getTotalVolume(workout.exercises);
  const duration = getSessionDurationMinutes(workout);
  const weightUnit = getWeightUnit(unitSystem);

  // Find the routine if this workout was based on one
  const routine = workout.routineId ? routines.find(r => r.id === workout.routineId) : null;

  // Calculate planned vs actual if routine exists
  const plannedSets = routine
    ? routine.exercises.reduce((acc, ex) => acc + ex.targetSets, 0)
    : null;

  const plannedExercises = routine ? routine.exercises.length : null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="card">
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            Delete this workout? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header row: the expand toggle, delete, and chevron are sibling buttons —
          never nested (a <button> inside a <button> is invalid HTML and
          ambiguous for assistive tech). */}
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={compact ? undefined : expanded}
          className="flex-1 min-w-0 text-left"
        >
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{workout.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{workout.date}</p>
            {routine && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                From routine: {routine.name}
              </p>
            )}
          </div>

          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span>{workout.exercises.length} exercises</span>
            <span>{totalSets} sets</span>
            <span>{Math.round(kgToDisplay(totalVolume, unitSystem)).toLocaleString()} {weightUnit}</span>
          </div>

          {/* Planned vs Actual comparison */}
          {routine && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Planned vs Actual</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Exercises:</span>
                  <span className={`font-medium ${
                    workout.exercises.length >= (plannedExercises || 0)
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {workout.exercises.length} / {plannedExercises}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Sets:</span>
                  <span className={`font-medium ${
                    totalSets >= (plannedSets || 0)
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {totalSets} / {plannedSets}
                  </span>
                </div>
              </div>
            </div>
          )}
        </button>

        {/* Controls hoisted out of the toggle button so no interactive element
            is nested inside another. */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {duration && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              {duration} min
            </div>
          )}
          {onDelete && !compact && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete workout"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!compact && (
            <button
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse workout' : 'Expand workout'}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
          )}
        </div>
      </div>

      {expanded && !compact && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          {/* Session notes */}
          {workout.notes && (
            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              {workout.notes}
            </div>
          )}
          {workout.exercises.map((ex) => {
            // Find planned exercise from routine
            const plannedExercise = routine?.exercises.find(re => re.exerciseId === ex.exerciseId);
            const completedSets = ex.sets.filter(s => s.completed).length;
            const plannedSetCount = plannedExercise?.targetSets || ex.sets.length;
            const hasSetNotes = ex.sets.some((s) => s.notes);

            return (
              <div key={ex.id} className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Link
                    to={`/exercises/${ex.exerciseId}`}
                    className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {ex.exercise.name}
                  </Link>
                  {plannedExercise && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      completedSets >= plannedSetCount
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {completedSets}/{plannedSetCount} sets
                    </span>
                  )}
                </div>
                {/* Exercise notes (e.g. carried from the routine prescription) */}
                {ex.notes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-1">{ex.notes}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-1">
                  {ex.sets.map((set, index) => (
                    <span
                      key={set.id}
                      className={`px-2 py-0.5 rounded text-xs ${
                        set.completed
                          ? 'bg-success-500/10 text-success-600 dark:text-success-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {Math.round(kgToDisplay(set.weight, unitSystem) * 10) / 10}{weightUnit} × {set.reps}
                      {set.rir != null && (
                        <span className="ml-1 opacity-70">· {set.rir} RIR</span>
                      )}
                      {plannedExercise && index < plannedSetCount && (
                        <span className="ml-1 opacity-60">
                          (target: {plannedExercise.targetReps})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                {/* Per-set notes captured during logging */}
                {hasSetNotes && (
                  <div className="mt-1.5 space-y-0.5">
                    {ex.sets.map((set, index) =>
                      set.notes ? (
                        <p key={set.id} className="text-xs text-gray-500 dark:text-gray-400 italic">
                          <span className="not-italic text-gray-400 dark:text-gray-500">Set {index + 1}:</span> “{set.notes}”
                        </p>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
