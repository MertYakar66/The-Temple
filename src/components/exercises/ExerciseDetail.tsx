import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  Target,
  Dumbbell,
  Info,
  Lightbulb,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Exercise, WorkoutSet } from '../../types';
import { useStore } from '../../store/useStore';
import { kgToDisplay, getWeightUnit } from '../../utils/weight';
import { parseDateStamp } from '../../utils/date';
import { getExerciseSetHistory } from '../../utils/workoutMetrics';

interface ExerciseDetailProps {
  exercise: Exercise;
  onBack: () => void;
}

// How many recent sessions to show before the "Show all" toggle.
const DEFAULT_VISIBLE_SESSIONS = 8;

export function ExerciseDetail({ exercise, onBack }: ExerciseDetailProps) {
  const workoutSessions = useStore((state) => state.workoutSessions);
  const personalRecords = useStore((state) => state.personalRecords);
  const user = useStore((state) => state.user);

  const unitSystem = user?.unitSystem || 'metric';
  const weightUnit = getWeightUnit(unitSystem);

  const history = useMemo(
    () => getExerciseSetHistory(workoutSessions, exercise.id),
    [workoutSessions, exercise.id]
  );
  const prs = personalRecords.filter((pr) => pr.exerciseId === exercise.id);

  const [showAllSessions, setShowAllSessions] = useState(false);
  const visibleHistory = showAllSessions
    ? history
    : history.slice(0, DEFAULT_VISIBLE_SESSIONS);

  // Display helpers — weight is stored in kg; always convert for display.
  const fmtWeight = (kg: number) =>
    Math.round(kgToDisplay(kg, unitSystem) * 10) / 10;
  const fmtSet = (set: WorkoutSet) =>
    `${fmtWeight(set.weight)}${weightUnit} × ${set.reps}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {exercise.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            {exercise.muscleGroups.map((muscle) => (
              <span
                key={muscle}
                className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium capitalize"
              >
                {muscle.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Personal Records */}
        {prs.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Your Personal Records</h2>
            <div className="space-y-2">
              {prs.map((pr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <span className="text-gray-900 dark:text-white font-medium">
                    {Math.round(kgToDisplay(pr.weight, unitSystem) * 10) / 10} {weightUnit} x {pr.reps} reps
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{pr.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training History */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Training History</h2>
          </div>

          {history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No logged sets yet. Completed sets from your workouts will show up here.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {visibleHistory.map((entry) => {
                  const notedSets = entry.sets.filter((s) => s.notes);
                  return (
                    <div
                      key={entry.sessionId}
                      className="pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0"
                    >
                      {/* Session header: date + best/volume summary */}
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {format(parseDateStamp(entry.date), 'MMM d')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-right">
                          {entry.bestSet && <>Best {fmtSet(entry.bestSet)} · </>}
                          Vol {Math.round(kgToDisplay(entry.volume, unitSystem)).toLocaleString()} {weightUnit}
                        </span>
                      </div>

                      {/* Per-set chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {entry.sets.map((set) => (
                          <span
                            key={set.id}
                            className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            {fmtSet(set)}
                            {/* rir 0 is valid (to failure); only hide when null/undefined */}
                            {set.rir != null && (
                              <span className="opacity-60"> · {set.rir} RIR</span>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Optional per-set notes, small and muted */}
                      {notedSets.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {notedSets.map((set) => (
                            <p
                              key={`${set.id}-note`}
                              className="text-xs text-gray-400 dark:text-gray-500"
                            >
                              {fmtSet(set)}: {set.notes}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {history.length > DEFAULT_VISIBLE_SESSIONS && (
                <button
                  onClick={() => setShowAllSessions((v) => !v)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {showAllSessions ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show all {history.length} sessions
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Description */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">About</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{exercise.description}</p>
        </div>

        {/* Equipment */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Equipment Needed</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map((eq) => (
              <span
                key={eq}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm capitalize"
              >
                {eq}
              </span>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">How to Perform</h2>
          </div>
          <ol className="space-y-3">
            {exercise.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-gray-600 dark:text-gray-400">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        {exercise.tips.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-warning-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Pro Tips</h2>
            </div>
            <ul className="space-y-2">
              {exercise.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-warning-500 mt-1">•</span>
                  <span className="text-gray-600 dark:text-gray-400">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variations */}
        {exercise.variations && exercise.variations.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Variations</h2>
            <div className="flex flex-wrap gap-2">
              {exercise.variations.map((variation) => (
                <span
                  key={variation}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {variation}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
