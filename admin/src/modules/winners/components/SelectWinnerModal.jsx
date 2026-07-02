import { Button, ModalCloseButton } from '@enderass/shared/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@enderass/shared/auth';
import { canViewBidAmounts } from '../utils/winner-management-utils.js';
import { formatEtbAmount } from '@enderass/shared/utils';
import { auctionService, bidService } from '@enderass/shared/services';

/**
 * @param {{
 *   open: boolean,
 *   loading?: boolean,
 *   onClose: () => void,
 *   onSubmit: (payload: { auctionId: string, bidId: string }) => Promise<void>,
 * }} props
 */
export function SelectWinnerModal({ open, loading = false, onClose, onSubmit }) {
  const { t } = useTranslation();
  const roleCode = useAuthStore((state) => state.permissions?.roleCode ?? state.user?.roleCode);
  const canViewAmounts = canViewBidAmounts(roleCode);
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [auctionId, setAuctionId] = useState('');
  const [bidId, setBidId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setAuctionId('');
      setBidId('');
      setBids([]);
      setError('');
      return undefined;
    }

    auctionService
      .getAll({ status: 'closed', limit: 100 })
      .then((response) => {
        const list = response?.auctions ?? response?.items ?? [];
        setAuctions(Array.isArray(list) ? list : []);
      })
      .catch(() => setAuctions([]));

    return undefined;
  }, [open]);

  useEffect(() => {
    if (!auctionId) {
      setBids([]);
      setBidId('');
      return undefined;
    }

    bidService
      .listBidsForAuction(auctionId, { limit: 100 })
      .then((response) => setBids(response?.items ?? []))
      .catch(() => setBids([]));

    return undefined;
  }, [auctionId]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auctionId || !bidId) {
      setError(t('winners.management.selectModal.required'));
      return;
    }
    setError('');
    try {
      await onSubmit({ auctionId, bidId });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('winners.management.selectModal.failed'));
    }
  };

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={onClose}>
      <form
        className="kyc-modal kyc-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-winner-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <ModalCloseButton onClick={onClose} disabled={loading} />
        <h2 id="select-winner-title" className="kyc-modal__title">
          {t('winners.management.selectModal.title')}
        </h2>
        <p className="kyc-modal__body">{t('winners.management.selectModal.subtitle')}</p>

        <label className="kyc-modal__label" htmlFor="select-winner-auction">
          {t('winners.management.selectModal.auction')}
        </label>
        <select
          id="select-winner-auction"
          className="input-field__control"
          value={auctionId}
          onChange={(event) => setAuctionId(event.target.value)}
          disabled={loading}
        >
          <option value="">{t('winners.management.selectModal.selectAuction')}</option>
          {auctions.map((auction) => (
            <option key={auction.id} value={auction.id}>
              {auction.title || auction.id}
            </option>
          ))}
        </select>

        <label className="kyc-modal__label" htmlFor="select-winner-bid">
          {t('winners.management.selectModal.bid')}
        </label>
        <select
          id="select-winner-bid"
          className="input-field__control"
          value={bidId}
          onChange={(event) => setBidId(event.target.value)}
          disabled={loading || !auctionId}
        >
          <option value="">{t('winners.management.selectModal.selectBid')}</option>
          {bids.map((bid) => (
            <option key={bid.id} value={bid.id}>
              {bid.bidderName} —{' '}
              {canViewAmounts ? formatEtbAmount(bid.amount) : t('winners.management.amount.restricted')}
            </option>
          ))}
        </select>

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
            {loading
              ? t('winners.management.selectModal.submitting')
              : t('winners.management.selectModal.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SelectWinnerModal;
