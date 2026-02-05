import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Dumbbell, Clock, BarChart2, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { workoutTemplates } from '../data/workoutTemplates';
import { useStore } from '../store/useStore';
import type { WorkoutTemplate, ExperienceLevel } from '../types';

const levelLabels: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const levelColors: Record<ExperienceLevel, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export function WorkoutTemplates() {
  const navigate = useNavigate();
  const addRoutine = useStore((state) => state.addRoutine);
  const getExercise = useStore((state) => state.getExercise);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImportTemplate = (template: WorkoutTemplate) => {
    // Create routines from template
    template.routines.forEach((routine) => {
      addRoutine({
        name: `${template.name} - ${routine.dayName}`,
        description: `Part of ${template.name} program`,
        exercises: routine.exercises.map((ex) => ({
          id: uuidv4(),
          exerciseId: ex.exerciseId,
          targetSets: ex.sets,
          targetReps: ex.repsMax,
          targetWeight: undefined,
          restSeconds: ex.restSeconds,
          notes: ex.repsMin !== ex.repsMax ? `${ex.repsMin}-${ex.repsMax} reps` : undefined,
        })),
      });
    });

    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
      setSelectedTemplate(null);
      navigate('/routines');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="ml-4 font-semibold text-gray-900 dark:text-white">Workout Templates</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Choose a pre-built workout program to get started quickly. These templates will create routines you can customize.
        </p>

        <div className="space-y-4">
          {workoutTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="w-full card dark:bg-gray-800 dark:border-gray-700 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[template.level]}`}>
                  {levelLabels[template.level]}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
              <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {template.daysPerWeek} days/week
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-4 h-4" />
                  {template.routines.length} workouts
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">{selectedTemplate.name}</h2>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {importSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Templates Imported!</h3>
                <p className="text-gray-600 dark:text-gray-400">Redirecting to your routines...</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex gap-4 mb-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[selectedTemplate.level]}`}>
                    {levelLabels[selectedTemplate.level]}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedTemplate.daysPerWeek} days/week
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedTemplate.description}</p>

                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Workouts Included:</h3>
                <div className="space-y-3 mb-6">
                  {selectedTemplate.routines.map((routine, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{routine.dayName}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {routine.exercises.length} exercises
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {routine.exercises.slice(0, 3).map((ex, i) => {
                          const exercise = getExercise(ex.exerciseId);
                          return (
                            <span key={i}>
                              {exercise?.name || ex.exerciseId}
                              {i < 2 && i < routine.exercises.length - 1 && ', '}
                            </span>
                          );
                        })}
                        {routine.exercises.length > 3 && (
                          <span className="text-gray-400 dark:text-gray-500">
                            {' '}+{routine.exercises.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleImportTemplate(selectedTemplate)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <BarChart2 className="w-5 h-5" />
                  Import This Program
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
