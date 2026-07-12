import { Op } from 'sequelize';
import { User, Auction, OrganizationAuction } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';

async function resolveOrgUser(orgId) {
  const user = await User.findByPk(orgId);
  if (!user || user.user_type !== 'organization') {
    throw new AppError('Organization not found', 404, 'ORG_NOT_FOUND');
  }
  return user;
}

async function resolveAuction(auctionId) {
  const auction = await Auction.findByPk(auctionId);
  if (!auction) {
    throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
  }
  return auction;
}

export async function listLinkedAuctions(orgId) {
  await resolveOrgUser(orgId);

  const links = await OrganizationAuction.findAll({
    where: { organization_user_id: orgId },
    include: [
      {
        model: Auction,
        as: 'auction',
        attributes: ['id', 'title', 'status', 'start_date', 'end_date', 'reserve_price', 'currency', 'published_at'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  return {
    auctions: links
      .filter((l) => l.auction)
      .map((l) => ({
        id: l.auction.id,
        title: l.auction.title,
        status: l.auction.status,
        startDate: l.auction.start_date,
        endDate: l.auction.end_date,
        reservePrice: l.auction.reserve_price,
        currency: l.auction.currency,
        linkedAt: l.created_at,
      })),
  };
}

export async function linkAuctionToOrganization(orgId, auctionId, staffId) {
  await resolveOrgUser(orgId);
  await resolveAuction(auctionId);

  const existing = await OrganizationAuction.findOne({
    where: { organization_user_id: orgId, auction_id: auctionId },
  });

  if (existing) {
    throw new AppError('Auction is already linked to this organization', 400, 'DUPLICATE_LINK');
  }

  const link = await OrganizationAuction.create({
    id: generateUuid(),
    organization_user_id: orgId,
    auction_id: auctionId,
    linked_by_staff_id: staffId || null,
  });

  return {
    id: link.id,
    organizationUserId: link.organization_user_id,
    auctionId: link.auction_id,
    linkedAt: link.created_at,
  };
}

export async function unlinkAuctionFromOrganization(orgId, auctionId) {
  await resolveOrgUser(orgId);

  const deleted = await OrganizationAuction.destroy({
    where: { organization_user_id: orgId, auction_id: auctionId },
  });

  if (!deleted) {
    throw new AppError('Link not found', 404, 'LINK_NOT_FOUND');
  }

  return { unlinked: true };
}

export async function getAvailableAuctionsForOrg(orgId) {
  await resolveOrgUser(orgId);

  const linkedIds = await OrganizationAuction.findAll({
    where: { organization_user_id: orgId },
    attributes: ['auction_id'],
  });

  const excludeIds = linkedIds.map((l) => l.auction_id);

  const where = {
    status: { [Op.in]: ['published', 'pending_approval'] },
  };

  if (excludeIds.length > 0) {
    where.id = { [Op.notIn]: excludeIds };
  }

  const auctions = await Auction.findAll({
    where,
    attributes: ['id', 'title', 'status', 'start_date', 'end_date', 'reserve_price', 'currency'],
    order: [['created_at', 'DESC']],
    limit: 50,
  });

  return {
    auctions: auctions.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      startDate: a.start_date,
      endDate: a.end_date,
      reservePrice: a.reserve_price,
      currency: a.currency,
    })),
  };
}

export const organizationAuctionService = Object.freeze({
  listLinkedAuctions,
  linkAuctionToOrganization,
  unlinkAuctionFromOrganization,
  getAvailableAuctionsForOrg,
});

export default organizationAuctionService;
