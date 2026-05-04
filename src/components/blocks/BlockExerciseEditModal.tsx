import { useState } from 'react';
import { X } from 'lucide-react';
import type { CustomBlockExercise } from '../../types';

interface Props {
  exercise: CustomBlockExercise;
  onSave: (updated: CustomBlockExercise) => void;
  onClose: () => void;
}

export function BlockExerciseEditModal({ exercise, onSave, onClose }: Props) {
  const [name, setName] = useState(exercise.name);
  const [sets, setSets] = useState(exercise.sets);
  const [repRange, setRepRange] = useState(exercise.repRange);
  const [rirS1, setRirS1] = useState(exercise.rirS1);
  const [rirS2, setRirS2] = useState(exercise.rirS2);
  const [rest, setRest] = useState(exercise.rest);
  const [warmup, setWarmup] = useState(exercise.warmup);
  const [lastSetIntensity, setLastSetIntensity] = useState(exercise.lastSetIntensity);
  const [note, setNote] = useState(exercise.note || '');
  const [sub1, setSub1] = useState(exercise.substitutions?.sub1 || '');
  const [sub2, setSub2] = useState(exercise.substitutions?.sub2 || '');

  const handleSave = () => {
    if (!name.trim()) return;
    const trimmedSub1 = sub1.trim();
    const trimmedSub2 = sub2.trim();
    const subs = {
      ...(trimmedSub1 ? { sub1: trimmedSub1 } : {}),
      ...(trimmedSub2 ? { sub2: trimmedSub2 } : {}),
    };
    onSave({
      name: name.trim(),
      sets,
      repRange,
      rirS1,
      rirS2,
      rest,
      warmup,
      lastSetIntensity,
      note: note.trim() || null,
      substitutions: trimmedSub1 || trimmedSub2 ? subs : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 dark:text-white">Edit Exercise</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Exercise Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>

          {/* Sets & Reps */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Sets</label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Rep Range</label>
              <input
                type="text"
                value={repRange}
                onChange={(e) => setRepRange(e.target.value)}
                placeholder="e.g. 8-10"
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* RIR */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">RIR (Set 1)</label>
              <input
                type="text"
                value={rirS1}
                onChange={(e) => setRirS1(e.target.value)}
                placeholder="e.g. 3 or N/A"
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">RIR (Set 2)</label>
              <input
                type="text"
                value={rirS2}
                onChange={(e) => setRirS2(e.target.value)}
                placeholder="e.g. 2 or N/A"
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Rest & Warmup */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Rest</label>
              <input
                type="text"
                value={rest}
                onChange={(e) => setRest(e.target.value)}
                placeholder="e.g. 2-3 min"
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Warm-up Sets</label>
              <input
                type="text"
                value={warmup}
                onChange={(e) => setWarmup(e.target.value)}
                placeholder="e.g. 2-4"
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Last Set Intensity */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Set Intensity</label>
            <input
              type="text"
              value={lastSetIntensity}
              onChange={(e) => setLastSetIntensity(e.target.value)}
              placeholder="N/A or technique name"
              className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Substitutions */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Substitution 1</label>
            <input
              type="text"
              value={sub1}
              onChange={(e) => setSub1(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Substitution 2</label>
            <input
              type="text"
              value={sub2}
              onChange={(e) => setSub2(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
