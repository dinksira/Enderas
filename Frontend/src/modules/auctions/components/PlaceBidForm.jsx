import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { bidDraftService } from '../services/bid-draft-service.js';
import { formatEtbAmount } from '@enderass/shared/utils';
import {
  computeCpoFromBidAmount,
  computeMinimumBidFromReserve,
} from '../utils/auction-lot-utils.js';

/**
 * @param {{
 *   auctionId: string,
 *   auctionAssetId?: string|null,
 *   lotLabel?: string|null,
 *   reservePrice?: number|null,
 *   cpoPercentage?: number|null,
 *   onSuccess?: () => void,
 * }} props
 */
export function PlaceBidForm({
  auctionId,
  auctionAssetId = null,
  lotLabel = null,
  reservePrice,
  cpoPercentage = null,
  onSuccess,
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reserve = Number(reservePrice);
  const cpoRate = Number(cpoPercentage);
  const hasReserve = Number.isFinite(reserve) && reserve > 0;
  const hasCpoRate = Number.isFinite(cpoRate) && cpoRate > 0;
  const minimumBid = hasReserve ? computeMinimumBidFromReserve(reserve, cpoRate) : 0;

  const enteredAmount = Number(amount);
  const cpoForEntered = useMemo(() => {
    if (!Number.isFinite(enteredAmount) || enteredAmount <= 0 || !hasCpoRate) {
      return 0;
    }
    return computeCpoFromBidAmount(enteredAmount, cpoRate);
  }, [enteredAmount, cpoRate, hasCpoRate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const bidAmount = Number(amount);
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      setError(t('bidder.browse.placeBid.amountRequired'));
      return;
    }
    if (minimumBid > 0 && bidAmount < minimumBid) {
      setError(t('bidder.browse.placeBid.belowMinimum', {
        amount: formatEtbAmount(minimumBid),
        percentage: hasCpoRate ? cpoRate : 0,
        reserve: hasReserve ? formatEtbAmount(reserve) : '—',
      }));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await bidDraftService.saveDraft({
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

      {(hasReserve || hasCpoRate) && (
        <dl className="place-bid-pricing">
          {hasReserve && (
            <>
              <dt>{t('bidder.browse.placeBid.reservePrice')}</dt>
              <dd>{formatEtbAmount(reserve)}</dd>
            </>
          )}
          {hasCpoRate && (
            <>
              <dt>{t('bidder.browse.placeBid.cpoPercentage')}</dt>
              <dd>{cpoRate}%</dd>
            </>
          )}
          {minimumBid > 0 && (
            <>
              <dt>{t('bidder.browse.placeBid.minimumBid')}</dt>
              <dd className="place-bid-pricing__highlight">{formatEtbAmount(minimumBid)}</dd>
            </>
          )}
        </dl>
      )}

      <p className="auction-drawer__hint">
        {minimumBid > 0
          ? t('bidder.browse.placeBid.hintWithCpo', {
              reserve: hasReserve ? formatEtbAmount(reserve) : '—',
              percentage: hasCpoRate ? cpoRate : 0,
              minimumBid: formatEtbAmount(minimumBid),
            })
          : t('bidder.browse.placeBid.hint')}
      </p>

      <label className="kyc-modal__label" htmlFor={`place-bid-amount-${auctionAssetId || 'single'}`}>
        {t('bidder.browse.placeBid.amountLabel')}
      </label>
      <input
        id={`place-bid-amount-${auctionAssetId || 'single'}`}
        type="number"
        min={minimumBid > 0 ? minimumBid : 1}
        step="1"
        className="input-field__control"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        disabled={loading}
        placeholder={minimumBid > 0 ? String(minimumBid) : undefined}
      />

      {hasCpoRate && Number.isFinite(enteredAmount) && enteredAmount > 0 && (
        <p className="place-bid-pricing__live" role="status">
          {t('bidder.browse.placeBid.cpoForYourBid', {
            amount: formatEtbAmount(cpoForEntered),
            percentage: cpoRate,
          })}
        </p>
      )}

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
