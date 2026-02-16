import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, GripVertical, Trash2, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import type { Exercise, RoutineExercise } from '../types';
import { ExerciseSelector } from '../components/workout/ExerciseSelector';

export function RoutineEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const routines = useStore((state) => state.routines);
  const addRoutine = useStore((state) => state.addRoutine);
  const updateRoutine = useStore((state) => state.updateRoutine);
  const getExercise = useStore((state) => state.getExercise);

  const existingRoutine = id ? routines.find((r) => r.id === id) : null;

  const [name, setName] = useState(existingRoutine?.name || '');
  const [description, setDescription] = useState(existingRoutine?.description || '');
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>(
    existingRoutine?.exercises || []
  );
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddExercise = (exercise: Exercise) => {
    const newRoutineExercise: RoutineExercise = {
      id: uuidv4(),
      exerciseId: exercise.id,
      targetSets: 3,
      targetReps: 10,
      restSeconds: 90,
    };
    setRoutineExercises([...routineExercises, newRoutineExercise]);
    setShowExerciseSelector(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setRoutineExercises(routineExercises.filter((e) => e.id !== exerciseId));
  };

  const handleUpdateExercise = (exerciseId: string, updates: Partial<RoutineExercise>) => {
    setRoutineExercises(
      routineExercises.map((e) =>
        e.id === exerciseId ? { ...e, ...updates } : e
      )
    );
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Routine name is required';
    }
    if (routineExercises.length === 0) {
      newErrors.exercises = 'Add at least one exercise';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (isEditing && id) {
      updateRoutine(id, {
        name: name.trim(),
        description: description.trim(),
        exercises: routineExercises,
      });
    } else {
      addRoutine({
        name: name.trim(),
        description: description.trim(),
        exercises: routineExercises,
      });
    }

    navigate('/routines');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/routines')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Routine' : 'New Routine'}
          </h1>
          <button
            onClick={handleSave}
            className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1"
          >
            <Save className="w-5 h-5" />
            Save
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="input-label">Routine Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push Day, Upper Body..."
              className={`input ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="input-label">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this routine..."
              className="input min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Exercises */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Exercises</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {routineExercises.length} exercise{routineExercises.length !== 1 ? 's' : ''}
            </span>
          </div>

          {errors.exercises && (
            <p className="text-red-500 dark:text-red-400 text-sm mb-3">{errors.exercises}</p>
          )}

          {routineExercises.length === 0 ? (
            <div className="text-center py-8 card">
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
            <div className="space-y-3">
              {routineExercises.map((re, index) => {
                const exercise = getExercise(re.exerciseId);
                if (!exercise) return null;

                return (
                  <div key={re.id} className="card">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 pt-1">
                        <GripVertical className="w-5 h-5" />
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {exercise.name}
                          </h3>
                          <button
                            onClick={() => handleRemoveExercise(re.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                              Sets
                            </label>
                            <input
                              type="number"
                              value={re.targetSets}
                              onChange={(e) =>
                                handleUpdateExercise(re.id, {
                                  targetSets: parseInt(e.target.value) || 1,
                                })
                              }
                              className="input text-center py-1.5"
                              min={1}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                              Reps
                            </label>
                            <input
                              type="number"
                              value={re.targetReps}
                              onChange={(e) =>
                                handleUpdateExercise(re.id, {
                                  targetReps: parseInt(e.target.value) || 1,
                                })
                              }
                              className="input text-center py-1.5"
                              min={1}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                              Rest (s)
                            </label>
                            <input
                              type="number"
                              value={re.restSeconds}
                              onChange={(e) =>
                                handleUpdateExercise(re.id, {
                                  restSeconds: parseInt(e.target.value) || 0,
                                })
                              }
                              className="input text-center py-1.5"
                              min={0}
                              step={15}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => setShowExerciseSelector(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Exercise
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exercise selector */}
      {showExerciseSelector && (
        <ExerciseSelector
          onSelect={handleAddExercise}
          onClose={() => setShowExerciseSelector(false)}
        />
      )}
    </div>
  );
}
