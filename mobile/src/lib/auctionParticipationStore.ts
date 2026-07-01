import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AuctionCpoState,
  AuctionDocumentPayment,
  AuctionParticipationRecord,
  LotBidDraft,
  PaymentMethod,
} from '@/types/auctionParticipation';
import {
  createEmptyParticipation,
  syncBidsWithSelection,
} from '@/lib/auctionParticipationUtils';
import {
  getMockParticipationSeed,
  mergeParticipationRecords,
} from '@/data/mockParticipationSeeds';
import { getMockLotsForAuction } from '@/data/mockAuctionLots';

interface AuctionParticipationState {
  records: Record<string, AuctionParticipationRecord>;

  getRecord: (auctionId: string) => AuctionParticipationRecord;
  submitDocumentPayment: (
    auctionId: string,
    payload: { paymentMethod: PaymentMethod; receiptUri: string; receiptName: string },
  ) => void;
  simulateApproveDocumentPayment: (auctionId: string) => void;
  simulateRejectDocumentPayment: (auctionId: string) => void;
  toggleLotSelection: (auctionId: string, lotId: string) => void;
  updateLotBid: (auctionId: string, lotId: string, amount: number) => void;
  submitCpoReceipt: (
    auctionId: string,
    payload: { receiptUri: string; receiptName: string },
  ) => void;
  simulateApproveCpo: (auctionId: string) => void;
  simulateRejectCpo: (auctionId: string) => void;
  resetParticipation: (auctionId: string) => void;
}

function upsertRecord(
  records: Record<string, AuctionParticipationRecord>,
  auctionId: string,
  updater: (record: AuctionParticipationRecord) => AuctionParticipationRecord,
): Record<string, AuctionParticipationRecord> {
  const current =
    records[auctionId] ??
    getMockParticipationSeed(auctionId) ??
    createEmptyParticipation(auctionId);
  return {
    ...records,
    [auctionId]: updater(current),
  };
}

export const useAuctionParticipationStore = create<AuctionParticipationState>()(
  persist(
    (set, get) => ({
      records: {},

      getRecord: (auctionId) => {
        const { records } = get();
        return (
          records[auctionId] ??
          getMockParticipationSeed(auctionId) ??
          createEmptyParticipation(auctionId)
        );
      },

      submitDocumentPayment: (auctionId, payload) => {
        set((state) =>
          upsertRecord(state.records, auctionId, (record) => ({
            ...record,
            documentPayment: {
              status: 'pending',
              paymentMethod: payload.paymentMethod,
              receiptUri: payload.receiptUri,
              receiptName: payload.receiptName,
              submittedAt: new Date().toISOString(),
            } satisfies AuctionDocumentPayment,
          })),
        );
      },

      simulateApproveDocumentPayment: (auctionId) => {
        set((state) =>
          upsertRecord(state.records, auctionId, (record) => ({
            ...record,
            documentPayment: {
              ...record.documentPayment,
              status: 'approved',
            },
          })),
        );
      },

      simulateRejectDocumentPayment: (auctionId) => {
        set((state) =>
          upsertRecord(state.records, auctionId, (record) => ({
            ...record,
            documentPayment: {
              ...record.documentPayment,
              status: 'rejected',
            },
          })),
        );
      },

      toggleLotSelection: (auctionId, lotId) => {
        const lots = getMockLotsForAuction(auctionId);
        set((state) =>
          upsertRecord(state.records, auctionId, (record) => {
            if (record.cpo.locked) return record;

            const isSelected = record.cpo.selectedLotIds.includes(lotId);
            const selectedLotIds = isSelected
              ? record.cpo.selectedLotIds.filter((id) => id !== lotId)
              : [...record.cpo.selectedLotIds, lotId];

            return {
              ...record,
              cpo: {
                ...record.cpo,
                selectedLotIds,
                bids: syncBidsWithSelection(selectedLotIds, record.cpo.bids, lots),
              } satisfies AuctionCpoState,
            };
          }),
        );
      },

      updateLotBid: (auctionId, lotId, amount) => {
        set((state) =>
          upsertRecord(state.records, auctionId, (record) => {
            if (record.cpo.locked) return record;
            if (!record.cpo.selectedLotIds.includes(lotId)) return record;

            const bids: LotBidDraft[] = record.cpo.bids.map((bid) =>
              bid.lotId === lotId ? { ...bid, amount } : bid,
            );

            return {
              ...record,
              cpo: {
                ...record.cpo,
                bids,
              },
            };
          }),
        );
      },

      submitCpoReceipt: (auctionId, payload) => {
        set((state) =>
          upsertRecord(state.records, auctionId, (record) => ({
            ...record,
            cpo: {
              ...record.cpo,
              status: 'pending',
              locked: true,
              receiptUri: payload.receiptUri,
              receiptName: payload.receiptName,
              submittedAt: new Date().toISOString(),
            },
          })),
        );
      },

      simulateApproveCpo: (auctionId) => {
        set((state) =>
          upsertRecord(state.records, auctionId, (record) => ({
            ...record,
            cpo: {
              ...record.cpo,
              status: 'approved',
              locked: true,
            },
          })),
        );
      },

      simulateRejectCpo: (auctionId) => {
        set((state) =>
          upsertRecord(state.records, auctionId, (record) => ({
            ...record,
            cpo: {
              ...record.cpo,
              status: 'rejected',
              locked: false,
            },
          })),
        );
      },

      resetParticipation: (auctionId) => {
        set((state) => {
          const next = { ...state.records };
          const seed = getMockParticipationSeed(auctionId);
          if (seed) {
            next[auctionId] = seed;
          } else {
            delete next[auctionId];
          }
          return { records: next };
        });
      },
    }),
    {
      name: 'enderas-auction-participation-v2',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.records = mergeParticipationRecords(state.records);
      },
    },
  ),
);

export default useAuctionParticipationStore;
