import { useState } from 'react';
import { Search, ChevronRight, Dumbbell } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Exercise, MuscleGroup } from '../types';
import { ExerciseDetail } from '../components/exercises/ExerciseDetail';

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

export function Exercises() {
  const exercises = useStore((state) => state.exercises);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(search.toLowerCase()) ||
      exercise.description.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle =
      selectedMuscle === 'all' ||
      exercise.muscleGroups.includes(selectedMuscle as MuscleGroup);
    return matchesSearch && matchesMuscle;
  });

  // Group exercises by primary muscle group
  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const primaryMuscle = exercise.muscleGroups[0];
    if (!acc[primaryMuscle]) {
      acc[primaryMuscle] = [];
    }
    acc[primaryMuscle].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  if (selectedExercise) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        onBack={() => setSelectedExercise(null)}
      />
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Exercise Library</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="input pl-10"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {muscleGroups.map((muscle) => (
          <button
            key={muscle.id}
            onClick={() => setSelectedMuscle(muscle.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedMuscle === muscle.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {muscle.label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      {selectedMuscle === 'all' ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(groupedExercises).map(([muscle, exerciseList]) => (
            <div key={muscle}>
              <h2 className="font-semibold text-gray-900 mb-2 capitalize">
                {muscle.replace('_', ' ')}
              </h2>
              <div className="card p-0 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {exerciseList.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => setSelectedExercise(exercise)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Dumbbell className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{exercise.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {exercise.equipment.join(', ')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat list for filtered view
        <div className="card p-0 overflow-hidden">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No exercises found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{exercise.name}</p>
                      <p className="text-sm text-gray-500">
                        {exercise.muscleGroups
                          .map((mg) => mg.charAt(0).toUpperCase() + mg.slice(1))
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
