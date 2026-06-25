import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * @param {{
 *   open: boolean,
 *   message: string,
 *   variant?: 'success' | 'error',
 *   onClose: () => void,
 *   durationMs?: number,
 * }} props
 */
export function DashboardToast({
  open,
  message,
  variant = 'success',
  onClose,
  durationMs = 4000,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, onClose, durationMs]);

  if (!open || !message) {
    return null;
  }

  return (
    <div
      className={`dashboard-toast dashboard-toast--${variant}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <span className="dashboard-toast__message">{message}</span>
      <button
        type="button"
        className="dashboard-toast__close"
        onClick={onClose}
        aria-label={t('common.close')}
      >
        ×
      </button>
    </div>
  );
}

export default DashboardToast;
