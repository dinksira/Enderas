import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';
import { generateUuid } from '../utils/crypto.util.js';
import { AuctionShareLink } from '../models/index.js';
import { NotFoundError, ForbiddenError, UnauthorizedError } from '../utils/error.util.js';
import { Auction } from '../models/auction.model.js';
import { Asset } from '../models/asset.model.js';
import { Bid } from '../models/bid.model.js';
import { Winner } from '../models/winner.model.js';
import { User } from '../models/user.model.js';
import { sendShareLinkEmail } from '../integrations/email.integration.js';
import { Op } from 'sequelize';

const TRACK_JWT_EXPIRES_IN = '24h';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function signTrackToken(linkId, auctionId) {
  return jwt.sign(
    { typ: 'track', linkId, auctionId },
    env.jwt.accessSecret,
    { expiresIn: TRACK_JWT_EXPIRES_IN, algorithm: 'HS256' },
  );
}

function verifyTrackToken(token) {
  const decoded = jwt.verify(token, env.jwt.accessSecret, { algorithms: ['HS256'] });
  if (decoded.typ !== 'track') {
    throw new UnauthorizedError('Invalid token type');
  }
  return decoded;
}

async function createShareLink(staffId, auctionId, { organizationName, contactEmail, password, expiresInDays, maxViews }) {
  const auction = await Auction.findByPk(auctionId);
  if (!auction) throw new NotFoundError('Auction not found');

  const token = generateToken();
  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  let expiresAt = null;
  if (expiresInDays && Number(expiresInDays) > 0) {
    expiresAt = new Date(Date.now() + Number(expiresInDays) * 86400000);
  }

  const link = await AuctionShareLink.create({
    id: generateUuid(),
    auction_id: auctionId,
    organization_name: organizationName,
    contact_email: contactEmail || null,
    token,
    password_hash: passwordHash,
    expires_at: expiresAt,
    max_views: maxViews ? Number(maxViews) : null,
    view_count: 0,
    is_active: true,
    created_by_staff_id: staffId,
  });

  const baseUrl = env.app?.frontendUrl || 'http://localhost:5173';
  const trackUrl = `${baseUrl}/track/${token}`;

  // Send email notification if contact email provided
  if (contactEmail) {
    try {
      await sendShareLinkEmail({
        to: contactEmail,
        organizationName,
        auctionTitle: auction.title,
        trackUrl,
        password: password || null,
      });
    } catch {
      // Email failure should not block link creation
    }
  }

  return {
    id: link.id,
    token: link.token,
    url: trackUrl,
    organizationName: link.organization_name,
    contactEmail: link.contact_email,
    password: password || undefined,
    expiresAt: link.expires_at,
    maxViews: link.max_views,
    hasPassword: !!link.password_hash,
  };
}

async function authenticateShareLink(token, password) {
  const link = await AuctionShareLink.findOne({
    where: { token, is_active: true },
  });

  if (!link) throw new NotFoundError('Share link not found or has been deactivated');

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    throw new ForbiddenError('Share link has expired');
  }

  if (link.max_views !== null && link.view_count >= link.max_views) {
    throw new ForbiddenError('Share link view limit reached');
  }

  if (!password) throw new UnauthorizedError('Password required');

  const linkPasswordValid = link.password_hash && await bcrypt.compare(password, link.password_hash).catch(() => false);

  let orgPasswordValid = false;
  if (!linkPasswordValid && link.organization_name) {
    const orgUser = await User.scope('withCredentials').findOne({
      where: {
        organization_name: link.organization_name,
        user_type: 'organization',
      },
    });
    if (orgUser) {
      orgPasswordValid = await bcrypt.compare(password, orgUser.password).catch(() => false);
    }
  }

  if (!linkPasswordValid && !orgPasswordValid) {
    throw new UnauthorizedError('Invalid password');
  }

  await link.increment('view_count');
  await link.update({ last_accessed_at: new Date() });

  const accessToken = signTrackToken(link.id, link.auction_id);

  return { accessToken, expiresIn: TRACK_JWT_EXPIRES_IN };
}

async function getAuctionTrackingData(linkId, auctionId) {
  const link = await AuctionShareLink.findByPk(linkId);
  if (!link || !link.is_active) throw new NotFoundError('Share link not found');

  const auction = await Auction.findByPk(auctionId, {
    include: [
      {
        model: Asset,
        as: 'asset',
        attributes: ['id', 'title', 'description', 'assetType', 'imageUrls', 'desiredReservePrice'],
      },
    ],
  });
  if (!auction) throw new NotFoundError('Auction not found');

  const highestBid = await Bid.findOne({
    where: { auction_id: auctionId, status: 'submitted' },
    order: [['amount', 'DESC']],
    attributes: ['amount'],
  });

  const bidCount = await Bid.count({
    where: { auction_id: auctionId, status: 'submitted' },
  });

  const winner = await Winner.findOne({
    where: { auction_id: auctionId },
    include: [
      { model: User, as: 'user', attributes: ['displayName'] },
    ],
    order: [['created_at', 'DESC']],
  });

  return {
    auction: {
      id: auction.id,
      title: auction.title,
      status: auction.status,
      mode: auction.mode,
      category: auction.category,
      startDate: auction.startDate,
      endDate: auction.endDate,
      publishedAt: auction.publishedAt,
      closedAt: auction.closedAt,
    },
    asset: auction.asset ? {
      id: auction.asset.id,
      title: auction.asset.title,
      description: auction.asset.description,
      assetType: auction.asset.assetType,
      imageUrls: auction.asset.imageUrls,
      desiredReservePrice: auction.asset.desiredReservePrice,
    } : null,
    tracking: {
      currentHighestBid: highestBid ? Number(highestBid.amount) : null,
      totalBids: bidCount,
      winner: winner ? {
        amount: winner.amount ? Number(winner.amount) : null,
        organizationName: winner.user?.displayName || null,
        announcedAt: winner.createdAt,
      } : null,
    },
  };
}

async function listShareLinks(auctionId) {
  const links = await AuctionShareLink.findAll({
    where: { auction_id: auctionId },
    order: [['created_at', 'DESC']],
    attributes: [
      'id', 'organization_name', 'contact_email', 'token',
      'expires_at', 'max_views', 'view_count', 'is_active',
      'last_accessed_at', 'created_at', 'password_hash',
    ],
  });

  const baseUrl = env.app?.frontendUrl || 'http://localhost:5173';

  return links.map((link) => ({
    id: link.id,
    organizationName: link.organization_name,
    contactEmail: link.contact_email,
    url: `${baseUrl}/track/${link.token}`,
    hasPassword: !!link.password_hash,
    expiresAt: link.expires_at,
    maxViews: link.max_views,
    viewCount: link.view_count,
    isActive: link.is_active,
    lastAccessedAt: link.last_accessed_at,
    createdAt: link.created_at,
  }));
}

async function revokeShareLink(id) {
  const link = await AuctionShareLink.findByPk(id);
  if (!link) throw new NotFoundError('Share link not found');
  await link.update({ is_active: false });
  return { id, isActive: false };
}

export const shareLinkService = Object.freeze({
  createShareLink,
  authenticateShareLink,
  getAuctionTrackingData,
  listShareLinks,
  revokeShareLink,
  verifyTrackToken,
});

export default shareLinkService;
