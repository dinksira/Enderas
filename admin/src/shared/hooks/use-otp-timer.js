import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_DURATION = 300;

function resolveSecondsLeft({ duration = DEFAULT_DURATION, expiresAt = null } = {}) {
  if (expiresAt) {
    const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  return Math.max(0, duration);
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

/**
 * @param {number | { duration?: number, expiresAt?: string|null }} [options]
 */
export function useOtpTimer(options = DEFAULT_DURATION) {
  const config = useMemo(() => {
    if (typeof options === 'number') {
      return { duration: options, expiresAt: null };
    }

    return {
      duration: options.duration ?? DEFAULT_DURATION,
      expiresAt: options.expiresAt ?? null,
    };
  }, [options]);

  const [secondsLeft, setSecondsLeft] = useState(() => resolveSecondsLeft(config));
  const [isRunning, setIsRunning] = useState(() => resolveSecondsLeft(config) > 0);
  const [isExpired, setIsExpired] = useState(() => resolveSecondsLeft(config) === 0);

  useEffect(() => {
    const nextSeconds = resolveSecondsLeft(config);
    setSecondsLeft(nextSeconds);
    setIsRunning(nextSeconds > 0);
    setIsExpired(nextSeconds === 0);
  }, [config]);

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

  const reset = useCallback((nextOptions = config) => {
    const nextConfig = typeof nextOptions === 'string'
      ? { duration: config.duration, expiresAt: nextOptions }
      : {
        duration: nextOptions.duration ?? config.duration,
        expiresAt: nextOptions.expiresAt ?? null,
      };
    const nextSeconds = resolveSecondsLeft(nextConfig);
    setSecondsLeft(nextSeconds);
    setIsRunning(nextSeconds > 0);
    setIsExpired(nextSeconds === 0);
  }, [config]);

  return {
    secondsLeft,
    isExpired,
    formatted: formatCountdown(secondsLeft),
    reset,
  };
}

export default useOtpTimer;
