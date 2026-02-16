import { Check, X } from 'lucide-react';
import type { WorkoutSet } from '../../types';

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onRemove: () => void;
  onToggleComplete: () => void;
}

export function SetRow({ set, index, onUpdate, onRemove, onToggleComplete }: SetRowProps) {
  return (
    <div
      className={`flex items-center gap-1.5 py-2 ${
        set.completed ? 'opacity-60' : ''
      }`}
    >
      <span className="w-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
        {index + 1}
      </span>

      <input
        type="number"
        value={set.weight || ''}
        onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
        placeholder="0"
        className="w-14 px-1 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        disabled={set.completed}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">kg</span>

      <input
        type="number"
        value={set.reps || ''}
        onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
        placeholder="0"
        className="w-12 px-1 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        disabled={set.completed}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">reps</span>

      <input
        type="number"
        value={set.rir ?? ''}
        onChange={(e) => onUpdate({ rir: e.target.value === '' ? undefined : parseInt(e.target.value) })}
        placeholder="-"
        min="0"
        max="5"
        className="w-10 px-1 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        disabled={set.completed}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">RIR</span>

      <div className="flex-1" />

      <button
        onClick={onToggleComplete}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
          set.completed
            ? 'bg-success-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <Check className="w-4 h-4" />
      </button>

      <button
        onClick={onRemove}
        className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 flex items-center justify-center transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
