/**
 * @param {string|Date|number} endDate
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, expired: boolean, totalMs: number }}
 */
export function getCountdownParts(endDate) {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const totalMs = Math.max(0, end - now);

  if (!Number.isFinite(end) || totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, totalMs: 0 };
  }

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);

  return { days, hours, minutes, seconds, expired: false, totalMs };
}

/**
 * @param {{ days: number, hours: number, minutes: number, seconds: number }} parts
 */
export function formatCountdown(parts) {
  const pad = (n) => String(n).padStart(2, '0');
  if (parts.days > 0) {
    return `${pad(parts.days)}:${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
  }
  return `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
}

export default { getCountdownParts, formatCountdown };
