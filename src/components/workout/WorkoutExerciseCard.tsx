import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { WorkoutExercise, WorkoutSet } from '../../types';
import { SetRow } from './SetRow';

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
  const completedSets = workoutExercise.sets.filter((s) => s.completed).length;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-2 text-left"
        >
          <div>
            <h3 className="font-semibold text-gray-900">
              {workoutExercise.exercise.name}
            </h3>
            <p className="text-sm text-gray-500">
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
          className="p-2 -mr-2 text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {expanded && (
        <>
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 px-1">
              <span className="w-8 text-center">Set</span>
              <span className="w-20 text-center">Weight</span>
              <span className="w-4" />
              <span className="w-16 text-center">Reps</span>
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
            className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Set
          </button>
        </>
      )}
    </div>
  );
}
