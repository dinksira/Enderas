import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatEtbAmount } from '@enderass/shared/utils';
import {
  computeMinimumBidTotalForLots,
  computeRequiredCpoAmount,
  computeRequiredCpoFromBidAmounts,
  computeTotalReserveForLots,
  isMultiLotAuction,
} from '../utils/auction-lot-utils.js';

/**
 * @param {{
 *   auction?: object|null,
 *   lots?: Array<object>,
 *   bidDrafts?: Array<object>,
 *   compact?: boolean,
 *   showSelectHint?: boolean,
 *   selectable?: boolean,
 *   selectedLotIds?: string[],
 *   onToggleLot?: (lotId: string) => void,
 * }} props
 */
export function AuctionLotsPanel({
  auction,
  lots: lotsProp,
  bidDrafts = [],
  compact = false,
  showSelectHint = false,
  selectable = false,
  selectedLotIds = [],
  onToggleLot,
}) {
  const { t } = useTranslation();
  const lots = lotsProp ?? auction?.lots ?? [];
  const cpoPercentage = Number(auction?.cpoPercentage ?? auction?.cpo_percentage ?? 0);

  const draftByLotId = useMemo(
    () => new Map(
      (bidDrafts || [])
        .filter((draft) => draft.auctionAssetId)
        .map((draft) => [draft.auctionAssetId, draft]),
    ),
    [bidDrafts],
  );

  const selectedSet = useMemo(() => new Set(selectedLotIds), [selectedLotIds]);

  if (!lots.length) {
    return null;
  }

  const isMulti = isMultiLotAuction({ ...auction, lots });
  const allReserve = auction?.totalReservePrice != null
    ? Number(auction.totalReservePrice)
    : computeTotalReserveForLots(lots, lots.map((lot) => lot.id));

  const selectedReserveTotal = computeTotalReserveForLots(lots, selectedLotIds);
  const selectedMinimumBidTotal = computeMinimumBidTotalForLots(lots, selectedLotIds, cpoPercentage);

  const selectedDraftBids = (bidDrafts || []).filter(
    (draft) => draft.auctionAssetId && selectedSet.has(draft.auctionAssetId),
  );
  const cpoFromDrafts = computeRequiredCpoFromBidAmounts(selectedDraftBids, cpoPercentage);
  const cpoAtReserve = selectedLotIds.length > 0
    ? computeRequiredCpoAmount(lots, selectedLotIds, cpoPercentage)
    : 0;
  const cpoPreview = cpoFromDrafts > 0 ? cpoFromDrafts : cpoAtReserve;

  return (
    <section
      className={`bidder-detail__lots${compact ? ' bidder-detail__lots--compact' : ''}${selectable ? ' bidder-detail__lots--selectable' : ''}`}
      aria-label={t('bidder.browse.lots.title')}
    >
      <header className="bidder-detail__lots-header">
        <h3 className="bidder-detail__lots-title">
          {isMulti
            ? t('bidder.browse.lots.titleMulti', { count: lots.length })
            : t('bidder.browse.lots.title')}
        </h3>
        {isMulti && !selectable && allReserve > 0 && (
          <p className="bidder-detail__lots-summary">
            {t('bidder.browse.lots.totalReserve')}: <strong>{formatEtbAmount(allReserve)}</strong>
            {cpoPercentage > 0 && (
              <>
                {' · '}
                {t('bidder.browse.lots.cpoRate')}: <strong>{cpoPercentage}%</strong>
              </>
            )}
          </p>
        )}
        {showSelectHint && isMulti && selectable && (
          <p className="bidder-detail__lots-hint">
            {t('bidder.browse.lots.selectHintCheckable')}
          </p>
        )}
        {showSelectHint && isMulti && !selectable && (
          <p className="bidder-detail__lots-hint">
            {t('bidder.browse.lots.selectHint')}
          </p>
        )}
      </header>

      <ul
        className={`auction-create-modal__lot-list bidder-detail__lots-list${selectable ? ' bidder-detail__lots-list--selectable' : ''}`}
        role={selectable ? 'group' : undefined}
        aria-label={selectable ? t('bidder.browse.lots.selectGroup') : undefined}
      >
        {lots.map((lot, index) => {
          const draft = draftByLotId.get(lot.id);
          const label = lot.lotLabel || t('bidder.browse.lots.lotFallback', { index: index + 1 });
          const reserve = Number(lot.reservePrice ?? lot.reserve_price);
          const isSelected = selectedSet.has(lot.id);
          const isLocked = Boolean(draft);

          return (
            <li
              key={lot.id || lot.assetId || index}
              className={[
                'auction-create-modal__lot-item',
                selectable && isSelected ? 'bidder-detail__lot-item--selected' : '',
              ].filter(Boolean).join(' ')}
            >
              {selectable ? (
                <label className="bidder-detail__lot-option">
                  <input
                    type="checkbox"
                    className="bidder-detail__lot-checkbox"
                    checked={isSelected}
                    disabled={isLocked}
                    onChange={() => onToggleLot?.(lot.id)}
                  />
                  <span className="bidder-detail__lot-option-body">
                    <span className="auction-create-modal__lot-title">
                      {label}
                      {lot.assetTitle ? ` — ${lot.assetTitle}` : ''}
                    </span>
                    <span className="auction-create-modal__lot-meta">
                      {Number.isFinite(reserve) && reserve > 0 && (
                        <>
                          {t('bidder.browse.lots.lotReserve')}: {formatEtbAmount(reserve)}
                        </>
                      )}
                      {lot.assetLocation ? ` · ${lot.assetLocation}` : ''}
                    </span>
                    {draft && (
                      <span className="bidder-detail__lot-status bidder-detail__lot-status--saved">
                        {t('bidder.browse.lots.bidSaved', {
                          amount: formatEtbAmount(draft.amount),
                        })}
                      </span>
                    )}
                  </span>
                </label>
              ) : (
                <div className="bidder-detail__lot-row">
                  <div>
                    <p className="auction-create-modal__lot-title">
                      {label}
                      {lot.assetTitle ? ` — ${lot.assetTitle}` : ''}
                    </p>
                    <p className="auction-create-modal__lot-meta">
                      {Number.isFinite(reserve) && reserve > 0 && (
                        <>
                          {t('bidder.browse.lots.lotReserve')}: {formatEtbAmount(reserve)}
                        </>
                      )}
                      {lot.assetLocation ? ` · ${lot.assetLocation}` : ''}
                    </p>
                  </div>
                  {draft && (
                    <span className="bidder-detail__lot-status bidder-detail__lot-status--saved">
                      {t('bidder.browse.lots.bidSaved', {
                        amount: formatEtbAmount(draft.amount),
                      })}
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {selectable && selectedLotIds.length > 0 && (
        <footer className="bidder-detail__lots-totals" aria-live="polite">
          <p className="bidder-detail__lots-totals-line">
            {t('bidder.browse.lots.selectedCount', { count: selectedLotIds.length })}
          </p>
          <p className="bidder-detail__lots-totals-line">
            {t('bidder.browse.lots.selectedTotalReserve', {
              amount: formatEtbAmount(selectedReserveTotal),
            })}
          </p>
          {cpoPercentage > 0 && (
            <>
              <p className="bidder-detail__lots-totals-line">
                {t('bidder.browse.lots.selectedMinimumBid', {
                  amount: formatEtbAmount(selectedMinimumBidTotal),
                  percentage: cpoPercentage,
                })}
              </p>
              <p className="bidder-detail__lots-totals-line bidder-detail__lots-totals-line--highlight">
                {cpoFromDrafts > 0
                  ? t('bidder.browse.lots.selectedCpoFromBids', {
                      amount: formatEtbAmount(cpoPreview),
                      percentage: cpoPercentage,
                    })
                  : t('bidder.browse.lots.selectedCpoAtReserve', {
                      amount: formatEtbAmount(cpoPreview),
                      percentage: cpoPercentage,
                    })}
              </p>
            </>
          )}
        </footer>
      )}

      {selectable && selectedLotIds.length === 0 && (
        <p className="bidder-detail__lots-empty-selection" role="status">
          {t('bidder.browse.lots.noneSelected')}
        </p>
      )}
    </section>
  );
}

export default AuctionLotsPanel;
