import { useCallback, useEffect, useState } from 'react';

const DEFAULT_DURATION = 60;

function formatCountdown(seconds) {
  const padded = String(seconds).padStart(2, '0');
  return `00:${padded}`;
}

/**
 * @param {number} [duration=60]
 */
export function useOtpTimer(duration = DEFAULT_DURATION) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setIsRunning(false);
          setIsExpired(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning]);

  const reset = useCallback(() => {
    setSecondsLeft(duration);
    setIsRunning(true);
    setIsExpired(false);
  }, [duration]);

  return {
    secondsLeft,
    isExpired,
    formatted: formatCountdown(secondsLeft),
    reset,
  };
}

export default useOtpTimer;
