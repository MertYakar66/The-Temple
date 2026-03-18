import { useState } from 'react';
import { X } from 'lucide-react';
import type { CustomBlockDay } from '../../types';

interface Props {
  onSave: (day: CustomBlockDay) => void;
  onClose: () => void;
}

export function BlockDayAddModal({ onSave, onClose }: Props) {
  const [dayName, setDayName] = useState('');
  const [exerciseName, setExerciseName] = useState('');

  const handleSave = () => {
    if (!dayName.trim()) return;
    const day: CustomBlockDay = {
      dayName: dayName.trim(),
      exercises: exerciseName.trim()
        ? [
            {
              name: exerciseName.trim(),
              lastSetIntensity: 'N/A',
              warmup: '0',
              sets: 3,
              repRange: '8-12',
              rirS1: '2',
              rirS2: 'N/A',
              rest: '2-3 min',
            },
          ]
        : [],
      isCustom: true,
    };
    onSave(day);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 dark:text-white">Add Workout Day</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Day Name</label>
            <input
              type="text"
              value={dayName}
              onChange={(e) => setDayName(e.target.value)}
              placeholder="e.g. Pull Day, Legs B"
              autoFocus
              className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">First Exercise (optional)</label>
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g. Barbell Row"
              className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!dayName.trim()}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Add Day
          </button>
        </div>
      </div>
    </div>
  );
}
