import { sendSuccess } from '../utils/response.util.js';
import { bidDraftService } from '../services/bid-draft.service.js';

function resolveUserId(req) {
  return req.user?.id ?? req.auth?.userId ?? null;
}

export async function listBidDraftsForAuction(req, res, next) {
  try {
    const userId = resolveUserId(req);
    const drafts = await bidDraftService.listBidDraftsForAuction(req.params.id, userId);
    return sendSuccess(res, { items: drafts });
  } catch (error) {
    return next(error);
  }
}

export async function upsertBidDraft(req, res, next) {
  try {
    const draft = await bidDraftService.upsertBidDraft(
      {
        auctionId: req.body.auctionId || req.body.auction_id,
        auctionAssetId: req.body.auctionAssetId || req.body.auction_asset_id,
        amount: req.body.amount,
      },
      resolveUserId(req),
    );
    return sendSuccess(res, { draft }, 200);
  } catch (error) {
    return next(error);
  }
}

export async function deleteBidDraft(req, res, next) {
  try {
    const result = await bidDraftService.deleteBidDraft(req.params.id, resolveUserId(req));
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export const bidDraftController = Object.freeze({
  listBidDraftsForAuction,
  upsertBidDraft,
  deleteBidDraft,
});

export default bidDraftController;
