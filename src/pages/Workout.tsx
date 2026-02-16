import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Clock, Save, Play } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Exercise } from '../types';
import { ExerciseSelector } from '../components/workout/ExerciseSelector';
import { WorkoutExerciseCard } from '../components/workout/WorkoutExerciseCard';
import { RestTimer } from '../components/workout/RestTimer';
import { getCompletedSetCount, getTotalSetCount } from '../utils/workoutMetrics';

export function Workout() {
  const navigate = useNavigate();
  const currentSession = useStore((state) => state.currentSession);
  const routines = useStore((state) => state.routines);
  const startWorkout = useStore((state) => state.startWorkout);
  const endWorkout = useStore((state) => state.endWorkout);
  const cancelWorkout = useStore((state) => state.cancelWorkout);
  const addExerciseToSession = useStore((state) => state.addExerciseToSession);
  const removeExerciseFromSession = useStore((state) => state.removeExerciseFromSession);
  const addSetToExercise = useStore((state) => state.addSetToExercise);
  const updateSet = useStore((state) => state.updateSet);
  const removeSet = useStore((state) => state.removeSet);
  const toggleSetComplete = useStore((state) => state.toggleSetComplete);
  const startWorkoutFromRoutine = useStore((state) => state.startWorkoutFromRoutine);

  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const handleStartEmptyWorkout = () => {
    setShowNameInput(true);
  };

  const handleConfirmStartWorkout = () => {
    if (workoutName.trim()) {
      startWorkout(workoutName.trim());
      setShowNameInput(false);
      setWorkoutName('');
    }
  };

  const handleStartFromRoutine = (routineId: string) => {
    startWorkoutFromRoutine(routineId);
  };

  const handleAddExercise = (exercise: Exercise) => {
    addExerciseToSession(exercise);
    setShowExerciseSelector(false);
    // Auto-start rest timer when adding exercises after the first
    if (currentSession && currentSession.exercises.length > 0) {
      setShowRestTimer(true);
    }
  };

  const handleEndWorkout = () => {
    if (window.confirm('End this workout and save?')) {
      endWorkout();
      navigate('/');
    }
  };

  const handleCancelWorkout = () => {
    if (window.confirm('Cancel this workout? Progress will be lost.')) {
      cancelWorkout();
    }
  };

  // No active session - show start options
  if (!currentSession) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Start Workout</h1>

        {/* Name input modal */}
        {showNameInput && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Name Your Workout</h2>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Push Day, Leg Day..."
                className="input mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNameInput(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStartWorkout}
                  disabled={!workoutName.trim()}
                  className="btn-primary flex-1"
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start empty workout */}
        <button
          onClick={handleStartEmptyWorkout}
          className="w-full card flex items-center gap-4 mb-6 hover:shadow-md transition-shadow"
        >
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Play className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">Empty Workout</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Start from scratch and add exercises</p>
          </div>
        </button>

        {/* Start from routine */}
        {routines.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Start from Routine</h2>
            <div className="space-y-2">
              {routines.map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => handleStartFromRoutine(routine.id)}
                  className="w-full card flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{routine.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {routine.exercises.length} exercises
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {routines.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create routines to quickly start pre-planned workouts
            </p>
            <button
              onClick={() => navigate('/routines/new')}
              className="btn-outline"
            >
              Create a Routine
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active session - show workout logging
  const totalCompletedSets = getCompletedSetCount(currentSession.exercises);
  const totalSets = getTotalSetCount(currentSession.exercises);

  return (
    <div className="px-4 py-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{currentSession.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalCompletedSets}/{totalSets} sets completed
          </p>
        </div>
        <button
          onClick={handleCancelWorkout}
          className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Exercises */}
      {currentSession.exercises.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No exercises added yet</p>
          <button
            onClick={() => setShowExerciseSelector(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Exercise
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentSession.exercises.map((we) => (
            <WorkoutExerciseCard
              key={we.id}
              workoutExercise={we}
              onAddSet={() => addSetToExercise(we.id)}
              onUpdateSet={(setId, updates) => updateSet(we.id, setId, updates)}
              onRemoveSet={(setId) => removeSet(we.id, setId)}
              onToggleSetComplete={(setId) => {
                toggleSetComplete(we.id, setId);
                setShowRestTimer(true);
              }}
              onRemove={() => removeExerciseFromSession(we.id)}
            />
          ))}
        </div>
      )}

      {/* Add exercise button */}
      {currentSession.exercises.length > 0 && (
        <button
          onClick={() => setShowExerciseSelector(true)}
          className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Exercise
        </button>
      )}

      {/* Exercise selector modal */}
      {showExerciseSelector && (
        <ExerciseSelector
          onSelect={handleAddExercise}
          onClose={() => setShowExerciseSelector(false)}
        />
      )}

      {/* Rest timer */}
      {showRestTimer && (
        <RestTimer onClose={() => setShowRestTimer(false)} />
      )}

      {/* Bottom action bar */}
      {currentSession.exercises.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={() => setShowRestTimer(true)}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Clock className="w-5 h-5" />
              Rest Timer
            </button>
            <button
              onClick={handleEndWorkout}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Finish Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
