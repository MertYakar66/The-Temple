import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ExerciseDetail } from '../components/exercises/ExerciseDetail';

/**
 * Route wrapper that resolves an exercise by :exerciseId and renders the
 * shared ExerciseDetail view. Reachable at /exercises/:exerciseId (e.g. from
 * a workout in /history). The inline browse flow in Exercises.tsx renders the
 * same component directly and is left untouched.
 */
export function ExerciseDetailRoute() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const exercise = useStore((state) =>
    state.exercises.find((e) => e.id === exerciseId)
  );

  if (!exercise) {
    return <Navigate to="/exercises" replace />;
  }

  return <ExerciseDetail exercise={exercise} onBack={() => navigate(-1)} />;
}
