import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Routines() {
  const navigate = useNavigate();
  const routines = useStore((state) => state.routines);
  const deleteRoutine = useStore((state) => state.deleteRoutine);
  const startWorkoutFromRoutine = useStore((state) => state.startWorkoutFromRoutine);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleStartWorkout = (routineId: string) => {
    startWorkoutFromRoutine(routineId);
    navigate('/workout');
  };

  const handleDelete = (routineId: string) => {
    if (window.confirm('Delete this routine?')) {
      deleteRoutine(routineId);
      setMenuOpen(null);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Routines</h1>
        <Link
          to="/routines/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No routines yet</h3>
          <p className="text-gray-600 mb-4">
            Create workout routines to save time and stay consistent
          </p>
          <Link to="/routines/new" className="btn-primary">
            Create Your First Routine
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <div key={routine.id} className="card">
              <div className="flex items-start justify-between">
                <Link
                  to={`/routines/${routine.id}`}
                  className="flex-1"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {routine.name}
                  </h3>
                  {routine.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {routine.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    {routine.exercises.length} exercises
                  </p>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === routine.id ? null : routine.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>

                  {menuOpen === routine.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
                        <Link
                          to={`/routines/${routine.id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                          onClick={() => setMenuOpen(null)}
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(routine.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleStartWorkout(routine.id)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Workout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
