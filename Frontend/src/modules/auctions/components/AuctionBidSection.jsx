import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlaceBidForm } from './PlaceBidForm.jsx';
import { AuctionLotsPanel } from './AuctionLotsPanel.jsx';
import { formatEtbAmount } from '@enderass/shared/utils';
import { isMultiLotAuction } from '../utils/auction-lot-utils.js';

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

function getCpoPercentage(auction) {
  return Number(auction?.cpoPercentage ?? auction?.cpo_percentage ?? 0) || null;
}

function getBidLots(participation, auction) {
  const lots = auction?.lots || [];
  const canEditBidDrafts = Boolean(participation?.gates?.canEditBidDrafts);

  if (canEditBidDrafts && lots.length > 0) {
    const draftByLotId = new Map(
      (participation?.bidDrafts || [])
        .filter((draft) => draft.auctionAssetId)
        .map((draft) => [draft.auctionAssetId, draft]),
    );

    return lots.map((lot) => ({
      ...lot,
      draft: draftByLotId.get(lot.id) || null,
    }));
  }

  const lotParticipation = participation?.lotParticipation;
  if (Array.isArray(lotParticipation) && lotParticipation.length > 0) {
    return lotParticipation.filter((lot) => lot.selected);
  }

  if (lots.length === 1) {
    return lots;
  }

  return [];
}

/**
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
  const [selectedLotIds, setSelectedLotIds] = useState([]);

  const allBidsSubmitted = Boolean(participation?.flags?.allBidsSubmitted);
  const canEditBidDrafts = Boolean(participation?.gates?.canEditBidDrafts);
  const hasBidDrafts = Array.isArray(participation?.bidDrafts) && participation.bidDrafts.length > 0;

  const draftLotIds = useMemo(
    () => (participation?.bidDrafts || [])
      .map((draft) => draft.auctionAssetId)
      .filter(Boolean),
    [participation?.bidDrafts],
  );

  useEffect(() => {
    if (!draftLotIds.length) {
      return;
    }
    setSelectedLotIds((current) => [...new Set([...current, ...draftLotIds])]);
  }, [draftLotIds]);

  const handleToggleLot = useCallback((lotId) => {
    if (draftLotIds.includes(lotId)) {
      return;
    }
    setSelectedLotIds((current) => (
      current.includes(lotId)
        ? current.filter((id) => id !== lotId)
        : [...current, lotId]
    ));
  }, [draftLotIds]);

  if (!auctionId || (!canEditBidDrafts && !hasBidDrafts) || allBidsSubmitted) {
    return null;
  }

  const cpoPercentage = getCpoPercentage(auction);
  const startLabel = auction?.startDateFormatted || auction?.startingDate || '—';
  const endLabel = auction?.endDateFormatted || auction?.endingDate || '—';
  const windowStatus = resolveWindowStatus(participation, auction);
  const bidLots = getBidLots(participation, auction);
  const isMultiLot = isMultiLotAuction({ ...auction, lots: bidLots });
  const catalogLots = auction?.lots?.length ? auction.lots : bidLots;
  const selectedSet = new Set(selectedLotIds);

  const submittedLots = bidLots.filter((lot) => lot.draft || lot.bid);
  const pendingLots = isMultiLot
    ? bidLots.filter(
        (lot) => selectedSet.has(lot.id) && !lot.draft && !lot.bid,
      )
    : bidLots.filter((lot) => !lot.draft && !lot.bid);

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

      {isMultiLot && catalogLots.length > 1 && (
        <AuctionLotsPanel
          auction={auction}
          lots={catalogLots}
          bidDrafts={participation?.bidDrafts}
          compact
          showSelectHint
          selectable
          selectedLotIds={selectedLotIds}
          onToggleLot={handleToggleLot}
        />
      )}

      {submittedLots.length > 0 && (
        <ul className="auction-bid-card__submitted" role="status">
          {submittedLots.map((lot) => (
            <li key={lot.id}>
              {t('bidder.participation.bidCard.lotBidSubmitted', {
                lot: lot.lotLabel || lot.assetTitle,
                amount: formatEtbAmount(lot.bid?.amount ?? lot.draft?.amount),
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
              reservePrice={lot.reservePrice ?? lot.reserve_price}
              cpoPercentage={cpoPercentage}
              onSuccess={onSuccess}
            />
          ))}
        </div>
      ) : canEditBidDrafts && isMultiLot && selectedLotIds.length === 0 ? (
        <p className="auction-bid-card__waiting" role="status">
          {t('bidder.browse.lots.selectToBid')}
        </p>
      ) : canEditBidDrafts && !isMultiLot ? (
        <PlaceBidForm
          auctionId={auctionId}
          reservePrice={auction?.reservePrice ?? auction?.reserve}
          cpoPercentage={cpoPercentage}
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
