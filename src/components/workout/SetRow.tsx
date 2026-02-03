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
      className={`flex items-center gap-2 py-2 ${
        set.completed ? 'opacity-60' : ''
      }`}
    >
      <span className="w-8 text-center text-sm font-medium text-gray-500">
        {index + 1}
      </span>

      <input
        type="number"
        value={set.weight || ''}
        onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
        placeholder="0"
        className="w-20 px-2 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        disabled={set.completed}
      />
      <span className="text-sm text-gray-500">kg</span>

      <input
        type="number"
        value={set.reps || ''}
        onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
        placeholder="0"
        className="w-16 px-2 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        disabled={set.completed}
      />
      <span className="text-sm text-gray-500">reps</span>

      <div className="flex-1" />

      <button
        onClick={onToggleComplete}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          set.completed
            ? 'bg-success-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Check className="w-5 h-5" />
      </button>

      <button
        onClick={onRemove}
        className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
