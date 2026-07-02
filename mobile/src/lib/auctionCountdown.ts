import { useEffect, useState } from 'react';

type CountdownUrgency = 'expired' | 'critical' | 'soon' | 'warm' | 'far';

interface CountdownState {
  label: string;
  shortLabel: string;
  accentLabel: string;
  expired: boolean;
  urgency: CountdownUrgency;
  totalSeconds: number;
}

function pad2(value: number) {
  return value < 10 ? `0${value}` : String(value);
}

function getRemainingMs(endDate?: string | null) {
  if (!endDate) return null;
  const endMs = new Date(endDate).getTime();
  if (isNaN(endMs)) return null;
  return Math.max(0, endMs - Date.now());
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${pad2(hours)}h ${pad2(minutes)}m`;
  }

  if (hours > 0) {
    return `${hours}h ${pad2(minutes)}m ${pad2(seconds)}s`;
  }

  return `${minutes}m ${pad2(seconds)}s`;
}

function formatShortRemaining(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${pad2(minutes)}m`;
  }

  return `${minutes}m ${pad2(seconds)}s`;
}

function getUrgency(totalSeconds: number): CountdownUrgency {
  if (totalSeconds <= 0) return 'expired';
  if (totalSeconds <= 15 * 60) return 'critical';
  if (totalSeconds <= 60 * 60) return 'soon';
  if (totalSeconds <= 24 * 60 * 60) return 'warm';
  return 'far';
}

function getAccentLabel(urgency: CountdownUrgency) {
  switch (urgency) {
    case 'critical':
      return 'Closing now';
    case 'soon':
      return 'Ending soon';
    case 'warm':
      return 'Time left';
    case 'far':
      return 'Plenty of time';
    default:
      return 'Closed';
  }
}

function getCountdownState(endDate: string | null | undefined, endedLabel: string): CountdownState {
  const remainingMs = getRemainingMs(endDate);
  if (remainingMs === null) {
    return {
      label: '—',
      shortLabel: '—',
      accentLabel: 'Schedule pending',
      expired: false,
      urgency: 'far',
      totalSeconds: 0,
    };
  }

  if (remainingMs <= 0) {
    return {
      label: endedLabel,
      shortLabel: endedLabel,
      accentLabel: 'Closed',
      expired: true,
      urgency: 'expired',
      totalSeconds: 0,
    };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const urgency = getUrgency(totalSeconds);

  return {
    label: formatRemaining(remainingMs),
    shortLabel: formatShortRemaining(totalSeconds),
    accentLabel: getAccentLabel(urgency),
    expired: false,
    urgency,
    totalSeconds,
  };
}

export function useAuctionCountdown(endDate: string | null | undefined, endedLabel: string) {
  const initialCountdown = getCountdownState(endDate, endedLabel);
  const [countdown, setCountdown] = useState<CountdownState>(initialCountdown);

  useEffect(() => {
    const syncTimer = setTimeout(() => {
      setCountdown(getCountdownState(endDate, endedLabel));
    }, 0);

    const timer = setInterval(() => {
      setCountdown(getCountdownState(endDate, endedLabel));
    }, 1000);

    return () => {
      clearTimeout(syncTimer);
      clearInterval(timer);
    };
  }, [endDate, endedLabel]);

  return countdown;
}

export default useAuctionCountdown;
