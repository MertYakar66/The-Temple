import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  initialTime?: number;
  direction?: 'up' | 'down';
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  time: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newTime?: number) => void;
  toggle: () => void;
  formattedTime: string;
}

export function useTimer({
  initialTime = 0,
  direction = 'up',
  onComplete,
  autoStart = false,
}: UseTimerOptions = {}): UseTimerReturn {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback((newTime?: number) => {
    clearTimer();
    setTime(newTime ?? initialTime);
    setIsRunning(false);
  }, [clearTimer, initialTime]);

  const toggle = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (direction === 'down') {
            if (prevTime <= 1) {
              clearTimer();
              setIsRunning(false);
              onComplete?.();
              return 0;
            }
            return prevTime - 1;
          }
          return prevTime + 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }

    return () => clearTimer();
  }, [isRunning, direction, onComplete, clearTimer]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    toggle,
    formattedTime: formatTime(time),
  };
}

// Separate hook for rest timer with vibration
export function useRestTimer(defaultSeconds: number = 90) {
  const [isVisible, setIsVisible] = useState(false);

  const timer = useTimer({
    initialTime: defaultSeconds,
    direction: 'down',
    onComplete: () => {
      // Vibrate when timer completes
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    },
  });

  const show = useCallback((seconds?: number) => {
    timer.reset(seconds ?? defaultSeconds);
    timer.start();
    setIsVisible(true);
  }, [defaultSeconds, timer]);

  const hide = useCallback(() => {
    timer.pause();
    setIsVisible(false);
  }, [timer]);

  return {
    ...timer,
    isVisible,
    show,
    hide,
    defaultSeconds,
  };
}
