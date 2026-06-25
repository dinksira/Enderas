import { useTranslation } from 'react-i18next';
import { PlaceBidForm } from './PlaceBidForm.jsx';
import { formatEtbAmount } from '../utils/auction-drawer-utils.js';

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

/**
 * Prominent bid entry — shown when CPO is approved so bidders can find it easily.
 * @param {{
 *   auction?: object|null,
 *   auctionId?: string|null,
 *   participation?: object|null,
 *   canPlaceBid?: boolean,
 *   onSuccess?: () => void,
 * }} props
 */
export function AuctionBidSection({
  auction,
  auctionId,
  participation,
  canPlaceBid = false,
  onSuccess,
}) {
  const { t } = useTranslation();

  if (!auctionId || !participation?.flags?.cpoApproved || participation?.flags?.hasBid) {
    return null;
  }

  const startLabel = auction?.startDateFormatted || auction?.startingDate || '—';
  const endLabel = auction?.endDateFormatted || auction?.endingDate || '—';
  const reserve = auction?.reservePrice ?? auction?.reserve;
  const windowStatus = resolveWindowStatus(participation, auction);

  const titleKey =
    windowStatus === 'open'
      ? 'bidder.participation.bidCard.titleOpen'
      : windowStatus === 'after'
        ? 'bidder.participation.bidCard.titleClosed'
        : 'bidder.participation.bidCard.titleWaiting';

  const leadKey =
    windowStatus === 'open'
      ? 'bidder.participation.bidCard.leadOpen'
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
            ? t(leadKey, { amount: formatEtbAmount(reserve) })
            : t(leadKey, { start: startLabel, end: endLabel })}
        </p>
      </header>

      {canPlaceBid ? (
        <PlaceBidForm auctionId={auctionId} reservePrice={reserve} onSuccess={onSuccess} />
      ) : (
        <p className="auction-bid-card__waiting" role="status">
          {t(hintKey, { start: startLabel, end: endLabel })}
        </p>
      )}
    </section>
  );
}

export default AuctionBidSection;
