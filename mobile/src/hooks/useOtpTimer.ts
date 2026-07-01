import { useEffect, useState } from 'react';

/**
 * Simple OTP resend countdown timer (seconds).
 */
export function useOtpTimer(initialSeconds = 60) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const reset = () => setSecondsLeft(initialSeconds);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return {
    secondsLeft,
    formatted,
    isExpired: secondsLeft <= 0,
    reset,
  };
}

export default useOtpTimer;
