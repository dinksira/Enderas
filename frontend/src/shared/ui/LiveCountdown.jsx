import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCountdownParts, formatCountdown } from '../utils/countdown-utils.js';

/**
 * Tabular countdown with fixed-width numerals for auction end times.
 * @param {{ endDate: string|Date, className?: string, label?: string }} props
 */
export function LiveCountdown({ endDate, className = '', label }) {
  const { t } = useTranslation();
  const [parts, setParts] = useState(() => getCountdownParts(endDate));

  useEffect(() => {
    setParts(getCountdownParts(endDate));

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setParts(getCountdownParts(endDate));
    }, 1000);

    return () => window.clearInterval(id);
  }, [endDate]);

  const display = parts.expired
    ? t('public.auctions.ended')
    : formatCountdown(parts);

  return (
    <span
      className={['pub-countdown', className].filter(Boolean).join(' ')}
      role="timer"
      aria-live="off"
      aria-label={label || t('public.auctions.countdownLabel')}
    >
      <span className="pub-countdown__value" aria-hidden="true">{display}</span>
    </span>
  );
}

export default LiveCountdown;
