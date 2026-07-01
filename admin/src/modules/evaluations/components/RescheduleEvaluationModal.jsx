import { Button } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   evaluation?: object|null,
 *   mode?: 'update' | 'reschedule',
 *   onClose: () => void,
 *   onSubmit: (payload: { scheduledAt: string, notes?: string }) => Promise<void>,
 * }} props
 */
export function RescheduleEvaluationModal({
  open,
  loading = false,
  evaluation = null,
  mode = 'update',
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setScheduledAt('');
      setNotes('');
      setError('');
      return;
    }

    if (evaluation?.scheduledAt) {
      const date = new Date(evaluation.scheduledAt);
      if (!Number.isNaN(date.getTime())) {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        setScheduledAt(local.toISOString().slice(0, 16));
      }
    }
    if (evaluation?.notes && mode === 'update') {
      setNotes(evaluation.notes);
    } else {
      setNotes('');
    }
  }, [open, evaluation, mode]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!scheduledAt) {
      setError(t('evaluations.management.rescheduleModal.dateRequired'));
      return;
    }
    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      setError(t('evaluations.management.rescheduleModal.dateFutureRequired'));
      return;
    }

    setError('');
    try {
      await onSubmit({
        scheduledAt,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('evaluations.management.rescheduleModal.failed'),
      );
    }
  };

  const titleKey =
    mode === 'reschedule'
      ? 'evaluations.management.rescheduleModal.rescheduleTitle'
      : 'evaluations.management.rescheduleModal.title';

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={loading ? undefined : onClose}>
      <form
        className="kyc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-evaluation-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="reschedule-evaluation-title" className="kyc-modal__title">
          {t(titleKey)}
        </h2>
        <p className="kyc-modal__body">{t('evaluations.management.rescheduleModal.subtitle')}</p>

        <label className="kyc-modal__label" htmlFor="reschedule-evaluation-date">
          {t('evaluations.management.rescheduleModal.scheduledAt')}
        </label>
        <input
          id="reschedule-evaluation-date"
          type="datetime-local"
          className="input-field__control"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
          disabled={loading}
        />

        <label className="kyc-modal__label" htmlFor="reschedule-evaluation-notes">
          {t('evaluations.management.rescheduleModal.notes')}
        </label>
        <textarea
          id="reschedule-evaluation-notes"
          className="kyc-modal__textarea"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={loading}
        />

        {error && (
          <p className="kyc-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {t('admin.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            <span className="auction-confirm-modal__btn-content">
              {loading && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
              {loading
                ? t('evaluations.management.rescheduleModal.submitting')
                : t('evaluations.management.rescheduleModal.submit')}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RescheduleEvaluationModal;
