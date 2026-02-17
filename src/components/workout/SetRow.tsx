import { Check, X, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import type { WorkoutSet, UnitSystem } from '../../types';
import { kgToDisplay, displayToKg, getWeightUnit } from '../../utils/weight';

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onRemove: () => void;
  onToggleComplete: () => void;
  unitSystem: UnitSystem;
}

export function SetRow({ set, index, onUpdate, onRemove, onToggleComplete, unitSystem }: SetRowProps) {
  const [showNotes, setShowNotes] = useState(false);

  // Convert stored kg to display unit
  const displayWeight = set.weight ? Math.round(kgToDisplay(set.weight, unitSystem) * 10) / 10 : '';
  const weightUnit = getWeightUnit(unitSystem);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayValue = parseFloat(e.target.value) || 0;
    // Convert display value back to kg for storage
    const kgValue = displayToKg(displayValue, unitSystem);
    onUpdate({ weight: kgValue });
  };

  return (
    <div className="py-2">
      <div
        className={`flex items-center gap-1.5 ${
          set.completed ? 'opacity-60' : ''
        }`}
      >
        <span className="w-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
          {index + 1}
        </span>

        <input
          type="number"
          value={displayWeight}
          onChange={handleWeightChange}
          placeholder="0"
          className="w-14 px-1 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          disabled={set.completed}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">{weightUnit}</span>

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

        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            set.notes
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title="Add note"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>

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

      {/* Notes Input */}
      {showNotes && (
        <div className="mt-2 ml-6">
          <textarea
            value={set.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="How did this set feel? Any observations..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={2}
            disabled={set.completed}
          />
        </div>
      )}

      {/* Show note preview when collapsed */}
      {!showNotes && set.notes && (
        <div
          className="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400 italic truncate cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
          onClick={() => setShowNotes(true)}
        >
          "{set.notes}"
        </div>
      )}
    </div>
  );
}
