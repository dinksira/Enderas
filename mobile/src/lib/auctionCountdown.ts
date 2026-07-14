import { useEffect, useRef, useState } from 'react';

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

/**
 * Performance-optimised countdown hook.
 *
 * Previous version called `setCountdown` every 1000ms unconditionally,
 * which forced the ENTIRE parent component (and all its children,
 * including ImageGallery carousels) to re-render every second — even
 * when the displayed label hadn't changed (e.g. "2d 5h 30m" stays the
 * same for a full minute).
 *
 * Fix: compute the new state, compare the `shortLabel` + `label` +
 * `urgency` + `expired` strings/booleans against the previous values,
 * and only call `setCountdown` when something the UI actually displays
 * has changed. This reduces re-renders from 60/min to ~1/min for
 * multi-day auctions, and from 60/min to ~1/sec only for the final
 * hour (where seconds are shown).
 *
 * The interval also adapts: when seconds aren't displayed (days or
 * hours > 0), poll every 5s instead of every 1s — the label won't
 * change more than once per minute anyway, so 5s polling catches the
 * minute boundary with at most a 4s delay.
 */
export function useAuctionCountdown(endDate: string | null | undefined, endedLabel: string) {
  const initialCountdown = getCountdownState(endDate, endedLabel);
  const [countdown, setCountdown] = useState<CountdownState>(initialCountdown);
  // Track the last-displayed values so we can skip redundant state updates.
  const lastLabelRef = useRef(initialCountdown.label);
  const lastShortLabelRef = useRef(initialCountdown.shortLabel);
  const lastUrgencyRef = useRef(initialCountdown.urgency);
  const lastExpiredRef = useRef(initialCountdown.expired);

  useEffect(() => {
    // Sync immediately on mount / when endDate changes.
    const nextState = getCountdownState(endDate, endedLabel);

    const changed =
      nextState.label !== lastLabelRef.current ||
      nextState.shortLabel !== lastShortLabelRef.current ||
      nextState.urgency !== lastUrgencyRef.current ||
      nextState.expired !== lastExpiredRef.current;

    if (changed) {
      lastLabelRef.current = nextState.label;
      lastShortLabelRef.current = nextState.shortLabel;
      lastUrgencyRef.current = nextState.urgency;
      lastExpiredRef.current = nextState.expired;
      setCountdown(nextState);
    }

    // Determine polling interval: if we're in the final hour (seconds
    // are shown), poll every 1s. Otherwise poll every 5s — the label
    // only changes once per minute, so 5s polling is enough.
    const showSeconds =
      nextState.totalSeconds > 0 && nextState.totalSeconds < 3600;
    const intervalMs = showSeconds ? 1000 : 5000;

    const timer = setInterval(() => {
      const state = getCountdownState(endDate, endedLabel);
      const shouldUpdate =
        state.label !== lastLabelRef.current ||
        state.shortLabel !== lastShortLabelRef.current ||
        state.urgency !== lastUrgencyRef.current ||
        state.expired !== lastExpiredRef.current;

      if (shouldUpdate) {
        lastLabelRef.current = state.label;
        lastShortLabelRef.current = state.shortLabel;
        lastUrgencyRef.current = state.urgency;
        lastExpiredRef.current = state.expired;
        setCountdown(state);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [endDate, endedLabel]);

  return countdown;
}

export default useAuctionCountdown;
