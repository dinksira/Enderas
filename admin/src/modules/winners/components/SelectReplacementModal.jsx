import { Button } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@enderass/shared/auth';
import { bidService } from '@enderass/shared/services';
import { formatEtbAmount } from '@enderass/shared/utils';
import { canViewBidAmounts, formatDate } from '../utils/winner-management-utils.js';

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   winner?: object|null,
 *   onClose: () => void,
 *   onSubmit: (bidId: string) => Promise<void>,
 * }} props
 */
export function SelectReplacementModal({ open, loading = false, winner, onClose, onSubmit }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const roleCode = useAuthStore((state) => state.permissions?.roleCode ?? state.user?.roleCode);
  const canViewAmounts = canViewBidAmounts(roleCode);

  const [bids, setBids] = useState([]);
  const [bidId, setBidId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !winner?.auctionId) {
      setBids([]);
      setBidId('');
      setError('');
      return undefined;
    }

    bidService
      .listBidsForAuction(winner.auctionId, { limit: 100 })
      .then((response) => {
        const items = (response?.items ?? []).filter(
          (bid) => bid.isValid && bid.id !== winner.bidId,
        );
        setBids(items);
      })
      .catch(() => setBids([]));

    return undefined;
  }, [open, winner?.auctionId, winner?.bidId]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!bidId) {
      setError(t('winners.management.replaceModal.required'));
      return;
    }
    setError('');
    try {
      await onSubmit(bidId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('winners.management.replaceModal.failed'));
    }
  };

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={onClose}>
      <form
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="replace-winner-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="replace-winner-title" className="kyc-modal__title">
          {t('winners.management.replaceModal.title')}
        </h2>
        <p className="kyc-modal__body">
          {t('winners.management.replaceModal.subtitle', { auction: winner?.auctionTitle || '—' })}
        </p>

        <div className="winner-replacement-list" role="radiogroup" aria-label={t('winners.management.replaceModal.bidListLabel')}>
          {bids.length === 0 && (
            <p className="kyc-modal__body">{t('winners.management.replaceModal.noBids')}</p>
          )}
          {bids.map((bid) => (
            <label key={bid.id} className="winner-replacement-list__item">
              <input
                type="radio"
                name="replacement-bid"
                value={bid.id}
                checked={bidId === bid.id}
                onChange={() => setBidId(bid.id)}
                disabled={loading}
              />
              <span className="winner-replacement-list__copy">
                <strong>{bid.bidderName || '—'}</strong>
                <span>
                  {canViewAmounts
                    ? formatEtbAmount(bid.amount)
                    : t('winners.management.amount.restricted')}
                  {' · '}
                  {formatDate(bid.submittedAt, locale)}
                </span>
              </span>
            </label>
          ))}
        </div>

        {error && (
          <p className="kyc-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="kyc-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {t('admin.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading || bids.length === 0}>
            {loading
              ? t('winners.management.replaceModal.submitting')
              : t('winners.management.replaceModal.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SelectReplacementModal;
