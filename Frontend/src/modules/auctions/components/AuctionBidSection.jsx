import { useTranslation } from 'react-i18next';
import { PlaceBidForm } from './PlaceBidForm.jsx';
import { formatEtbAmount } from '@enderass/shared/utils';

function resolveWindowStatus(participation, auction) {
  const fromApi = participation?.gates?.biddingWindowStatus;
  if (fromApi === 'before' || fromApi === 'open' || fromApi === 'after') {
    return fromApi;
  }

  const start = auction?.startDate ? new Date(auction.startDate) : null;
  const end = auction?.endDate ? new Date(auction.endDate) : null;
  if (!start || !end) return 'unknown';

  const now = new Date();
  if (now < start) return 'before';
  if (now > end) return 'after';
  return 'open';
}

function getBidLots(participation, auction) {
  const lotParticipation = participation?.lotParticipation;
  if (Array.isArray(lotParticipation) && lotParticipation.length > 0) {
    return lotParticipation.filter((lot) => lot.selected);
  }

  if (auction?.lots?.length === 1) {
    return auction.lots;
  }

  return [];
}

/**
 * Prominent bid entry — shown after payment approval so bidders can save bid amounts before CPO upload.
 * @param {{
 *   auction?: object|null,
 *   auctionId?: string|null,
 *   participation?: object|null,
 *   onSuccess?: () => void,
 * }} props
 */
export function AuctionBidSection({
  auction,
  auctionId,
  participation,
  onSuccess,
}) {
  const { t } = useTranslation();

  const allBidsSubmitted = Boolean(participation?.flags?.allBidsSubmitted);
  const canEditBidDrafts = Boolean(participation?.gates?.canEditBidDrafts);
  const hasBidDrafts = Array.isArray(participation?.bidDrafts) && participation.bidDrafts.length > 0;
  if (!auctionId || (!canEditBidDrafts && !hasBidDrafts) || allBidsSubmitted) {
    return null;
  }

  const startLabel = auction?.startDateFormatted || auction?.startingDate || '—';
  const endLabel = auction?.endDateFormatted || auction?.endingDate || '—';
  const windowStatus = resolveWindowStatus(participation, auction);
  const bidLots = getBidLots(participation, auction);
  const isMultiLot = bidLots.length > 1;
  const pendingLots = bidLots.filter((lot) => !lot.bid && lot.canPlaceBid);
  const submittedLots = bidLots.filter((lot) => lot.bid);

  const titleKey =
    windowStatus === 'open'
      ? (isMultiLot ? 'bidder.participation.bidCard.titleDraftMulti' : 'bidder.participation.bidCard.titleDraft')
      : windowStatus === 'after'
        ? 'bidder.participation.bidCard.titleClosed'
        : 'bidder.participation.bidCard.titleWaiting';

  const leadKey =
    windowStatus === 'open'
      ? (isMultiLot ? 'bidder.participation.bidCard.leadDraftMulti' : 'bidder.participation.bidCard.leadDraft')
      : windowStatus === 'after'
        ? 'bidder.participation.bidCard.leadClosed'
        : 'bidder.participation.bidCard.leadWaiting';

  const hintKey =
    windowStatus === 'after'
      ? 'bidder.participation.bidCard.closedHint'
      : 'bidder.participation.bidCard.waitingHint';

  return (
    <section className="auction-bid-card" aria-labelledby="auction-bid-card-title">
      <header className="auction-bid-card__header">
        <p className="auction-bid-card__eyebrow">{t('bidder.participation.bidCard.eyebrow')}</p>
        <h4 id="auction-bid-card-title" className="auction-bid-card__title">
          {t(titleKey)}
        </h4>
        <p className="auction-bid-card__lead">
          {windowStatus === 'open'
            ? (isMultiLot
              ? t(leadKey, { count: pendingLots.length })
              : t(leadKey))
            : t(leadKey, { start: startLabel, end: endLabel })}
        </p>
      </header>

      {submittedLots.length > 0 && (
        <ul className="auction-bid-card__submitted" role="status">
          {submittedLots.map((lot) => (
            <li key={lot.id}>
              {t('bidder.participation.bidCard.lotBidSubmitted', {
                lot: lot.lotLabel || lot.assetTitle,
                amount: formatEtbAmount(lot.bid.amount),
              })}
            </li>
          ))}
        </ul>
      )}

      {canEditBidDrafts && pendingLots.length > 0 ? (
        <div className="auction-bid-card__forms">
          {pendingLots.map((lot) => (
            <PlaceBidForm
              key={lot.id}
              auctionId={auctionId}
              auctionAssetId={lot.id}
              lotLabel={lot.lotLabel || lot.assetTitle}
              reservePrice={lot.reservePrice}
              onSuccess={onSuccess}
            />
          ))}
        </div>
      ) : canEditBidDrafts && !isMultiLot ? (
        <PlaceBidForm
          auctionId={auctionId}
          reservePrice={auction?.reservePrice ?? auction?.reserve}
          onSuccess={onSuccess}
        />
      ) : (
        <p className="auction-bid-card__waiting" role="status">
          {t(hintKey, { start: startLabel, end: endLabel })}
        </p>
      )}
    </section>
  );
}

export default AuctionBidSection;
