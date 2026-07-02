import { QueryTypes, fn, col } from 'sequelize';
import { sequelize } from '../config/db.config.js';
import { User } from '../models/user.model.js';
import { Auction, AUCTION_CATEGORIES } from '../models/auction.model.js';
import { Role } from '../models/role.model.js';
import { listBrowseAuctions } from './auction.service.js';
import { settingsService } from './settings.service.js';
import { enrichAuctionsWithPrimaryImages } from '../utils/auction-image.util.js';

const FEATURED_LIMIT = 8;

/**
 * Strip sensitive pricing from anonymous landing page payloads.
 * @param {object} auction
 */
function sanitizePublicLandingAuction(auction) {
  if (!auction || typeof auction !== 'object') {
    return auction;
  }

  const {
    reservePrice,
    reserve,
    totalReservePrice,
    documentFee,
    cpoPercentage,
    ...publicFields
  } = auction;

  return publicFields;
}

async function countRegisteredBidders() {
  const bidderRole = await Role.findOne({
    where: { code: 'bidder', is_active: true },
    attributes: ['id'],
  });

  if (!bidderRole) {
    return 0;
  }

  return User.count({
    where: {
      role_id: bidderRole.id,
      status: 'active',
      deleted_at: null,
    },
  });
}

async function sumConfirmedTransactionValue() {
  const [row] = await sequelize.query(
    `
    SELECT COALESCE(SUM(b.amount), 0) AS total
    FROM winners w
    INNER JOIN bids b ON b.id = w.bid_id
    WHERE w.status = 'confirmed'
      AND w.deleted_at IS NULL
    `,
    { type: QueryTypes.SELECT },
  );

  return Number(row?.total ?? 0);
}

/**
 * Aggregate platform statistics safe for anonymous landing page display.
 */
export async function getPublicLandingStats() {
  const [
    activeAuctions,
    registeredBidders,
    institutions,
    totalValue,
  ] = await Promise.all([
    Auction.count({ where: { status: 'published', deleted_at: null } }),
    countRegisteredBidders(),
    User.count({
      where: {
        user_type: 'organization',
        status: 'active',
        deleted_at: null,
      },
    }),
    sumConfirmedTransactionValue(),
  ]);

  return {
    activeAuctions,
    registeredBidders,
    institutions,
    totalValue,
    currency: 'ETB',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Published auctions for the public landing page (no auth, no participation data).
 * @param {{ limit?: number, category?: string }} [options]
 */
export async function getPublicFeaturedAuctions(options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || FEATURED_LIMIT, 1), 12);
  const category = options.category ? String(options.category).trim() : null;

  const browseOptions = { status: 'ACTIVE' };
  if (category) {
    browseOptions.search = category;
  }

  const result = await listBrowseAuctions(browseOptions, null);
  let items = result.items ?? [];

  if (category) {
    items = items.filter((item) => item.category === category || item.categoryKey === category);
  }

  items.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  const enriched = await enrichAuctionsWithPrimaryImages(items.slice(0, limit * 2));
  enriched.sort((a, b) => {
    const aHasImage = a.imageUrl ? 0 : 1;
    const bHasImage = b.imageUrl ? 0 : 1;
    if (aHasImage !== bHasImage) {
      return aHasImage - bHasImage;
    }
    return new Date(a.endDate) - new Date(b.endDate);
  });

  return {
    items: enriched.slice(0, limit).map(sanitizePublicLandingAuction),
    total: items.length,
  };
}

async function getPublishedCategoryCounts() {
  const rows = await Auction.findAll({
    where: { status: 'published', deleted_at: null },
    attributes: ['category', [fn('COUNT', col('id')), 'count']],
    group: ['category'],
    raw: true,
  });

  const countByCategory = new Map(
    rows.map((row) => [row.category, Number(row.count)]),
  );

  return AUCTION_CATEGORIES
    .map((key) => ({
      key,
      activeCount: countByCategory.get(key) ?? 0,
    }))
    .filter((entry) => entry.activeCount > 0)
    .sort((a, b) => b.activeCount - a.activeCount);
}

function getPublicContact() {
  return {
    email: process.env.CONTACT_EMAIL || 'info@enderas.et',
    phone: process.env.CONTACT_PHONE || '+251 11 000 0000',
    address: process.env.CONTACT_ADDRESS || 'Addis Ababa, Ethiopia',
  };
}

/**
 * Full landing page payload — stats, listings, categories, hero lot, site metadata.
 */
export async function getPublicLandingPage() {
  const [stats, featured, categories, defaultCurrency] = await Promise.all([
    getPublicLandingStats(),
    getPublicFeaturedAuctions({ limit: 8 }),
    getPublishedCategoryCounts(),
    settingsService.getSetting('auction.default_currency'),
  ]);

  const featuredAuctions = (featured.items ?? []).map(sanitizePublicLandingAuction);
  const heroCandidates = featuredAuctions.filter((item) => item.imageUrl);
  const heroPool = heroCandidates.length > 0 ? heroCandidates : featuredAuctions;
  const heroLot = heroPool.length > 0
    ? heroPool[Math.floor(Math.random() * heroPool.length)]
    : null;

  return {
    stats: {
      ...stats,
      currency: stats.currency || defaultCurrency || 'ETB',
    },
    featuredAuctions,
    heroLot,
    categories,
    contact: getPublicContact(),
    generatedAt: new Date().toISOString(),
  };
}

export const publicLandingService = Object.freeze({
  getPublicLandingStats,
  getPublicFeaturedAuctions,
  getPublishedCategoryCounts,
  getPublicLandingPage,
});

export default publicLandingService;
