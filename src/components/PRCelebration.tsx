import { useEffect } from 'react';
import { Trophy, X } from 'lucide-react';
import { useStore } from '../store/useStore';

export function PRCelebration() {
  const newPRs = useStore((state) => state.newPRs);
  const clearNewPRs = useStore((state) => state.clearNewPRs);

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
            {latestPR.weight} kg × {latestPR.reps} reps
          </p>
          {newPRs.length > 1 && (
            <p className="text-sm opacity-80 mt-2">
              +{newPRs.length - 1} more PRs this workout!
            </p>
          )}
        </div>

        {/* Confetti effect */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#FFF', '#FFD700', '#FF6B6B', '#4ECDC4'][i % 4],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
