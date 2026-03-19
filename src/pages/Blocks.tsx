import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronDown, ChevronUp, Info, Repeat, Dumbbell, Clock,
  AlertTriangle, Play, Pencil, Trash2, Plus, RotateCcw, GripVertical,
} from 'lucide-react';
import { minMaxProgram } from '../data/minMaxProgram';
import type { CustomBlockExercise, CustomBlockDay } from '../types';
import { useStore } from '../store/useStore';
import { BlockExerciseEditModal } from '../components/blocks/BlockExerciseEditModal';
import { BlockDayAddModal } from '../components/blocks/BlockDayAddModal';

export function Blocks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startWorkoutFromBlock = useStore((s) => s.startWorkoutFromBlock);
  const currentSession = useStore((s) => s.currentSession);
  const getBlockWeekDays = useStore((s) => s.getBlockWeekDays);
  const addDayToWeek = useStore((s) => s.addDayToWeek);
  const removeDayFromWeek = useStore((s) => s.removeDayFromWeek);
  const addExerciseToDay = useStore((s) => s.addExerciseToDay);
  const removeExerciseFromDay = useStore((s) => s.removeExerciseFromDay);
  const updateExerciseInDay = useStore((s) => s.updateExerciseInDay);
  const reorderExercisesInDay = useStore((s) => s.reorderExercisesInDay);
  const resetWeekToDefault = useStore((s) => s.resetWeekToDefault);
  const blockCustomizations = useStore((s) => s.blockCustomizations);

  const initBlock = Number(searchParams.get('block') || 0);
  const initWeek = Number(searchParams.get('week') || 0);
  const initDay = searchParams.get('day') || null;

  const [selectedBlockIdx, setSelectedBlockIdx] = useState(initBlock);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(initWeek);
  // Auto-expand day from query params
  const initExpandedDay = (() => {
    if (!initDay) return null;
    const block = minMaxProgram.blocks[initBlock];
    if (!block) return null;
    const week = block.weeks[initWeek];
    if (!week) return null;
    const idx = week.days.findIndex((d) => d.dayName === initDay);
    return idx >= 0 ? `${idx}` : null;
  })();

  const [expandedDay, setExpandedDay] = useState<string | null>(initExpandedDay);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Modal state
  const [editingExercise, setEditingExercise] = useState<{ dayIdx: number; exIdx: number; exercise: CustomBlockExercise } | null>(null);
  const [showAddDay, setShowAddDay] = useState<number | null>(null); // afterDayIdx

  const handleStartFromBlock = (dayName: string, exercises: CustomBlockExercise[]) => {
    if (currentSession) {
      if (!window.confirm('You have an active workout. Start a new one? Current progress will be lost.')) {
        return;
      }
    }
    startWorkoutFromBlock(dayName, exercises);
    navigate('/workout');
  };

  const program = minMaxProgram;
  const block = program.blocks[selectedBlockIdx];
  const week = block.weeks[selectedWeekIdx];

  // Get customized days (overrides or defaults)
  const days: CustomBlockDay[] = getBlockWeekDays(selectedBlockIdx, selectedWeekIdx);
  const weekKey = `${selectedBlockIdx}-${selectedWeekIdx}`;
  const hasOverrides = weekKey in blockCustomizations.weekOverrides;

  const toggleDay = (dayKey: string) => {
    setExpandedDay(expandedDay === dayKey ? null : dayKey);
    setExpandedExercise(null);
  };

  const toggleExercise = (key: string) => {
    setExpandedExercise(expandedExercise === key ? null : key);
  };

  const getRirColor = (rir: string) => {
    if (rir === 'N/A') return 'text-gray-400 dark:text-gray-500';
    const val = parseInt(rir);
    if (val === 0) return 'text-red-600 dark:text-red-400 font-bold';
    if (val === 1) return 'text-orange-500 dark:text-orange-400 font-semibold';
    if (val === 2) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getIntensityBadge = (intensity: string) => {
    if (intensity === 'N/A') return null;
    let color = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    if (intensity.includes('Drop')) color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (intensity.includes('Myo')) color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    if (intensity.includes('Static')) color = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
        {intensity}
      </span>
    );
  };

  const handleDeleteExercise = (dayIdx: number, exIdx: number) => {
    if (!window.confirm('Delete this exercise?')) return;
    removeExerciseFromDay(selectedBlockIdx, selectedWeekIdx, dayIdx, exIdx);
  };

  const handleDeleteDay = (dayIdx: number) => {
    if (!window.confirm('Delete this day and all its exercises?')) return;
    removeDayFromWeek(selectedBlockIdx, selectedWeekIdx, dayIdx);
    setExpandedDay(null);
  };

  const handleResetWeek = () => {
    if (!window.confirm('Reset this week to the default program? All customizations will be lost.')) return;
    resetWeekToDefault(selectedBlockIdx, selectedWeekIdx);
  };

  const handleAddNewExercise = (dayIdx: number) => {
    const newExercise: CustomBlockExercise = {
      name: 'New Exercise',
      lastSetIntensity: 'N/A',
      warmup: '0',
      sets: 3,
      repRange: '8-12',
      rirS1: '2',
      rirS2: 'N/A',
      rest: '2-3 min',
    };
    addExerciseToDay(selectedBlockIdx, selectedWeekIdx, dayIdx, newExercise);
    // Open edit modal for the new exercise
    const currentDays = getBlockWeekDays(selectedBlockIdx, selectedWeekIdx);
    const newIdx = currentDays[dayIdx].exercises.length; // it was just added
    setEditingExercise({ dayIdx, exIdx: newIdx - 1, exercise: newExercise });
  };

  const renderExerciseRow = (exercise: CustomBlockExercise, dayIdx: number, exIdx: number, totalExercises: number) => {
    const key = `${dayIdx}-${exIdx}`;
    const isExpanded = expandedExercise === key;
    const hasSubs = exercise.substitutions?.sub1 || exercise.substitutions?.sub2;
    const hasNote = exercise.note;

    return (
      <div key={key} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <div className="flex items-center">
          {editMode && (
            <div className="flex flex-col items-center pl-2 py-1 gap-0.5">
              <button
                onClick={() => { if (exIdx > 0) reorderExercisesInDay(selectedBlockIdx, selectedWeekIdx, dayIdx, exIdx, exIdx - 1); }}
                disabled={exIdx === 0}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              <button
                onClick={() => { if (exIdx < totalExercises - 1) reorderExercisesInDay(selectedBlockIdx, selectedWeekIdx, dayIdx, exIdx, exIdx + 1); }}
                disabled={exIdx === totalExercises - 1}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={() => {
              if (editMode) {
                setEditingExercise({ dayIdx, exIdx, exercise });
              } else if (hasSubs || hasNote) {
                toggleExercise(key);
              }
            }}
            className="flex-1 text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {exercise.name}
                </p>
                {exercise.lastSetIntensity !== 'N/A' && (
                  <div className="mt-1">
                    {getIntensityBadge(exercise.lastSetIntensity)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs flex-shrink-0">
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-500">Sets</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{exercise.sets}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-500">Reps</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{exercise.repRange}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-500">RIR</p>
                  <p className={getRirColor(exercise.rirS2 !== 'N/A' ? exercise.rirS2 : exercise.rirS1)}>
                    {exercise.rirS2 !== 'N/A' ? `${exercise.rirS1}-${exercise.rirS2}` : exercise.rirS1}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-500">Rest</p>
                  <p className="text-gray-600 dark:text-gray-300">{exercise.rest}</p>
                </div>
                {!editMode && (hasSubs || hasNote) && (
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                )}
              </div>
            </div>
          </button>
          {editMode && (
            <button
              onClick={() => handleDeleteExercise(dayIdx, exIdx)}
              className="p-2 mr-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {!editMode && isExpanded && (hasSubs || hasNote) && (
          <div className="px-3 pb-3 space-y-2">
            {exercise.warmup !== '0' && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">Warm-up sets:</span> {exercise.warmup}
              </p>
            )}
            {hasNote && (
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                {exercise.note}
              </p>
            )}
            {hasSubs && (
              <div className="flex flex-wrap gap-2">
                {exercise.substitutions?.sub1 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    {exercise.substitutions.sub1}
                  </span>
                )}
                {exercise.substitutions?.sub2 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    {exercise.substitutions.sub2}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Sub-header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-white">Blocks</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`p-2 rounded-lg transition-colors ${
              editMode
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Program Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowNotes(false)}>
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">Program Notes</h2>
              <button onClick={() => setShowNotes(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
                &times;
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold mb-1">Important</p>
                    {program.programNotes.map((note, i) => (
                      <p key={i} className="mb-2 last:mb-0">{note}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">Warm-Up Protocol</p>
                    <p>{program.warmupProtocol}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Program Title */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-4 text-white">
          <h2 className="text-lg font-bold">{program.name}</h2>
          <p className="text-primary-100 text-sm mt-1">{program.frequency} &middot; 12 Weeks &middot; 2 Blocks</p>
        </div>

        {/* Block Selector */}
        <div className="flex gap-2">
          {program.blocks.map((b, idx) => (
            <button
              key={b.blockNumber}
              onClick={() => { setSelectedBlockIdx(idx); setSelectedWeekIdx(0); setExpandedDay(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
                selectedBlockIdx === idx
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {b.blockName}
            </button>
          ))}
        </div>

        {/* Week Selector Dropdown */}
        <div className="relative">
          <select
            value={selectedWeekIdx}
            onChange={(e) => { setSelectedWeekIdx(Number(e.target.value)); setExpandedDay(null); }}
            className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 pr-10 font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {block.weeks.map((w, idx) => (
              <option key={w.weekNumber} value={idx}>
                Week {w.weekNumber} {w.label !== `Week ${w.weekNumber}` ? `- ${w.label}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Week Label Badge + Reset */}
        <div className="flex items-center justify-between">
          {week.label !== `Week ${week.weekNumber}` ? (
            <div className={`text-center text-sm font-medium px-3 py-1.5 rounded-full ${
              week.label === 'Intro Week' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              week.label === 'Deload Week' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {week.label}
            </div>
          ) : <div />}
          {editMode && hasOverrides && (
            <button
              onClick={handleResetWeek}
              className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Default
            </button>
          )}
        </div>

        {/* Customized indicator */}
        {hasOverrides && !editMode && (
          <div className="text-xs text-center text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg py-1.5">
            Customized
          </div>
        )}

        {/* Days */}
        <div className="space-y-3">
          {days.map((day, dayIdx) => {
            if (day.exercises.length === 0 && !editMode) {
              return (
                <div key={dayIdx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 opacity-60">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{day.dayName}</p>
                </div>
              );
            }

            const isExpanded = expandedDay === `${dayIdx}`;
            return (
              <div key={dayIdx}>
                <div className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden ${
                  day.isCustom
                    ? 'border-primary-300 dark:border-primary-700'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <button
                    onClick={() => toggleDay(`${dayIdx}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      day.isCustom
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-primary-100 dark:bg-primary-900/30'
                    }`}>
                      <Dumbbell className={`w-5 h-5 ${
                        day.isCustom
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-primary-600 dark:text-primary-400'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{day.dayName}</h3>
                        {day.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Custom</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{day.exercises.length} exercises</p>
                    </div>
                    {editMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDay(dayIdx); }}
                        className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      {day.exercises.map((exercise, exIdx) => renderExerciseRow(exercise, dayIdx, exIdx, day.exercises.length))}

                      {editMode && (
                        <button
                          onClick={() => handleAddNewExercise(dayIdx)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Exercise
                        </button>
                      )}

                      {!editMode && (
                        <div className="px-3 py-3">
                          <button
                            onClick={() => handleStartFromBlock(day.dayName, day.exercises)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Start Workout
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Add Day button between days (edit mode) */}
                {editMode && (
                  <button
                    onClick={() => setShowAddDay(dayIdx)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 text-xs text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Insert Day
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Day at end (edit mode, when no days or after last day) */}
          {editMode && days.length === 0 && (
            <button
              onClick={() => setShowAddDay(-1)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Workout Day
            </button>
          )}
        </div>
      </div>

      {/* Exercise Edit Modal */}
      {editingExercise && (
        <BlockExerciseEditModal
          exercise={editingExercise.exercise}
          onSave={(updated) => {
            updateExerciseInDay(selectedBlockIdx, selectedWeekIdx, editingExercise.dayIdx, editingExercise.exIdx, updated);
            setEditingExercise(null);
          }}
          onClose={() => setEditingExercise(null)}
        />
      )}

      {/* Add Day Modal */}
      {showAddDay !== null && (
        <BlockDayAddModal
          onSave={(day) => {
            addDayToWeek(selectedBlockIdx, selectedWeekIdx, showAddDay, day);
            setShowAddDay(null);
          }}
          onClose={() => setShowAddDay(null)}
        />
      )}
    </div>
  );
}
