import { useState } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import type { Exercise, MuscleGroup } from '../../types';
import { useStore } from '../../store/useStore';

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const muscleGroups: { id: MuscleGroup | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'quadriceps', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'calves', label: 'Calves' },
  { id: 'abs', label: 'Core' },
];

export function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const exercises = useStore((state) => state.exercises);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle =
      selectedMuscle === 'all' ||
      exercise.muscleGroups.includes(selectedMuscle as MuscleGroup);
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Add Exercise</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="input pl-10"
            autoFocus
          />
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 -mx-4 px-4">
          {muscleGroups.map((muscle) => (
            <button
              key={muscle.id}
              onClick={() => setSelectedMuscle(muscle.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedMuscle === muscle.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {muscle.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No exercises found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => onSelect(exercise)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900">{exercise.name}</p>
                  <p className="text-sm text-gray-500">
                    {exercise.muscleGroups
                      .map((mg) => mg.charAt(0).toUpperCase() + mg.slice(1))
                      .join(', ')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
