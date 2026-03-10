import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, Edit2, MoreVertical, ChevronLeft, ChevronDown, ChevronRight, Dumbbell } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Routines() {
  const navigate = useNavigate();
  const routines = useStore((state) => state.routines);
  const deleteRoutine = useStore((state) => state.deleteRoutine);
  const updateRoutine = useStore((state) => state.updateRoutine);
  const startWorkoutFromRoutine = useStore((state) => state.startWorkoutFromRoutine);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  const handleEditProgram = (e: React.MouseEvent, programName: string, programRoutines: typeof routines) => {
    e.stopPropagation();
    const newName = window.prompt('Rename Routine:', programName);
    if (newName !== null && newName !== programName) {
      const trimmed = newName.trim();
      programRoutines.forEach((r) => {
        updateRoutine(r.id, { program: trimmed || undefined });
      });
    }
  };

  // Group routines by program
  const { programGroups, ungroupedRoutines } = useMemo(() => {
    const groups: Record<string, typeof routines> = {};
    const ungrouped: typeof routines = [];

    routines.forEach((routine) => {
      if (routine.program) {
        if (!groups[routine.program]) {
          groups[routine.program] = [];
        }
        groups[routine.program].push(routine);
      } else {
        ungrouped.push(routine);
      }
    });

    return { programGroups: groups, ungroupedRoutines: ungrouped };
  }, [routines]);

  const toggleProgram = (programName: string) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(programName)) {
        next.delete(programName);
      } else {
        next.add(programName);
      }
      return next;
    });
  };

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

  const renderRoutineCard = (routine: typeof routines[0]) => (
    <div key={routine.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <Link
          to={`/routines/${routine.id}`}
          className="flex-1"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {routine.name}
          </h3>
          {routine.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
              {routine.description}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {routine.exercises.length} exercises
          </p>
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(menuOpen === routine.id ? null : routine.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {menuOpen === routine.id && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(null)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                <Link
                  to={`/routines/${routine.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                  onClick={() => setMenuOpen(null)}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(routine.id)}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => handleStartWorkout(routine.id)}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Start Workout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Home
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-white">My Routines</h1>
          <Link
            to="/routines/new"
            className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1"
          >
            <Plus className="w-5 h-5" />
            New
          </Link>
        </div>
      </header>

      <div className="px-4 py-6">
        {routines.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No routines yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create workout routines to save time and stay consistent
            </p>
            <Link to="/routines/new" className="btn-primary">
              Create Your First Routine
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Program Groups */}
            {Object.entries(programGroups).map(([programName, programRoutines]) => {
              const isExpanded = expandedPrograms.has(programName);
              const totalExercises = programRoutines.reduce((sum, r) => sum + r.exercises.length, 0);

              return (
                <div key={programName} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  {/* Program Header */}
                  <button
                    onClick={() => toggleProgram(programName)}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <h2 className="font-bold text-gray-900 dark:text-white text-base">
                        {programName}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {programRoutines.length} days &middot; {totalExercises} exercises
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEditProgram(e, programName, programRoutines)}
                        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Edit Routine Name"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <div className="p-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Routine List */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {programRoutines.map((routine) => renderRoutineCard(routine))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped Routines */}
            {ungroupedRoutines.length > 0 && (
              <>
                {Object.keys(programGroups).length > 0 && (
                  <h2 className="font-bold text-gray-900 dark:text-white text-base pt-2">
                    Other Routines
                  </h2>
                )}
                <div className="space-y-3">
                  {ungroupedRoutines.map((routine) => renderRoutineCard(routine))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
