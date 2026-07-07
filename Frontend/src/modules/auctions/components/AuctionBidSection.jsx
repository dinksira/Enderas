import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuctionLotsPanel } from './AuctionLotsPanel.jsx';
import { Button } from '@enderass/shared/ui';
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
  onSubmitCpo,
}) {
  const { t } = useTranslation();
  const [selectedLotIds, setSelectedLotIds] = useState([]);

  const allBidsSubmitted = Boolean(participation?.flags?.allBidsSubmitted);
  const canEditBidDrafts = Boolean(participation?.gates?.canEditBidDrafts);
  const hasBidDrafts = Array.isArray(participation?.bidDrafts) && participation.bidDrafts.length > 0;
  const [draftLotIds, setDraftLotIds] = useState([]);
  const [draftBidAmounts, setDraftBidAmounts] = useState({});

  useEffect(() => {
    if (!participation?.bidDrafts?.length) {
      setDraftLotIds([]);
      return;
    }
    const ids = participation.bidDrafts.map((d) => d.auctionAssetId).filter(Boolean);
    setDraftLotIds(ids);
  }, [participation?.bidDrafts]);

  useEffect(() => {
    if (draftLotIds.length > 0) {
      setSelectedLotIds((current) => {
        const toAdd = draftLotIds.filter((id) => !current.includes(id));
        if (toAdd.length === 0) return current;
        return [...current, ...toAdd];
      });
    }
  }, [draftLotIds]);

  const handleToggleLot = useCallback((lotId) => {
    if (draftLotIds.includes(lotId)) {
      return;
    }
    setSelectedLotIds((current) => {
      const isSelected = current.includes(lotId);
      if (isSelected) {
        setDraftBidAmounts(prev => {
          const next = { ...prev };
          delete next[lotId];
          return next;
        });
        return current.filter((id) => id !== lotId);
      }
      return [...current, lotId];
    });
  }, [draftLotIds]);

  const handleBidAmountChange = useCallback((lotId, amount) => {
    setDraftBidAmounts(prev => ({ ...prev, [lotId]: amount }));
  }, []);

  if (!auctionId || (!canEditBidDrafts && !hasBidDrafts) || allBidsSubmitted) {
    return null;
  }

  const startLabel = auction?.startDateFormatted || auction?.startingDate || '—';
  const endLabel = auction?.endDateFormatted || auction?.endingDate || '—';
  const windowStatus = resolveWindowStatus(participation, auction);
  const bidLots = getBidLots(participation, auction);
  const isMultiLot = isMultiLotAuction({ ...auction, lots: bidLots });
  const catalogLots = auction?.lots?.length ? auction.lots : bidLots;

  const submittedLots = bidLots.filter((lot) => lot.draft || lot.bid);
  const pendingLots = isMultiLot
    ? bidLots.filter(
        (lot) => selectedLotIds.includes(lot.id) && !lot.draft && !lot.bid,
      )
    : bidLots.filter((lot) => !lot.draft && !lot.bid);

  const hintKey =
    windowStatus === 'after'
      ? 'bidder.participation.bidCard.closedHint'
      : 'bidder.participation.bidCard.waitingHint';

  const isAnyBidInvalid = useMemo(() => {
    if (!selectedLotIds.length && isMultiLot) return true;
    
    const allAssets = [];
    catalogLots.forEach(lot => {
      if (lot.assets && lot.assets.length > 0) {
        allAssets.push(...lot.assets);
      } else {
        allAssets.push(lot);
      }
    });

    const idsToCheck = isMultiLot ? selectedLotIds : allAssets.map(a => a.id ?? a.assetId ?? a.auctionAssetId);

    return idsToCheck.some(id => {
      const amount = draftBidAmounts[id];
      if (!amount) return true;
      
      const asset = allAssets.find(a => (a.id ?? a.assetId ?? a.auctionAssetId) === id);
      if (!asset) return false;

      const reserve = Number(asset.reservePrice ?? asset.reserve_price ?? 0);
      return Number(amount) < reserve;
    });
  }, [selectedLotIds, draftBidAmounts, isMultiLot, catalogLots]);

  const isSubmitDisabled = isAnyBidInvalid;

  return (
    <section className="auction-bid-card" aria-labelledby="auction-bid-card-title">
      <div className="auction-bid-card__content">
        {submittedLots.length > 0 && (
          <div className="auction-bid-card__submitted-list">
            <h4 className="auction-bid-card__submitted-title">
              {t('bidder.participation.bidCard.submittedTitle')}
            </h4>
            <ul className="auction-bid-card__submitted-items">
              {submittedLots.map((lot, idx) => (
                <li key={lot.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    {lot.lotTitle || lot.title || lot.lotLabel || `${t('bidder.browse.lots.lotFallback')} ${idx + 1}`}
                  </span>
                  {lot.bid && (
                    <span className="auction-bid-card__tag auction-bid-card__tag--bid" style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                      {t('bidder.participation.bidCard.statusBid')}
                    </span>
                  )}
                  {lot.draft && !lot.bid && (
                    <span className="auction-bid-card__tag auction-bid-card__tag--draft" style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                      {t('bidder.participation.bidCard.statusDraft')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <AuctionLotsPanel
        auction={auction}
        lots={catalogLots}
        bidDrafts={participation?.bidDrafts}
        selectable={canEditBidDrafts && isMultiLot}
        selectedLotIds={selectedLotIds}
        onToggleLot={handleToggleLot}
        draftBidAmounts={draftBidAmounts}
        onBidAmountChange={canEditBidDrafts ? handleBidAmountChange : undefined}
      />

      {canEditBidDrafts && (isMultiLot ? selectedLotIds.length > 0 : true) ? (
        <div className="auction-bid-card__forms" style={{ marginTop: 16 }}>
          {!isAnyBidInvalid && (
            <Button variant="primary" onClick={() => onSubmitCpo?.({ selectedLotIds, draftBidAmounts })} disabled={isSubmitDisabled}>
               {t('bidder.participation.actions.submitCpo', 'Enter Bids & Submit CPO')}
            </Button>
          )}
        </div>
      ) : canEditBidDrafts && isMultiLot && selectedLotIds.length === 0 ? (
        <p className="auction-bid-card__waiting" role="status">
          {t('bidder.browse.lots.selectToBid')}
        </p>
      ) : !canEditBidDrafts ? (
        <p className="auction-bid-card__waiting" role="status">
          {t(hintKey, { start: startLabel, end: endLabel })}
        </p>
      ) : null}
    </section>
  );
}

export default AuctionBidSection;
