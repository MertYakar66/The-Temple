import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Info, Repeat, Dumbbell, Clock, AlertTriangle } from 'lucide-react';
import { minMaxProgram } from '../data/minMaxProgram';
import type { BlockExercise } from '../data/minMaxProgram';

export function Blocks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initBlock = Number(searchParams.get('block') || 0);
  const initWeek = Number(searchParams.get('week') || 0);
  const initDay = searchParams.get('day') || null;

  const [selectedBlockIdx, setSelectedBlockIdx] = useState(initBlock);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(initWeek);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  // Auto-expand day from query params
  useEffect(() => {
    if (initDay) {
      const program = minMaxProgram;
      const block = program.blocks[initBlock];
      if (block) {
        const week = block.weeks[initWeek];
        if (week) {
          const dayIdx = week.days.findIndex((d) => d.dayName === initDay);
          if (dayIdx >= 0) {
            setExpandedDay(`${dayIdx}`);
          }
        }
      }
    }
  }, [initBlock, initWeek, initDay]);

  const program = minMaxProgram;
  const block = program.blocks[selectedBlockIdx];
  const week = block.weeks[selectedWeekIdx];

  const toggleDay = (dayName: string) => {
    setExpandedDay(expandedDay === dayName ? null : dayName);
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

  const renderExerciseRow = (exercise: BlockExercise, dayIdx: number, exIdx: number) => {
    const key = `${dayIdx}-${exIdx}`;
    const isExpanded = expandedExercise === key;
    const hasSubs = exercise.substitutions?.sub1 || exercise.substitutions?.sub2;
    const hasNote = exercise.note;

    return (
      <div key={key} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <button
          onClick={() => (hasSubs || hasNote) && toggleExercise(key)}
          className="w-full text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
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
              {(hasSubs || hasNote) && (
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </div>
          </div>
        </button>

        {isExpanded && (hasSubs || hasNote) && (
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
          <h1 className="font-semibold text-gray-900 dark:text-white">Blocks</h1>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </header>

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

        {/* Week Label Badge */}
        {week.label !== `Week ${week.weekNumber}` && (
          <div className={`text-center text-sm font-medium px-3 py-1.5 rounded-full ${
            week.label === 'Intro Week' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
            week.label === 'Deload Week' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {week.label}
          </div>
        )}

        {/* Days */}
        <div className="space-y-3">
          {week.days.map((day, dayIdx) => {
            if (day.exercises.length === 0) {
              return (
                <div key={dayIdx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 opacity-60">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{day.dayName}</p>
                </div>
              );
            }

            const isExpanded = expandedDay === `${dayIdx}`;
            return (
              <div key={dayIdx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleDay(`${dayIdx}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{day.dayName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{day.exercises.length} exercises</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {day.exercises.map((exercise, exIdx) => renderExerciseRow(exercise, dayIdx, exIdx))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
