import type { TFunction } from 'i18next';

import { formatEtbAmount } from '@/lib/auctionUtils';
import { mapAuctionAssetForDisplay } from '@/lib/auctionAssetUtils';
import { getLotBidFeedback, validateLotBid } from '@/lib/auctionParticipationUtils';
import type { CpoReadinessItem } from '@/components/auction/CpoReadinessSheet';
import type { AuctionAssetApi } from '@/types/auctionApi';

type BuildCpoReadinessParams = {
  t: TFunction;
  auctionAssets: AuctionAssetApi[];
  selectedLotIds: string[];
  lotBids: Record<string, string>;
  allSelectedLotsSaved: boolean;
  cpoAmount: number;
};

function parseBidAmount(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

export function buildCpoReadinessItems({
  t,
  auctionAssets,
  selectedLotIds,
  lotBids,
  allSelectedLotsSaved,
  cpoAmount,
}: BuildCpoReadinessParams): CpoReadinessItem[] {
  const items: CpoReadinessItem[] = [];

  if (selectedLotIds.length === 0) {
    items.push({
      id: 'select-items',
      status: 'error',
      title: t('auction.participation.cpoCheckSelectTitle'),
      description: t('auction.participation.cpoCheckSelectBody'),
    });
    return items;
  }

  items.push({
    id: 'items-selected',
    status: 'ok',
    title: t('auction.participation.cpoCheckItemsOkTitle'),
    description: t('auction.participation.cpoCheckItemsOkBody', { count: selectedLotIds.length }),
  });

  const missingBidItems = selectedLotIds.filter((lotId) => {
    const amount = parseBidAmount(lotBids[lotId] ?? '');
    return amount <= 0;
  });

  if (missingBidItems.length > 0) {
    const names = missingBidItems
      .map((id) => auctionAssets.find((asset) => asset.id === id))
      .filter(Boolean)
      .map((asset) => mapAuctionAssetForDisplay(asset!).title)
      .slice(0, 3)
      .join(', ');

    items.push({
      id: 'missing-bids',
      status: 'error',
      title: t('auction.participation.cpoCheckMissingBidTitle'),
      description: t('auction.participation.cpoCheckMissingBidBody'),
      detail:
        missingBidItems.length > 3
          ? t('auction.participation.cpoCheckMissingBidDetailMore', {
              names,
              count: missingBidItems.length - 3,
            })
          : t('auction.participation.cpoCheckMissingBidDetail', { names }),
    });
  } else {
    items.push({
      id: 'bids-entered',
      status: 'ok',
      title: t('auction.participation.cpoCheckBidsEnteredTitle'),
      description: t('auction.participation.cpoCheckBidsEnteredBody'),
    });
  }

  const invalidBidItems = selectedLotIds
    .map((lotId) => {
      const raw = auctionAssets.find((asset) => asset.id === lotId);
      if (!raw) return null;
      const display = mapAuctionAssetForDisplay(raw);
      const bidText = lotBids[lotId] ?? '';
      const feedback = getLotBidFeedback(bidText, display, { forceShow: true });
      if (feedback.kind !== 'error' || !feedback.errorKey) return null;
      return {
        lotId,
        title: display.title,
        errorKey: feedback.errorKey,
        reserve: formatEtbAmount(display.reservePrice),
      };
    })
    .filter(Boolean) as { lotId: string; title: string; errorKey: string; reserve: string }[];

  if (invalidBidItems.length > 0) {
    const first = invalidBidItems[0];
    items.push({
      id: 'invalid-bids',
      status: 'error',
      title: t('auction.participation.cpoCheckInvalidBidTitle'),
      description: t('auction.participation.cpoCheckInvalidBidBody'),
      detail:
        invalidBidItems.length === 1
          ? t(`auction.participation.bidErrors.${first.errorKey}`, {
              reserve: first.reserve,
              title: first.title,
            }) + ` (${first.title})`
          : t('auction.participation.cpoCheckInvalidBidDetail', {
              count: invalidBidItems.length,
              example: t(`auction.participation.bidErrors.${first.errorKey}`, {
                reserve: first.reserve,
                title: first.title,
              }),
              title: first.title,
            }),
    });
  } else if (missingBidItems.length === 0) {
    items.push({
      id: 'bids-valid',
      status: 'ok',
      title: t('auction.participation.cpoCheckBidsValidTitle'),
      description: t('auction.participation.cpoCheckBidsValidBody'),
    });
  }

  if (!allSelectedLotsSaved) {
    items.push({
      id: 'saving',
      status: 'warning',
      title: t('auction.participation.cpoCheckSavingTitle'),
      description: t('auction.participation.cpoCheckSavingBody'),
    });
  } else if (missingBidItems.length === 0 && invalidBidItems.length === 0) {
    items.push({
      id: 'bids-saved',
      status: 'ok',
      title: t('auction.participation.cpoCheckSavedTitle'),
      description: t('auction.participation.cpoCheckSavedBody'),
    });
  }

  if (cpoAmount <= 0) {
    items.push({
      id: 'cpo-amount',
      status: 'error',
      title: t('auction.participation.cpoCheckAmountTitle'),
      description: t('auction.participation.cpoCheckAmountBody'),
    });
  } else {
    items.push({
      id: 'cpo-ready',
      status: 'ok',
      title: t('auction.participation.cpoCheckAmountOkTitle'),
      description: t('auction.participation.cpoCheckAmountOkBody', {
        amount: formatEtbAmount(cpoAmount),
      }),
    });
  }

  return items;
}

export function isCpoUploadReady(items: CpoReadinessItem[]): boolean {
  return items.length > 0 && items.every((item) => item.status === 'ok');
}
