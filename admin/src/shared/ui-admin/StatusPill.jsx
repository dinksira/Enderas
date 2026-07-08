/**
 * @param {{
 *   label: string,
 *   variant?: string,
 *   className?: string,
 * }} props
 */
export function StatusPill({ label, variant = 'default', className = '' }) {
  const classes = ['status-pill', `status-pill--${variant}`, className].filter(Boolean).join(' ');

  return <span className={classes}>{label}</span>;
}

export default StatusPill;
