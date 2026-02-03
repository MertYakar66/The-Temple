import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Play, Edit2, Dumbbell } from 'lucide-react';
import { useStore } from '../store/useStore';

export function RoutineDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const routines = useStore((state) => state.routines);
  const getExercise = useStore((state) => state.getExercise);
  const startWorkoutFromRoutine = useStore((state) => state.startWorkoutFromRoutine);

  const routine = routines.find((r) => r.id === id);

  if (!routine) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-gray-500">Routine not found</p>
        <Link to="/routines" className="btn-primary mt-4">
          Back to Routines
        </Link>
      </div>
    );
  }

  const handleStartWorkout = () => {
    startWorkoutFromRoutine(routine.id);
    navigate('/workout');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/routines')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <Link
            to={`/routines/${routine.id}/edit`}
            className="flex items-center gap-1 text-primary-600 font-medium"
          >
            <Edit2 className="w-5 h-5" />
            Edit
          </Link>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {routine.name}
          </h1>
          {routine.description && (
            <p className="text-gray-600">{routine.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {routine.exercises.length} exercises
          </p>
        </div>

        {/* Exercises */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Exercises</h2>
          <div className="space-y-3">
            {routine.exercises.map((re, index) => {
              const exercise = getExercise(re.exerciseId);
              if (!exercise) return null;

              return (
                <div key={re.id} className="card flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                    <p className="text-sm text-gray-500">
                      {re.targetSets} sets × {re.targetReps} reps • {re.restSeconds}s rest
                    </p>
                  </div>
                  <Dumbbell className="w-5 h-5 text-gray-400" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStartWorkout}
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
        >
          <Play className="w-6 h-6" />
          Start Workout
        </button>
      </div>
    </div>
  );
}
