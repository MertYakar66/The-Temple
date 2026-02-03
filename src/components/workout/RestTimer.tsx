import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';

interface RestTimerProps {
  defaultSeconds?: number;
  onClose: () => void;
}

export function RestTimer({ defaultSeconds = 90, onClose }: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [initialSeconds] = useState(defaultSeconds);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      // Play a sound or vibrate when timer ends
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setSeconds(initialSeconds);
    setIsRunning(true);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (seconds / initialSeconds) * 100;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-gray-900 text-white rounded-xl p-4 shadow-lg z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={175.93}
                strokeDashoffset={175.93 * (1 - progress / 100)}
                className="text-primary-500 transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono font-bold">
              {formatTime(seconds)}
            </span>
          </div>

          <div>
            <p className="font-semibold">Rest Timer</p>
            <p className="text-sm text-gray-400">
              {seconds === 0 ? 'Time\'s up!' : 'Take a breather'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTimer}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            {isRunning ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={resetTimer}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
