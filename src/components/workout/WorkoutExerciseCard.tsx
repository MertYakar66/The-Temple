import { Plus, Trash2, ChevronDown, ChevronUp, History, Target, Edit3, Info } from 'lucide-react';
import { useState } from 'react';
import type { WorkoutExercise, WorkoutSet } from '../../types';
import { SetRow } from './SetRow';
import { useStore } from '../../store/useStore';

interface WorkoutExerciseCardProps {
  workoutExercise: WorkoutExercise;
  onAddSet: () => void;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  onRemoveSet: (setId: string) => void;
  onToggleSetComplete: (setId: string) => void;
  onRemove: () => void;
}

export function WorkoutExerciseCard({
  workoutExercise,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onToggleSetComplete,
  onRemove,
}: WorkoutExerciseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);

  const getLastWorkoutForExercise = useStore((state) => state.getLastWorkoutForExercise);
  const getExerciseGoal = useStore((state) => state.getExerciseGoal);
  const setExerciseGoal = useStore((state) => state.setExerciseGoal);

  const completedSets = workoutExercise.sets.filter((s) => s.completed).length;
  const lastWorkout = getLastWorkoutForExercise(workoutExercise.exerciseId);
  const currentGoal = getExerciseGoal(workoutExercise.exerciseId);

  // Goal editor state
  const [goalWeight, setGoalWeight] = useState(currentGoal?.targetWeight?.toString() || '');
  const [goalReps, setGoalReps] = useState(currentGoal?.targetReps?.toString() || '');
  const [goalRIR, setGoalRIR] = useState(currentGoal?.targetRIR?.toString() || '');
  const [goalSets, setGoalSets] = useState(currentGoal?.targetSets?.toString() || '');
  const [goalNotes, setGoalNotes] = useState(currentGoal?.notes || '');

  const handleSaveGoal = () => {
    setExerciseGoal({
      exerciseId: workoutExercise.exerciseId,
      targetWeight: parseFloat(goalWeight) || 0,
      targetReps: parseInt(goalReps) || 0,
      targetRIR: goalRIR ? parseInt(goalRIR) : undefined,
      targetSets: goalSets ? parseInt(goalSets) : undefined,
      notes: goalNotes,
    });
    setShowGoalEditor(false);
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-2 text-left"
        >
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {workoutExercise.exercise.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {completedSets}/{workoutExercise.sets.length} sets completed
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400 ml-auto" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
          )}
        </button>

        <button
          onClick={onRemove}
          className="p-2 -mr-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {expanded && (
        <>
          {/* Routine Notes (target from routine) */}
          {workoutExercise.notes && (
            <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-sm text-amber-800 dark:text-amber-200">{workoutExercise.notes}</span>
              </div>
            </div>
          )}

          {/* Goal Display */}
          {currentGoal && !showGoalEditor && (
            <div className="mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Goal for Today</span>
                </div>
                <button
                  onClick={() => {
                    setGoalWeight(currentGoal.targetWeight?.toString() || '');
                    setGoalReps(currentGoal.targetReps?.toString() || '');
                    setGoalRIR(currentGoal.targetRIR?.toString() || '');
                    setGoalSets(currentGoal.targetSets?.toString() || '');
                    setGoalNotes(currentGoal.notes || '');
                    setShowGoalEditor(true);
                  }}
                  className="p-1 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-800/30 rounded"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-primary-800 dark:text-primary-200">
                <span className="font-semibold">{currentGoal.targetWeight}kg</span> x{' '}
                <span className="font-semibold">{currentGoal.targetReps} reps</span>
                {currentGoal.targetRIR !== undefined && (
                  <span> @ RIR {currentGoal.targetRIR}</span>
                )}
                {currentGoal.targetSets && (
                  <span> ({currentGoal.targetSets} sets)</span>
                )}
              </div>
              {currentGoal.notes && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">{currentGoal.notes}</p>
              )}
            </div>
          )}

          {/* Goal Editor */}
          {showGoalEditor && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set Goal for Next Session</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Weight</label>
                  <input
                    type="number"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(e.target.value)}
                    placeholder="kg"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Reps</label>
                  <input
                    type="number"
                    value={goalReps}
                    onChange={(e) => setGoalReps(e.target.value)}
                    placeholder="reps"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">RIR</label>
                  <input
                    type="number"
                    value={goalRIR}
                    onChange={(e) => setGoalRIR(e.target.value)}
                    placeholder="0-5"
                    min="0"
                    max="5"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Sets</label>
                  <input
                    type="number"
                    value={goalSets}
                    onChange={(e) => setGoalSets(e.target.value)}
                    placeholder="#"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mb-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Notes</label>
                <input
                  type="text"
                  value={goalNotes}
                  onChange={(e) => setGoalNotes(e.target.value)}
                  placeholder="e.g., Increase weight if hit all reps..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGoalEditor(false)}
                  className="flex-1 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGoal}
                  className="flex-1 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Save Goal
                </button>
              </div>
            </div>
          )}

          {/* Last Workout Dropdown */}
          {lastWorkout && (
            <div className="mb-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <History className="w-4 h-4" />
                <span>Last workout</span>
                {showHistory ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showHistory && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                  <div className="grid grid-cols-4 gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                    <span>Set</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span>RIR</span>
                  </div>
                  {lastWorkout.sets.map((set, idx) => (
                    <div key={idx} className="px-1 py-0.5">
                      <div className="grid grid-cols-4 gap-1 text-gray-700 dark:text-gray-300">
                        <span>{idx + 1}</span>
                        <span>{set.weight}kg</span>
                        <span>{set.reps}</span>
                        <span>{set.rir ?? '-'}</span>
                      </div>
                      {set.notes && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5 pl-1">
                          "{set.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Set Goal Button (if no goal exists) */}
          {!currentGoal && !showGoalEditor && (
            <button
              onClick={() => setShowGoalEditor(true)}
              className="mb-3 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <Target className="w-4 h-4" />
              <span>Set goal for this exercise</span>
            </button>
          )}

          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
              <span className="w-6 text-center">Set</span>
              <span className="w-14 text-center">Weight</span>
              <span className="w-3" />
              <span className="w-12 text-center">Reps</span>
              <span className="w-3" />
              <span className="w-10 text-center">RIR</span>
            </div>

            <div className="space-y-1">
              {workoutExercise.sets.map((set, index) => (
                <SetRow
                  key={set.id}
                  set={set}
                  index={index}
                  onUpdate={(updates) => onUpdateSet(set.id, updates)}
                  onRemove={() => onRemoveSet(set.id)}
                  onToggleComplete={() => onToggleSetComplete(set.id)}
                />
              ))}
            </div>
          </div>

          <button
            onClick={onAddSet}
            className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Set
          </button>
        </>
      )}
    </div>
  );
}
