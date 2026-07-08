import { useTranslation } from 'react-i18next';
import { LiveCountdown } from '@enderass/shared/ui';
import { normalizeAuctionStatus, formatEtbAmount } from '@enderass/shared/utils';
import { isMultiLotAuction } from '../utils/auction-lot-utils.js';
import { StatusPill } from '@enderass/shared/ui-admin';
import { AuctionCardMedia } from '../../public/components/AuctionCardMedia.jsx';
import {
  getParticipationStatusVariant,
  resolveParticipationStatus,
} from '../utils/participation-utils.js';

function getCardParticipationLabel(status, t) {
  if (status === 'not_started') {
    return t('bidder.browse.participation.not_registered');
  }

  return t(`bidder.participation.status.${status}.label`, {
    defaultValue: status,
  });
}

/**
 * @param {{
 *   auction: object,
 *   onOpen: (id: string) => void,
 *   disabled?: boolean,
 * }} props
 */
export function BrowseAuctionCard({ auction, onOpen, disabled = false }) {
  const { t } = useTranslation();
  const displayStatus = normalizeAuctionStatus(auction.status);
  const myStatus = resolveParticipationStatus(auction.myParticipation);
  const myStatusVariant = getParticipationStatusVariant(myStatus);
  const categoryKey = auction.categoryKey || auction.category || 'other_assets';
  const endingLabel = auction.endingDate || auction.endDateFormatted || '—';
  const isActive = displayStatus === 'ACTIVE';
  const isMultiLot = isMultiLotAuction(auction);
  const lotCount = Number(auction.lotCount) || (auction.lots?.length ?? 0);
  const totalReserve = auction.totalReservePrice ?? auction.reservePrice;

  function handleOpen() {
    if (!disabled && onOpen) {
      onOpen(auction.id);
    }
  }

  function handleKeyDown(event) {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled && onOpen) {
      event.preventDefault();
      handleOpen();
    }
  }

  return (
    <article
      className={`browse-auction-card${disabled ? ' browse-auction-card--disabled' : ''}`}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role={disabled ? undefined : 'button'}
      aria-disabled={disabled}
      aria-label={disabled ? t('kyc.completeKycToViewDetails') : t('bidder.browse.openDetail', { title: auction.title })}
    >
      <AuctionCardMedia
        auction={auction}
        className="browse-auction-card__media"
        imageClassName="browse-auction-card__image"
        tag={(
          <span className="browse-auction-card__category">
            {t(`public.categories.${categoryKey}`, { defaultValue: categoryKey })}
          </span>
        )}
      />

      <div className="browse-auction-card__body">
        <div className="browse-auction-card__header">
          {typeof auction.bidCount === 'number' && (
            <span className="browse-auction-card__bids">
              {t('public.auctions.bidCount', { count: auction.bidCount })}
            </span>
          )}
        </div>

        <h3 className="browse-auction-card__title">{auction.title}</h3>

        {(isMultiLot || lotCount > 1) && (
          <p className="browse-auction-card__lots-meta">
            {t('bidder.browse.lots.lotCountValue', { count: lotCount || auction.lots?.length || 2 })}
            {totalReserve > 0 && (
              <>
                {' · '}
                {t('bidder.browse.lots.totalReserve')}: {formatEtbAmount(totalReserve)}
              </>
            )}
          </p>
        )}

        <div className="browse-auction-card__metrics browse-auction-card__metrics--single">
          <div className="browse-auction-card__metric">
            <span className="browse-auction-card__metric-label">
              {t('dashboard.table.headers.ending_date')}
            </span>
            <span className="browse-auction-card__metric-value">{endingLabel}</span>
          </div>
        </div>

        {isActive && auction.endDate && (
          <div className="browse-auction-card__countdown">
            <LiveCountdown
              endDate={auction.endDate}
              className="browse-auction-card__countdown-value"
            />
          </div>
        )}

        <div className="browse-auction-card__footer">
          <div className="browse-auction-card__participation">
            <span className="browse-auction-card__participation-label">
              {t('bidder.browse.myStatus')}
            </span>
            <StatusPill
              label={getCardParticipationLabel(myStatus, t)}
              variant={myStatusVariant}
            />
          </div>
          <span className="browse-auction-card__cta">
            {disabled ? t('kyc.completeKycToViewDetails') : t('bidder.browse.view')}
            {!disabled && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

export function BrowseAuctionCardSkeleton() {
  return (
    <div className="browse-auction-card browse-auction-card--skeleton" aria-hidden="true">
      <div className="browse-auction-card__media browse-auction-card__media--skeleton" />
      <div className="browse-auction-card__body">
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--short" />
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--title" />
        <div className="browse-auction-card__skeleton-line" />
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--cta" />
      </div>
    </div>
  );
}

export default BrowseAuctionCard;
