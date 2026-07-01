import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { bidService } from '../../bid-management/services/bid-service.js';
import { formatEtbAmount } from '@enderass/shared/utils';

/**
 * @param {{
 *   auctionId: string,
 *   auctionAssetId?: string|null,
 *   lotLabel?: string|null,
 *   reservePrice?: number|null,
 *   onSuccess?: () => void,
 * }} props
 */
export function PlaceBidForm({
  auctionId,
  auctionAssetId = null,
  lotLabel = null,
  reservePrice,
  onSuccess,
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const bidAmount = Number(amount);
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      setError(t('bidder.browse.placeBid.amountRequired'));
      return;
    }
    if (reservePrice != null && bidAmount < reservePrice) {
      setError(t('bidder.browse.placeBid.belowReserve', { amount: formatEtbAmount(reservePrice) }));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await bidService.placeBid({
        auctionId,
        amount: bidAmount,
        auctionAssetId: auctionAssetId || undefined,
      });
      setSuccess(t('bidder.browse.placeBid.success'));
      setAmount('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidder.browse.placeBid.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auction-drawer__bid-form" onSubmit={handleSubmit}>
      <h3>
        {lotLabel
          ? t('bidder.browse.placeBid.titleForLot', { lot: lotLabel })
          : t('bidder.browse.placeBid.title')}
      </h3>
      <p className="auction-drawer__hint">{t('bidder.browse.placeBid.hint')}</p>

      <label className="kyc-modal__label" htmlFor={`place-bid-amount-${auctionAssetId || 'single'}`}>
        {t('bidder.browse.placeBid.amountLabel')}
      </label>
      <input
        id={`place-bid-amount-${auctionAssetId || 'single'}`}
        type="number"
        min="1"
        className="input-field__control"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        disabled={loading}
        placeholder={
          reservePrice != null
            ? t('bidder.browse.placeBid.minAmount', { amount: formatEtbAmount(reservePrice) })
            : undefined
        }
      />

      {error && (
        <p className="kyc-modal__error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="auction-drawer__success" role="status">
          {success}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? t('bidder.browse.placeBid.submitting') : t('bidder.browse.placeBid.submit')}
      </Button>
    </form>
  );
}

export default PlaceBidForm;
