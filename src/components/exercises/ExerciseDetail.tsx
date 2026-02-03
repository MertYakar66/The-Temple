import { ChevronLeft, Target, Dumbbell, Info, Lightbulb } from 'lucide-react';
import type { Exercise } from '../../types';
import { useStore } from '../../store/useStore';

interface ExerciseDetailProps {
  exercise: Exercise;
  onBack: () => void;
}

export function ExerciseDetail({ exercise, onBack }: ExerciseDetailProps) {
  const getExerciseHistory = useStore((state) => state.getExerciseHistory);
  const personalRecords = useStore((state) => state.personalRecords);

  const history = getExerciseHistory(exercise.id);
  const prs = personalRecords.filter((pr) => pr.exerciseId === exercise.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {exercise.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            {exercise.muscleGroups.map((muscle) => (
              <span
                key={muscle}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize"
              >
                {muscle.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">About</h2>
          </div>
          <p className="text-gray-600">{exercise.description}</p>
        </div>

        {/* Equipment */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Equipment Needed</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map((eq) => (
              <span
                key={eq}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
              >
                {eq}
              </span>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">How to Perform</h2>
          </div>
          <ol className="space-y-3">
            {exercise.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-gray-600">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        {exercise.tips.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-warning-500" />
              <h2 className="font-semibold text-gray-900">Pro Tips</h2>
            </div>
            <ul className="space-y-2">
              {exercise.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-warning-500 mt-1">•</span>
                  <span className="text-gray-600">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variations */}
        {exercise.variations && exercise.variations.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Variations</h2>
            <div className="flex flex-wrap gap-2">
              {exercise.variations.map((variation) => (
                <span
                  key={variation}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {variation}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Personal Records */}
        {prs.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Your Personal Records</h2>
            <div className="space-y-2">
              {prs.map((pr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-900 font-medium">
                    {pr.weight} kg x {pr.reps} reps
                  </span>
                  <span className="text-sm text-gray-500">{pr.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Recent History</h2>
            <div className="space-y-2">
              {history.slice(-5).reverse().map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <span className="text-gray-900">Max: {entry.maxWeight} kg</span>
                    <span className="text-gray-500 text-sm ml-2">
                      (Vol: {entry.totalVolume} kg)
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{entry.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
