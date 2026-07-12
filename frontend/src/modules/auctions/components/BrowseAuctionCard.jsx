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

  if (status === 'own_asset') {
    return t('bidder.participation.status.own_asset.label', { defaultValue: 'Your auction' });
  }

  return t(`bidder.participation.status.${status}.label`, {
    defaultValue: status,
  });
}

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
  const hasBids = typeof auction.bidCount === 'number';

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
        tag={
          <>
            <span className="browse-auction-card__category">
              {t(`public.categories.${categoryKey}`, { defaultValue: categoryKey })}
            </span>
            {hasBids && (
              <span className="browse-auction-card__bids">
                {t('public.auctions.bidCount', { count: auction.bidCount })}
              </span>
            )}
          </>
        }
      />

      <div className="browse-auction-card__body">
        <div className="browse-auction-card__content">
          <h3 className="browse-auction-card__title">{auction.title}</h3>

          {(isMultiLot || lotCount > 1) && (
            <p className="browse-auction-card__lots-meta">
              {t('bidder.browse.lots.lotCountValue', { count: lotCount || auction.lots?.length || 2 })}
              {totalReserve > 0 && (
                <>
                  {' \u00B7 '}
                  {formatEtbAmount(totalReserve)}
                </>
              )}
            </p>
          )}
        </div>

        <div className="browse-auction-card__timing">
          <div className="browse-auction-card__timing-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="browse-auction-card__timing-value">{endingLabel}</span>
          </div>
          {isActive && auction.endDate && (
            <div className="browse-auction-card__timing-row browse-auction-card__timing-row--countdown">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <LiveCountdown
                endDate={auction.endDate}
                className="browse-auction-card__countdown-value"
              />
            </div>
          )}
        </div>

        <div className="browse-auction-card__footer">
          <div className="browse-auction-card__participant">
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
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--title" />
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--short" />
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--timing" />
        <div className="browse-auction-card__skeleton-line browse-auction-card__skeleton-line--cta" />
      </div>
    </div>
  );
}

export default BrowseAuctionCard;
