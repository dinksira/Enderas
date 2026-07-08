import { create } from 'zustand';
import { bidService } from '../services/bid-service.js';

export const CPO_WIZARD_STEPS = Object.freeze({
  BID_ENTRY: 'bid_entry',
  CPO_UPLOAD: 'cpo_upload',
  REVIEW: 'review',
  SUBMITTED: 'submitted',
});

export const useCpoWizardStore = create((set, get) => ({
  step: CPO_WIZARD_STEPS.BID_ENTRY,
  bids: [],
  receiptUrl: null,
  transactionRef: '',
  depositAmount: 0,
  error: null,
  submitting: false,

  addBid: (entry) => set((s) => ({ bids: [...s.bids, entry] })),
  setBids: (bids) => set({ bids: Array.isArray(bids) ? bids : [] }),
  removeBid: (assetId) => set((s) => ({
    bids: s.bids.filter((b) => b.auctionAssetId !== assetId),
  })),
  updateBidAmount: (assetId, amount) => set((s) => ({
    bids: s.bids.map((b) =>
      b.auctionAssetId === assetId ? { ...b, amount } : b,
    ),
  })),
  setReceiptUrl: (url) => set({ receiptUrl: url }),
  setTransactionRef: (ref) => set({ transactionRef: ref }),
  setStep: (step) => set({ step }),
  reset: () => set({
    step: CPO_WIZARD_STEPS.BID_ENTRY,
    bids: [],
    receiptUrl: null,
    transactionRef: '',
    error: null,
  }),

  computeDeposit: (cpoPercentage, assets) => {
    const bids = get().bids;
    return bids.reduce((sum, b) => {
      const asset = assets.find((a) => a.id === b.auctionAssetId);
      const reserve = Number(asset?.reservePrice ?? asset?.reserve_price ?? 0);
      return sum + reserve * (Number(cpoPercentage) / 100);
    }, 0);
  },

  submit: async (auctionId) => {
    const state = get();
    set({ submitting: true, error: null });
    try {
      const result = await bidService.submitBidWithCpo({
        auctionId,
        bids: state.bids.map((b) => ({
          auctionAssetId: b.auctionAssetId,
          amount: b.amount,
        })),
        cpoDocumentUrl: state.receiptUrl,
        transactionReference: state.transactionRef,
      });
      set({ step: CPO_WIZARD_STEPS.SUBMITTED, submitting: false });
      return result;
    } catch (err) {
      set({ error: err.message, submitting: false });
      throw err;
    }
  },
}));
