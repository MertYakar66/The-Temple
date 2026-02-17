import { useEffect, useMemo } from 'react';
import { Trophy, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { kgToDisplay, getWeightUnit } from '../utils/weight';

// Pre-generate confetti data outside component to avoid render-time randomness
const CONFETTI_COLORS = ['#FFF', '#FFD700', '#FF6B6B', '#4ECDC4'];

export function PRCelebration() {
  const newPRs = useStore((state) => state.newPRs);
  const clearNewPRs = useStore((state) => state.clearNewPRs);
  const user = useStore((state) => state.user);

  const unitSystem = user?.unitSystem || 'metric';
  const weightUnit = getWeightUnit(unitSystem);

  // Generate confetti positions once using useMemo
  const confettiPieces = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${(i * 8.33) + Math.random() * 5}%`, // Spread evenly with slight randomness
      color: CONFETTI_COLORS[i % 4],
      delay: `${i * 0.04}s`,
      duration: `${1.2 + (i % 3) * 0.2}s`,
    }));
  }, []);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (newPRs.length > 0) {
      const timer = setTimeout(() => {
        clearNewPRs();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newPRs, clearNewPRs]);

  if (newPRs.length === 0) return null;

  const latestPR = newPRs[newPRs.length - 1];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-2xl p-6 shadow-2xl max-w-sm mx-4 animate-bounce-in pointer-events-auto">
        {/* Close button */}
        <button
          onClick={clearNewPRs}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <Trophy className="w-10 h-10" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          NEW PR!
        </h2>

        {/* PR Details */}
        <div className="text-center">
          <p className="text-lg font-semibold mb-1">{latestPR.exerciseName}</p>
          <p className="text-3xl font-bold mb-1">
            {Math.round(kgToDisplay(latestPR.weight, unitSystem) * 10) / 10} {weightUnit} × {latestPR.reps} reps
          </p>
          {newPRs.length > 1 && (
            <p className="text-sm opacity-80 mt-2">
              +{newPRs.length - 1} more PRs this workout!
            </p>
          )}
        </div>

        {/* Confetti effect */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-2 h-2 animate-confetti"
              style={{
                left: piece.left,
                top: '-10px',
                backgroundColor: piece.color,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
