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
import { User } from '../models/index.js';
import { resolvePublicUploadUrl } from '../utils/media-url.util.js';
import { sendShareLinkEmail } from '../integrations/email.integration.js';
import { Op, fn, col, literal } from 'sequelize';

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

const DEFAULT_VISIBILITY = {
  bidderCount: true,
  assetImages: true,
  auctionDetails: true,
  lotDetails: true,
  lotImages: true,
  auctionDocuments: true,
  winnerInfo: true,
};

function normalizeDocumentFiles(docs) {
  if (!docs || !Array.isArray(docs)) return [];
  return docs
    .filter((d) => d && typeof d.url === 'string' && d.url.length > 0)
    .map((d) => ({ name: d.name || d.fileName || 'document.pdf', url: d.url, size: Number(d.size) || 0 }));
}

async function createShareLink(staffId, auctionId, { organizationName, contactEmail, password, expiresInDays, maxViews, visibilitySettings }) {
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
    visibility_settings: visibilitySettings || DEFAULT_VISIBILITY,
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

  const linkHasPassword = !!link.password_hash;

  let orgUser = null;
  if (link.organization_name) {
    try {
      orgUser = await User.unscoped().findOne({
        where: {
          organization_name: link.organization_name,
          user_type: 'organization',
        },
      });
    } catch {
      orgUser = null;
    }
  }

  const hasAnyPassword = linkHasPassword || orgUser;

  if (hasAnyPassword) {
    if (!password) throw new UnauthorizedError('Password required');

    const linkPasswordValid = linkHasPassword && await bcrypt.compare(password, link.password_hash).catch(() => false);

    let orgPasswordValid = false;
    if (!linkPasswordValid && orgUser) {
      orgPasswordValid = await bcrypt.compare(password, orgUser.password).catch(() => false);
    }

    if (!linkPasswordValid && !orgPasswordValid) {
      throw new UnauthorizedError('Invalid password');
    }
  }

  await link.increment('view_count');
  await link.update({ last_accessed_at: new Date() });

  const accessToken = signTrackToken(link.id, link.auction_id);

  return { accessToken, expiresIn: TRACK_JWT_EXPIRES_IN };
}

async function getAuctionTrackingData(linkId, auctionId) {
  const link = await AuctionShareLink.findByPk(linkId);
  if (!link || !link.is_active) throw new NotFoundError('Share link not found');

  const vis = link.visibility_settings || DEFAULT_VISIBILITY;

  const auction = await Auction.findByPk(auctionId, {
    include: [
      {
        model: Asset,
        as: 'asset',
        attributes: ['id', 'title', 'description', 'asset_type', 'image_urls', 'desired_reserve_price'],
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

  const participantResult = await Bid.findOne({
    where: { auction_id: auctionId, status: 'submitted' },
    attributes: [
      [fn('COUNT', literal('DISTINCT user_id')), 'count'],
    ],
    raw: true,
  });
  const participantCount = participantResult?.count || 0;

  const winner = await Winner.findOne({
    where: { auction_id: auctionId },
    include: [
      { model: User, as: 'user', attributes: ['organization_name'] },
    ],
    order: [['created_at', 'DESC']],
  });

  const result = {
    auction: vis.auctionDetails ? {
      id: auction.id,
      title: auction.title,
      description: auction.description,
      status: auction.status,
      mode: auction.auction_mode,
      category: auction.category,
      reservePrice: auction.reserve_price ? Number(auction.reserve_price) : null,
      totalReservePrice: auction.total_reserve_price ? Number(auction.total_reserve_price) : null,
      documentPrice: auction.document_price ? Number(auction.document_price) : null,
      cpoPercentage: auction.cpo_percentage ? Number(auction.cpo_percentage) : null,
      currency: auction.currency,
      imageUrls: vis.assetImages
        ? (Array.isArray(auction.image_urls)
          ? auction.image_urls.map((url) => resolvePublicUploadUrl(url)).filter(Boolean)
          : null)
        : null,
      auctionConditions: auction.auction_conditions,
      startDate: auction.start_date,
      endDate: auction.end_date,
      publishedAt: auction.published_at,
      closedAt: auction.closed_at,
      documents: vis.auctionDocuments ? normalizeDocumentFiles(auction.document_files) : null,
    } : { id: auction.id, title: auction.title, status: auction.status },

    asset: auction.asset && vis.auctionDetails && vis.lotDetails ? {
      id: auction.asset.id,
      title: auction.asset.title,
      description: auction.asset.description,
      assetType: auction.asset.asset_type,
      imageUrls: vis.lotImages
        ? (Array.isArray(auction.asset.image_urls)
          ? auction.asset.image_urls.map((url) => resolvePublicUploadUrl(url)).filter(Boolean)
          : null)
        : null,
      desiredReservePrice: auction.asset.desired_reserve_price,
    } : null,

    tracking: {
      ...(vis.bidderCount ? {
        currentHighestBid: highestBid ? Number(highestBid.amount) : null,
        totalBids: bidCount,
        participantCount,
      } : {}),
      ...(vis.winnerInfo && winner ? {
        winner: {
          amount: winner.amount ? Number(winner.amount) : null,
          organizationName: winner.user?.organization_name || null,
          announcedAt: winner.createdAt,
        },
      } : {}),
    },
  };

  return result;
}

async function listShareLinks(auctionId) {
  const links = await AuctionShareLink.findAll({
    where: { auction_id: auctionId },
    order: [['created_at', 'DESC']],
    attributes: [
      'id', 'organization_name', 'contact_email', 'token',
      'expires_at', 'max_views', 'view_count', 'is_active',
      'last_accessed_at', 'created_at', 'password_hash', 'visibility_settings',
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
    visibilitySettings: link.visibility_settings || DEFAULT_VISIBILITY,
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
