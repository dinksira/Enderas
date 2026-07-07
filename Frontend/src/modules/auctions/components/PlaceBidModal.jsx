import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalCloseButton } from '@enderass/shared/ui';
import { bidService } from '@enderass/shared/services';
import { formatEtbAmount } from '@enderass/shared/utils';
import {
  computeBidCoveragePercent,
  computeCpoFromBidAndReserve,
  computeMinimumBidFromReserve,
} from '../utils/auction-lot-utils.js';

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   auctionId: string,
 *   auctionAssetId?: string|null,
 *   lotLabel?: string|null,
 *   reservePrice?: number|null,
 *   cpoPercentage?: number|null,
 *   onSuccess?: () => void,
 * }} props
 */
export function PlaceBidModal({
  open,
  onClose,
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
  const minimumBid = hasReserve ? computeMinimumBidFromReserve(reserve) : 0;

  const enteredAmount = Number(amount);
  const coveragePercent = useMemo(() => {
    if (!hasReserve || !Number.isFinite(enteredAmount) || enteredAmount <= 0) {
      return 0;
    }
    return computeBidCoveragePercent(enteredAmount, reserve);
  }, [enteredAmount, hasReserve, reserve]);

  const cpoForEntered = useMemo(() => {
    if (!hasReserve || !Number.isFinite(enteredAmount) || enteredAmount <= 0 || !hasCpoRate) {
      return 0;
    }
    return computeCpoFromBidAndReserve(enteredAmount, reserve, cpoRate);
  }, [enteredAmount, cpoRate, hasCpoRate, hasReserve, reserve]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const bidAmount = Number(amount);
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      setError(t('bidder.browse.placeBid.amountRequired', 'Please enter a valid amount'));
      return;
    }
    if (minimumBid > 0 && bidAmount < minimumBid) {
      setError(t('bidder.browse.placeBid.belowMinimum', {
        amount: formatEtbAmount(minimumBid),
        reserve: hasReserve ? formatEtbAmount(reserve) : '—',
      }));
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
      setSuccess(t('bidder.browse.placeBid.success', 'Your bid has been placed successfully!'));
      setAmount('');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidder.browse.placeBid.failed', 'Failed to place bid'));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="kyc-modal-overlay" role="presentation" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="kyc-modal place-bid-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="place-bid-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 500 }}
      >
        <ModalCloseButton onClick={onClose} />
        
        <form className="auction-drawer__bid-form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <h2 id="place-bid-modal-title" className="kyc-modal__title" style={{ marginBottom: 24 }}>
            {lotLabel
              ? t('bidder.browse.placeBid.titleForLot', 'Place Bid for {{lot}}', { lot: lotLabel })
              : t('bidder.browse.placeBid.title', 'Place Bid')}
          </h2>

          {(hasReserve || hasCpoRate) && (
            <dl className="place-bid-pricing" style={{ background: '#f5f7fa', padding: '16px', borderRadius: '8px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <dt style={{ color: '#666', margin: 0 }}>{t('bidder.browse.placeBid.reservePrice', 'Reserve Price')}</dt>
                <dd style={{ fontWeight: 600, margin: 0 }}>{hasReserve ? formatEtbAmount(reserve) : '—'}</dd>
              </div>
              {hasCpoRate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <dt style={{ color: '#666', margin: 0 }}>{t('bidder.browse.placeBid.auctionCpoRate', 'CPO Rate')}</dt>
                  <dd style={{ fontWeight: 600, margin: 0 }}>{cpoRate}%</dd>
                </div>
              )}
              {minimumBid > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e0e0e0', paddingTop: 8, marginTop: 8 }}>
                  <dt style={{ color: '#2e7d32', fontWeight: 600, margin: 0 }}>
                    {t('bidder.browse.placeBid.minimumBid', 'Minimum Bid Allowed')}
                  </dt>
                  <dd className="place-bid-pricing__highlight" style={{ color: '#2e7d32', fontWeight: 700, margin: 0 }}>
                    {formatEtbAmount(minimumBid)}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <p className="auction-drawer__hint" style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
            {hasReserve && hasCpoRate
              ? t('bidder.browse.placeBid.hintWithCpo', 'You must bid at least the minimum allowed based on the reserve price. Your CPO deposit covers bids up to a calculated maximum.', {
                  reserve: formatEtbAmount(reserve),
                  percentage: cpoRate,
                  minimumBid: formatEtbAmount(minimumBid),
                })
              : t('bidder.browse.placeBid.hint', 'Enter your incremental bid amount.')}
          </p>

          <div style={{ marginBottom: 24 }}>
            <label className="kyc-modal__label" htmlFor={`place-bid-amount-${auctionAssetId || 'single'}`} style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              {t('bidder.browse.placeBid.amountLabel', 'Your Bid Amount (ETB)')}
            </label>
            <input
              id={`place-bid-amount-${auctionAssetId || 'single'}`}
              type="number"
              min={minimumBid > 0 ? minimumBid : 1}
              step="1"
              className="input-field__control"
              style={{ width: '100%', fontSize: 16, padding: 12 }}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={loading || Boolean(success)}
              placeholder={minimumBid > 0 ? String(minimumBid) : undefined}
            />
          </div>

          {hasReserve && Number.isFinite(enteredAmount) && enteredAmount > 0 && (
            <p className="place-bid-pricing__live" role="status" style={{ fontSize: 13, color: '#444' }}>
              {t('bidder.browse.placeBid.cpoCoveragePercent', 'This bid is {{percentage}}% of the reserve price.', {
                percentage: coveragePercent,
              })}
            </p>
          )}

          {hasCpoRate && Number.isFinite(enteredAmount) && enteredAmount > 0 && cpoForEntered > 0 && (
            <p className="place-bid-pricing__live" role="status" style={{ fontSize: 13, color: '#444', marginBottom: 16 }}>
              {t('bidder.browse.placeBid.cpoForYourBid', 'Required CPO for this bid: {{amount}}', {
                amount: formatEtbAmount(cpoForEntered),
                coverage: coveragePercent,
              })}
            </p>
          )}

          {error && (
            <p className="kyc-modal__error" role="alert" style={{ color: '#d32f2f', background: '#ffebee', padding: 12, borderRadius: 4, marginBottom: 16 }}>
              {error}
            </p>
          )}
          {success && (
            <p className="auction-drawer__success" role="status" style={{ color: '#2e7d32', background: '#e8f5e9', padding: 12, borderRadius: 4, marginBottom: 16, fontWeight: 500 }}>
              {success}
            </p>
          )}

          <div className="kyc-modal__actions" style={{ justifyContent: 'flex-end', marginTop: 32 }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading || Boolean(success)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={loading || Boolean(success)}>
              {loading ? t('bidder.browse.placeBid.submitting', 'Submitting...') : t('bidder.browse.placeBid.submit', 'Place Bid')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlaceBidModal;
