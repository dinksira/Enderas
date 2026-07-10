import { Button, ModalCloseButton } from '@enderass/shared/ui';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { staffService } from '@enderass/shared/services';
import { evaluationService } from '@enderass/shared/services';

function formatStaffLabel(member) {
  const name = [member.user?.firstName, member.user?.lastName].filter(Boolean).join(' ').trim();
  return name || member.employeeId || member.id;
}

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   initialAssetId?: string|null,
 *   onClose: () => void,
 *   onSubmit: (payload: {
 *     assetId: string,
 *     scheduledAt: string,
 *     notes?: string,
 *     evaluatedByStaffId?: string,
 *   }) => Promise<void>,
 * }} props
 */
export function ScheduleEvaluationModal({
  open,
  loading = false,
  initialAssetId = null,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const [assets, setAssets] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [evaluatorsLoading, setEvaluatorsLoading] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetId, setAssetId] = useState('');
  const [evaluatedByStaffId, setEvaluatedByStaffId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setAssetSearch('');
      setAssetId('');
      setEvaluatedByStaffId('');
      setScheduledAt('');
      setNotes('');
      setError('');
      return undefined;
    }

    if (initialAssetId) {
      setAssetId(initialAssetId);
    }

    let cancelled = false;
    setEvaluatorsLoading(true);

    staffService
      .listStaff({ isActive: true, limit: 100 })
      .then((response) => {
        if (cancelled) return;
        const staff = response?.staff ?? response?.items ?? [];
        setEvaluators(
          staff.filter((member) => member.roleCode === 'evaluation_officer'),
        );
      })
      .catch(() => {
        if (!cancelled) setEvaluators([]);
      })
      .finally(() => {
        if (!cancelled) setEvaluatorsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, initialAssetId]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setAssetsLoading(true);
      evaluationService
        .getEligibleAssets({ search: assetSearch.trim() || undefined })
        .then((items) => {
          if (!cancelled) setAssets(items);
        })
        .catch(() => {
          if (!cancelled) setAssets([]);
        })
        .finally(() => {
          if (!cancelled) setAssetsLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, assetSearch]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === assetId),
    [assets, assetId],
  );

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!assetId) {
      setError(t('evaluations.management.scheduleModal.assetRequired'));
      return;
    }
    if (!scheduledAt) {
      setError(t('evaluations.management.scheduleModal.dateRequired'));
      return;
    }
    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      setError(t('evaluations.management.scheduleModal.dateFutureRequired'));
      return;
    }

    setError('');
    try {
      await onSubmit({
        assetId,
        scheduledAt,
        notes: notes.trim() || undefined,
        evaluatedByStaffId: evaluatedByStaffId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('evaluations.management.scheduleModal.failed'));
    }
  };

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={loading ? undefined : onClose}>
      <form
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-evaluation-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <ModalCloseButton onClick={onClose} disabled={loading} />
        <h2 id="schedule-evaluation-title" className="kyc-modal__title">
          {t('evaluations.management.scheduleModal.title')}
        </h2>
        <p className="kyc-modal__body">{t('evaluations.management.scheduleModal.subtitle')}</p>

        <label className="kyc-modal__label" htmlFor="schedule-evaluation-asset-search">
          {t('evaluations.management.scheduleModal.assetSearch')}
        </label>
        <input
          id="schedule-evaluation-asset-search"
          type="search"
          className="input-field__control"
          value={assetSearch}
          onChange={(event) => setAssetSearch(event.target.value)}
          placeholder={t('evaluations.management.scheduleModal.assetSearchPlaceholder')}
          disabled={loading}
        />

        <label className="kyc-modal__label" htmlFor="schedule-evaluation-asset">
          {t('evaluations.management.scheduleModal.asset')}
        </label>
        <select
          id="schedule-evaluation-asset"
          className="input-field__control"
          value={assetId}
          onChange={(event) => setAssetId(event.target.value)}
          disabled={loading || assetsLoading}
        >
          <option value="">{t('evaluations.management.scheduleModal.selectAsset')}</option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.title} — {t(`assets.types.${asset.assetType}`, { defaultValue: asset.assetType })} —{' '}
              {asset.ownerName || asset.location || asset.id}
            </option>
          ))}
        </select>
        {selectedAsset && (
          <p className="kyc-modal__hint">
            {t('evaluations.management.scheduleModal.assetSummary', {
              owner: selectedAsset.ownerName || '—',
              location: selectedAsset.location || '—',
            })}{' '}
            ·{' '}
            {t(`assets.status.${String(selectedAsset.dbStatus || 'approved').toLowerCase()}`, {
              defaultValue: selectedAsset.status || 'Ready for Evaluation',
            })}
          </p>
        )}

        <label className="kyc-modal__label" htmlFor="schedule-evaluation-evaluator">
          {t('evaluations.management.scheduleModal.evaluator')}
        </label>
        <select
          id="schedule-evaluation-evaluator"
          className="input-field__control"
          value={evaluatedByStaffId}
          onChange={(event) => setEvaluatedByStaffId(event.target.value)}
          disabled={loading || evaluatorsLoading}
        >
          <option value="">{t('evaluations.management.scheduleModal.selectEvaluator')}</option>
          {evaluators.map((member) => (
            <option key={member.id} value={member.id}>
              {formatStaffLabel(member)}
            </option>
          ))}
        </select>

        <label className="kyc-modal__label" htmlFor="schedule-evaluation-date">
          {t('evaluations.management.scheduleModal.scheduledAt')}
        </label>
        <input
          id="schedule-evaluation-date"
          type="datetime-local"
          className="input-field__control"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
          disabled={loading}
        />

        <label className="kyc-modal__label" htmlFor="schedule-evaluation-notes">
          {t('evaluations.management.scheduleModal.notes')}
        </label>
        <textarea
          id="schedule-evaluation-notes"
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
          <Button type="submit" variant="primary" disabled={loading || assetsLoading}>
            <span className="auction-confirm-modal__btn-content">
              {loading && <span className="auction-confirm-modal__spinner" aria-hidden="true" />}
              {loading
                ? t('evaluations.management.scheduleModal.scheduling')
                : t('evaluations.management.scheduleModal.submit')}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ScheduleEvaluationModal;
