import { flattenAuctionAssets } from '@/lib/normalizeBrowseAuction';
import type { AuctionAssetApi, AuctionLotApi, AuctionParticipationApi } from '@/types/auctionApi';

export type LotParticipationRowStatus =
  | 'bid_submitted'
  | 'proposed_under_review'
  | 'awaiting_live_bid'
  | 'not_bidding';

export interface LotParticipationRow {
  lotId: string;
  lotLabel: string;
  title: string;
  description: string;
  category: string;
  imageUrls: string[];
  reservePrice: number;
  status: LotParticipationRowStatus;
  bidAmount?: number;
}

function mapLotRow(lot: AuctionAssetApi): Omit<LotParticipationRow, 'status' | 'bidAmount'> {
  return {
    lotId: lot.id,
    lotLabel: lot.lotLabel ?? lot.lotTitle ?? 'Lot',
    title: lot.assetTitle ?? lot.lotLabel ?? lot.lotTitle ?? 'Asset',
    description: lot.assetLocation ?? '',
    category: lot.assetType ?? 'other_assets',
    imageUrls: lot.imageUrls ?? [],
    reservePrice: lot.reservePrice,
  };
}

export function buildLotParticipationRows(
  lots: AuctionLotApi[],
  participation: AuctionParticipationApi | null,
): LotParticipationRow[] {
  const assets = flattenAuctionAssets(lots);
  if (!assets.length || !participation) {
    return [];
  }

  const bidByLotId = new Map<string, number>();
  for (const bid of participation.bids ?? []) {
    if (bid.auctionAssetId) {
      bidByLotId.set(bid.auctionAssetId, bid.amount);
    }
  }

  const lockedDraftByLotId = new Map<string, number>();
  for (const draft of participation.bidDrafts ?? []) {
    if (draft.auctionAssetId && draft.status === 'locked') {
      lockedDraftByLotId.set(draft.auctionAssetId, draft.amount);
    }
  }

  const selectedLotIds = new Set<string>([
    ...(participation.cpo?.selectedAuctionAssetIds ?? []),
    ...((participation.lotParticipation ?? [])
      .filter((lot) => lot.selected)
      .map((lot) => lot.id) ?? []),
    ...bidByLotId.keys(),
    ...lockedDraftByLotId.keys(),
  ]);

  const cpoPending = participation.cpo?.status === 'pending';
  const cpoApproved = Boolean(participation.flags?.cpoApproved || participation.cpo?.status === 'approved');

  return assets.map((lot) => {
    const base = mapLotRow(lot);
    const lotPart = participation.lotParticipation?.find((item) => item.id === lot.id);
    const inPackage = selectedLotIds.has(lot.id) || Boolean(lotPart?.selected);
    const bidAmount = bidByLotId.get(lot.id) ?? lockedDraftByLotId.get(lot.id);

    if (bidByLotId.has(lot.id)) {
      return {
        ...base,
        status: 'bid_submitted',
        bidAmount: bidByLotId.get(lot.id),
      };
    }

    if (cpoPending && inPackage && bidAmount != null) {
      return {
        ...base,
        status: 'proposed_under_review',
        bidAmount,
      };
    }

    if (cpoApproved && inPackage && lotPart?.canPlaceBid) {
      return {
        ...base,
        status: 'awaiting_live_bid',
        bidAmount,
      };
    }

    if (inPackage && bidAmount != null) {
      return {
        ...base,
        status: cpoPending ? 'proposed_under_review' : 'bid_submitted',
        bidAmount,
      };
    }

    if (inPackage) {
      return {
        ...base,
        status: cpoPending ? 'proposed_under_review' : 'awaiting_live_bid',
      };
    }

    return {
      ...base,
      status: 'not_bidding',
    };
  });
}

export function countActiveLotParticipation(rows: LotParticipationRow[]): number {
  return rows.filter((row) => row.status !== 'not_bidding').length;
}

export function sumSubmittedBidAmounts(rows: LotParticipationRow[]): number {
  return rows.reduce((sum, row) => {
    if (row.status === 'not_bidding' || row.bidAmount == null) {
      return sum;
    }
    return sum + row.bidAmount;
  }, 0);
}

export function shouldShowLotParticipationOverview(
  participation: AuctionParticipationApi | null,
): boolean {
  if (!participation) {
    return false;
  }

  return (
    participation.cpo?.status === 'pending' ||
    participation.cpo?.status === 'approved' ||
    participation.flags?.cpoApproved ||
    participation.flags?.hasBid ||
    (participation.bids?.length ?? 0) > 0 ||
    participation.bidDrafts?.some((draft) => draft.status === 'locked') === true
  );
}
