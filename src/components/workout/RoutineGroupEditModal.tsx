import { useState } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { Routine } from '../../types';

interface RoutineGroupEditModalProps {
    programName: string;
    routines: Routine[];
    onClose: () => void;
}

export function RoutineGroupEditModal({ programName, routines, onClose }: RoutineGroupEditModalProps) {
    const navigate = useNavigate();
    const [name, setName] = useState(programName);
    const updateRoutine = useStore((state) => state.updateRoutine);
    const deleteRoutine = useStore((state) => state.deleteRoutine);

    const handleSave = () => {
        const trimmed = name.trim();
        if (trimmed !== programName) {
            routines.forEach((r) => {
                updateRoutine(r.id, { program: trimmed || undefined });
            });
        }
        onClose();
    };

    const handleEditWorkout = (id: string) => {
        onClose();
        navigate(`/routines/${id}/edit`);
    };

    const handleDeleteWorkout = (id: string) => {
        if (window.confirm('Delete this workout?')) {
            deleteRoutine(id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Routine</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto">
                    <div>
                        <label className="input-label">Routine Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input mb-2"
                            placeholder="e.g., Guray Baba's Hypertrophy Program"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Applying changes here will rename the group for all associated workouts.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                            Workouts
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{routines.length} workouts</span>
                        </h3>

                        <div className="space-y-2">
                            {routines.map((routine) => (
                                <div key={routine.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex-1 truncate pr-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white truncate">{routine.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{routine.exercises.length} exercises</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEditWorkout(routine.id)}
                                            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                            title="Edit Workout"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteWorkout(routine.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Delete Workout"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-6 mt-2 flex gap-3 shrink-0">
                    <button onClick={onClose} className="btn-secondary flex-1">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="btn-primary flex-1">
                        Save Routine
                    </button>
                </div>
            </div>
        </div>
    );
}
