import { useMemo } from 'react';

import { getMockLotsForAuction } from '@/data/mockAuctionLots';
import { resolveParticipationRecord } from '@/data/mockParticipationSeeds';
import { useAuctionParticipationStore } from '@/lib/auctionParticipationStore';
import {
  canEnterBidFlow,
  getParticipationSummary,
  hasDocumentAccess,
} from '@/lib/auctionParticipationUtils';
import { isKycVerified } from '@/lib/auth-utils';
import { useAuthStore } from '@/lib/authStore';

export function useAuctionParticipation(auctionId: string) {
  const user = useAuthStore((s) => s.user);
  const storedRecord = useAuctionParticipationStore((s) => s.records[auctionId]);
  const record = resolveParticipationRecord(auctionId, storedRecord);
  const submitDocumentPayment = useAuctionParticipationStore((s) => s.submitDocumentPayment);
  const simulateApproveDocumentPayment = useAuctionParticipationStore(
    (s) => s.simulateApproveDocumentPayment,
  );
  const simulateRejectDocumentPayment = useAuctionParticipationStore(
    (s) => s.simulateRejectDocumentPayment,
  );
  const toggleLotSelection = useAuctionParticipationStore((s) => s.toggleLotSelection);
  const updateLotBid = useAuctionParticipationStore((s) => s.updateLotBid);
  const submitCpoReceipt = useAuctionParticipationStore((s) => s.submitCpoReceipt);
  const simulateApproveCpo = useAuctionParticipationStore((s) => s.simulateApproveCpo);
  const simulateRejectCpo = useAuctionParticipationStore((s) => s.simulateRejectCpo);
  const resetParticipation = useAuctionParticipationStore((s) => s.resetParticipation);

  const lots = useMemo(() => getMockLotsForAuction(auctionId), [auctionId]);
  const kycVerified = isKycVerified(user);
  const documentApproved = hasDocumentAccess(record.documentPayment);
  const canBid = canEnterBidFlow(record.documentPayment, kycVerified);
  const summary = getParticipationSummary(record, lots);

  return {
    record,
    lots,
    kycVerified,
    documentApproved,
    canBid,
    summary,
    actions: {
      submitDocumentPayment,
      simulateApproveDocumentPayment,
      simulateRejectDocumentPayment,
      toggleLotSelection,
      updateLotBid,
      submitCpoReceipt,
      simulateApproveCpo,
      simulateRejectCpo,
      resetParticipation,
    },
  };
}

export default useAuctionParticipation;
