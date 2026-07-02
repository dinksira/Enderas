import { Op } from 'sequelize';
import { sequelize } from '../config/db.config.js';
import { BidDraft, BID_DRAFT_STATUSES } from '../models/bidDraft.model.js';
import { Bid } from '../models/bid.model.js';
import { Auction } from '../models/auction.model.js';
import { AuctionAsset } from '../models/auctionAsset.model.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { computeRequiredCpoFromBidAmounts, computeMinimumBidFromReserve } from '../utils/auction-lot.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { paymentService } from './payment.service.js';
import { Cpo } from '../models/cpo.model.js';

function serializeBidDraft(draft) {
  const plain = draft.get ? draft.get({ plain: true }) : draft;
  return {
    id: plain.id,
    auctionId: plain.auction_id,
    auctionAssetId: plain.auction_asset_id ?? null,
    amount: Number(plain.amount),
    status: plain.status,
    cpoId: plain.cpo_id ?? null,
    createdAt: plain.created_at,
    updatedAt: plain.updated_at,
  };
}

function normalizeProposedBids(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => ({
      auctionAssetId: entry?.auctionAssetId ?? entry?.auction_asset_id ?? null,
      amount: Number(entry?.amount),
    }))
    .filter((entry) => Number.isFinite(entry.amount) && entry.amount > 0);
}

function draftLotKey(auctionAssetId) {
  return auctionAssetId ?? '__legacy__';
}

function proposedBidsMatchDrafts(proposedBids, drafts) {
  const draftMap = new Map(
    drafts.map((draft) => [draftLotKey(draft.auction_asset_id), Number(draft.amount)]),
  );
  const proposedMap = new Map(
    proposedBids.map((bid) => [draftLotKey(bid.auctionAssetId), Number(bid.amount)]),
  );

  if (draftMap.size !== proposedMap.size) {
    return false;
  }

  for (const [lotKey, amount] of proposedMap.entries()) {
    if (!draftMap.has(lotKey) || draftMap.get(lotKey) !== amount) {
      return false;
    }
  }

  return true;
}

async function findAuctionForDrafts(auctionId) {
  const auction = await Auction.findOne({ where: { id: auctionId, deleted_at: null } });
  if (!auction) {
    throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
  }
  if (auction.status !== 'published') {
    throw new AppError('Auction is not open for bidding', 400, 'AUCTION_NOT_OPEN');
  }

  const now = new Date();
  if (now < new Date(auction.start_date) || now > new Date(auction.end_date)) {
    throw new AppError('Auction is not within the bidding window', 400, 'AUCTION_CLOSED');
  }

  return auction;
}

async function getLatestCpo(userId, auctionId) {
  return Cpo.findOne({
    where: { user_id: userId, auction_id: auctionId, deleted_at: null },
    order: [['created_at', 'DESC']],
  });
}

async function assertCanEditBidDrafts(userId, auctionId) {
  const hasPayment = await paymentService.hasApprovedDocumentPayment(userId, auctionId);
  if (!hasPayment) {
    throw new AppError(
      'Approved document payment required before drafting bids',
      400,
      'PAYMENT_REQUIRED',
    );
  }

  const cpo = await getLatestCpo(userId, auctionId);
  if (cpo && (cpo.status === 'pending' || cpo.status === 'approved')) {
    throw new AppError('Bid drafts are locked while CPO is under review or approved', 409, 'BID_DRAFTS_LOCKED');
  }

  await findAuctionForDrafts(auctionId);
}

async function validateBidAmountForLot(auctionId, auctionAssetId, amount) {
  const auction = await Auction.findOne({ where: { id: auctionId, deleted_at: null } });
  if (!auction) {
    throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
  }

  const cpoPercentage = Number(auction.cpo_percentage);
  const lots = await AuctionAsset.findAll({
    where: { auction_id: auctionId },
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });

  const assertMinimumBid = (reservePrice) => {
    const minimumBid = computeMinimumBidFromReserve(reservePrice, cpoPercentage);
    if (minimumBid > 0 && amount < minimumBid) {
      throw new AppError(
        `Bid must be at least ${minimumBid} (${cpoPercentage || 0}% of reserve ${reservePrice})`,
        400,
        'BID_BELOW_MINIMUM',
      );
    }
  };

  if (lots.length === 0) {
    const reserve = Number(auction?.reserve_price);
    if (Number.isFinite(reserve) && reserve > 0) {
      assertMinimumBid(reserve);
    }
    return { lots, resolvedLotId: null };
  }

  let resolvedLotId = auctionAssetId?.trim() || null;
  if (lots.length === 1 && !resolvedLotId) {
    resolvedLotId = lots[0].id;
  }

  if (!resolvedLotId) {
    throw new AppError('Lot selection is required for multi-asset auctions', 400, 'LOT_REQUIRED');
  }

  const lot = lots.find((entry) => entry.id === resolvedLotId);
  if (!lot) {
    throw new AppError('Selected lot not found in this auction', 404, 'LOT_NOT_FOUND');
  }

  const reservePrice = Number(lot.reserve_price);
  assertMinimumBid(reservePrice);

  return { lots, resolvedLotId };
}

export async function listBidDraftsForAuction(auctionId, userId) {
  const drafts = await BidDraft.findAll({
    where: {
      user_id: userId,
      auction_id: auctionId,
      status: { [Op.in]: ['draft', 'locked'] },
    },
    order: [['created_at', 'ASC']],
  });

  return drafts.map(serializeBidDraft);
}

export async function upsertBidDraft({ auctionId, auctionAssetId, amount }, userId) {
  if (!auctionId) {
    throw new AppError('Auction is required', 400, 'AUCTION_REQUIRED');
  }

  const bidAmount = Number(amount);
  if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
    throw new AppError('Valid bid amount is required', 400, 'INVALID_BID_AMOUNT');
  }

  await assertCanEditBidDrafts(userId, auctionId);
  const { resolvedLotId } = await validateBidAmountForLot(auctionId, auctionAssetId, bidAmount);

  const where = {
    user_id: userId,
    auction_id: auctionId,
    auction_asset_id: resolvedLotId,
  };

  let draft = await BidDraft.findOne({ where });
  if (draft) {
    await draft.update({ amount: bidAmount, status: 'draft', cpo_id: null });
  } else {
    draft = await BidDraft.create({
      id: generateUuid(),
      user_id: userId,
      auction_id: auctionId,
      auction_asset_id: resolvedLotId,
      amount: bidAmount,
      status: 'draft',
    });
  }

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'BidDraft',
    entityId: draft.id,
    metadata: { auctionId, auctionAssetId: resolvedLotId, amount: bidAmount },
  });

  return serializeBidDraft(draft);
}

export async function deleteBidDraft(id, userId) {
  const draft = await BidDraft.findOne({ where: { id, user_id: userId } });
  if (!draft) {
    throw new AppError('Bid draft not found', 404, 'BID_DRAFT_NOT_FOUND');
  }
  if (draft.status !== 'draft') {
    throw new AppError('Only draft bids can be deleted', 400, 'BID_DRAFT_LOCKED');
  }

  await assertCanEditBidDrafts(userId, draft.auction_id);
  await draft.destroy();

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'BidDraft',
    entityId: id,
    metadata: { auctionId: draft.auction_id },
  });

  return { deleted: true };
}

export async function lockBidDraftsForCpo({ userId, auctionId, cpoId, proposedBids }) {
  const normalized = normalizeProposedBids(proposedBids);
  if (!normalized.length) {
    throw new AppError('At least one proposed bid is required', 400, 'PROPOSED_BIDS_REQUIRED');
  }

  const drafts = await BidDraft.findAll({
    where: {
      user_id: userId,
      auction_id: auctionId,
      status: 'draft',
    },
  });

  if (!proposedBidsMatchDrafts(normalized, drafts)) {
    throw new AppError('Proposed bids must match saved bid drafts', 400, 'PROPOSED_BIDS_MISMATCH');
  }

  await BidDraft.update(
    { status: 'locked', cpo_id: cpoId },
    {
      where: {
        user_id: userId,
        auction_id: auctionId,
        status: 'draft',
      },
    },
  );
}

export async function unlockBidDraftsForCpo(cpoId) {
  await BidDraft.update(
    { status: 'draft', cpo_id: null },
    {
      where: {
        cpo_id: cpoId,
        status: 'locked',
      },
    },
  );
}

export async function promoteBidDraftsOnCpoApproval(cpo) {
  const drafts = await BidDraft.findAll({
    where: {
      cpo_id: cpo.id,
      status: 'locked',
    },
  });

  if (!drafts.length) {
    return [];
  }

  const auction = await Auction.findByPk(cpo.auction_id);
  const now = new Date();
  const createdBids = [];

  await sequelize.transaction(async (transaction) => {
    for (const draft of drafts) {
      const existing = await Bid.findOne({
        where: {
          auction_id: draft.auction_id,
          user_id: draft.user_id,
          auction_asset_id: draft.auction_asset_id,
        },
        transaction,
      });

      if (existing) {
        throw new AppError('Bid already exists for one or more lots', 409, 'BID_EXISTS');
      }

      const bid = await Bid.create(
        {
          id: generateUuid(),
          auction_id: draft.auction_id,
          auction_asset_id: draft.auction_asset_id,
          user_id: draft.user_id,
          amount: draft.amount,
          currency: auction?.currency || 'ETB',
          submitted_at: now,
          is_valid: true,
          status: 'submitted',
        },
        { transaction },
      );

      await draft.update({ status: 'submitted' }, { transaction });
      createdBids.push(bid);
    }
  });

  return createdBids;
}

export function computeDraftCpoPreview(drafts, cpoPercentage) {
  const proposedBids = drafts.map((draft) => ({
    auctionAssetId: draft.auction_asset_id ?? draft.auctionAssetId ?? null,
    amount: Number(draft.amount),
  }));

  return computeRequiredCpoFromBidAmounts(proposedBids, cpoPercentage);
}

export const bidDraftService = Object.freeze({
  listBidDraftsForAuction,
  upsertBidDraft,
  deleteBidDraft,
  lockBidDraftsForCpo,
  unlockBidDraftsForCpo,
  promoteBidDraftsOnCpoApproval,
  normalizeProposedBids,
  proposedBidsMatchDrafts,
  computeDraftCpoPreview,
  BID_DRAFT_STATUSES,
});

export default bidDraftService;
