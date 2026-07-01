import type { AuctionParticipationRecord } from '@/types/auctionParticipation';
import { createEmptyParticipation, syncBidsWithSelection } from '@/lib/auctionParticipationUtils';
import { getMockLotsForAuction } from '@/data/mockAuctionLots';

/** Demo participation stage shown across the mock auction catalog. */
export type ParticipationDemoStep =
  | 'not_started'
  | 'doc_pending'
  | 'doc_approved'
  | 'bids_draft'
  | 'cpo_pending'
  | 'cpo_approved';

const MOCK_RECEIPT_URI = 'mock://simulation/receipt.pdf';
const MOCK_CPO_URI = 'mock://simulation/cpo-receipt.pdf';
const MOCK_SUBMITTED_AT = '2026-06-15T10:30:00.000Z';

function withLots(
  auctionId: string,
  selectedLotIds: string[],
  bidAmounts: Record<string, number>,
): { selectedLotIds: string[]; bids: { lotId: string; amount: number }[] } {
  const lots = getMockLotsForAuction(auctionId);
  const bids = syncBidsWithSelection(selectedLotIds, [], lots).map((bid) => ({
    ...bid,
    amount: bidAmounts[bid.lotId] ?? bid.amount,
  }));
  return { selectedLotIds, bids };
}

/**
 * Each mock auction is pre-seeded at a different participation step so the
 * dashboard doubles as a walkthrough of the bidder journey.
 *
 *   auc-001 → not started (no document purchase)
 *   auc-002 → document payment pending review
 *   auc-003 → document approved, ready to bid
 *   auc-004 → lots selected, bids drafted, CPO not yet uploaded
 *   auc-005 → CPO receipt uploaded, under review
 *   auc-006 → CPO approved, bids sealed
 */
export const MOCK_PARTICIPATION_SEEDS: Record<string, AuctionParticipationRecord> = {
  'auc-002': {
    auctionId: 'auc-002',
    documentPayment: {
      status: 'pending',
      paymentMethod: 'manual',
      receiptUri: MOCK_RECEIPT_URI,
      receiptName: 'bank-transfer-receipt.jpg',
      submittedAt: MOCK_SUBMITTED_AT,
    },
    cpo: { status: 'none', selectedLotIds: [], bids: [], locked: false },
  },
  'auc-003': {
    auctionId: 'auc-003',
    documentPayment: {
      status: 'approved',
      paymentMethod: 'addis_pay',
      receiptUri: MOCK_RECEIPT_URI,
      receiptName: 'addis-pay-confirmation.pdf',
      submittedAt: MOCK_SUBMITTED_AT,
    },
    cpo: { status: 'none', selectedLotIds: [], bids: [], locked: false },
  },
  'auc-004': {
    auctionId: 'auc-004',
    documentPayment: {
      status: 'approved',
      paymentMethod: 'manual',
      receiptUri: MOCK_RECEIPT_URI,
      receiptName: 'payment-receipt.pdf',
      submittedAt: MOCK_SUBMITTED_AT,
    },
    cpo: {
      status: 'none',
      locked: false,
      ...withLots('auc-004', ['lot-004-1'], { 'lot-004-1': 1_350_000 }),
    },
  },
  'auc-005': {
    auctionId: 'auc-005',
    documentPayment: {
      status: 'approved',
      paymentMethod: 'manual',
      receiptUri: MOCK_RECEIPT_URI,
      receiptName: 'payment-receipt.pdf',
      submittedAt: MOCK_SUBMITTED_AT,
    },
    cpo: {
      status: 'pending',
      locked: true,
      receiptUri: MOCK_CPO_URI,
      receiptName: 'cpo-bank-transfer.pdf',
      submittedAt: MOCK_SUBMITTED_AT,
      ...withLots('auc-005', ['lot-005-1'], { 'lot-005-1': 7_200_000 }),
    },
  },
  'auc-006': {
    auctionId: 'auc-006',
    documentPayment: {
      status: 'approved',
      paymentMethod: 'manual',
      receiptUri: MOCK_RECEIPT_URI,
      receiptName: 'payment-receipt.pdf',
      submittedAt: MOCK_SUBMITTED_AT,
    },
    cpo: {
      status: 'approved',
      locked: true,
      receiptUri: MOCK_CPO_URI,
      receiptName: 'cpo-bank-transfer.pdf',
      submittedAt: MOCK_SUBMITTED_AT,
      ...withLots('auc-006', ['lot-006-1', 'lot-006-3'], {
        'lot-006-1': 220_000,
        'lot-006-3': 120_000,
      }),
    },
  },
};

export function getMockParticipationSeed(auctionId: string): AuctionParticipationRecord | undefined {
  return MOCK_PARTICIPATION_SEEDS[auctionId];
}

export function resolveParticipationRecord(
  auctionId: string,
  stored?: AuctionParticipationRecord,
): AuctionParticipationRecord {
  if (stored) return stored;
  return getMockParticipationSeed(auctionId) ?? createEmptyParticipation(auctionId);
}

export function getParticipationDemoStep(record: AuctionParticipationRecord): ParticipationDemoStep {
  if (record.documentPayment.status === 'none') return 'not_started';
  if (record.documentPayment.status === 'pending') return 'doc_pending';
  if (record.cpo.status === 'approved') return 'cpo_approved';
  if (record.cpo.locked && record.cpo.status === 'pending') return 'cpo_pending';
  if (record.documentPayment.status === 'approved' && record.cpo.selectedLotIds.length > 0) {
    return 'bids_draft';
  }
  if (record.documentPayment.status === 'approved') return 'doc_approved';
  return 'not_started';
}

export function mergeParticipationRecords(
  persisted: Record<string, AuctionParticipationRecord>,
): Record<string, AuctionParticipationRecord> {
  return { ...MOCK_PARTICIPATION_SEEDS, ...persisted };
}
