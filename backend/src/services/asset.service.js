import { Op } from 'sequelize';
import {
  Asset,
  ASSET_TYPES,
  ASSET_TYPE_OWNERSHIP_DOC,
  OWNERSHIP_DOCUMENT_TYPES,
} from '../models/asset.model.js';
import { AssetOwner } from '../models/assetOwner.model.js';
import { User, Staff } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { Auction } from '../models/auction.model.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { auctionService } from './auction.service.js';

const DISPLAY_STATUS_MAP = Object.freeze({
  pending_review: 'PENDING_REVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  under_evaluation: 'UNDER_EVALUATION',
  evaluated: 'EVALUATED',
  in_auction: 'IN_AUCTION',
  sold: 'SOLD',
});

const STATUS_FILTER_GROUPS = Object.freeze({
  PENDING_REVIEW: ['pending_review'],
  APPROVED: ['approved', 'in_auction'],
  REJECTED: ['rejected'],
  UNDER_EVALUATION: ['under_evaluation', 'evaluated', 'in_auction'],
});

function mapDisplayStatus(dbStatus) {
  return DISPLAY_STATUS_MAP[dbStatus] || String(dbStatus || '').toUpperCase();
}

function formatDateForList(date) {
  if (!date) {
    return '—';
  }
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTimeDetail(date) {
  if (!date) {
    return '—';
  }
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildUserDisplayName(user) {
  if (!user) {
    return null;
  }
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fullName || user.organization_name || user.mobile_number || null;
}

function buildStaffDisplayName(staff) {
  if (!staff?.user) {
    return staff?.employee_id || null;
  }
  return buildUserDisplayName(staff.user) || staff.employee_id || null;
}

function normalizeAdditionalDocuments(documents) {
  if (!Array.isArray(documents)) {
    return [];
  }
  return documents
    .filter((doc) => doc && typeof doc.url === 'string' && doc.url.length > 0)
    .map((doc) => ({
      name: doc.name || doc.fileName || 'document',
      url: doc.url,
      size: Number(doc.size) || 0,
    }));
}

function assertOwnershipDocMatchesType(assetType, ownershipDocumentType) {
  const expected = ASSET_TYPE_OWNERSHIP_DOC[assetType];
  if (!expected) {
    throw new AppError('Valid asset type is required', 400, 'INVALID_ASSET_TYPE');
  }
  if (ownershipDocumentType !== expected) {
    throw new AppError(
      'Ownership document type does not match asset type',
      400,
      'OWNERSHIP_DOC_MISMATCH',
    );
  }
}

function normalizeImageUrls(urls) {
  if (Array.isArray(urls)) {
    return urls.filter((url) => typeof url === 'string' && url.trim().length > 0);
  }

  if (typeof urls === 'string' && urls.trim()) {
    try {
      const parsed = JSON.parse(urls);
      if (Array.isArray(parsed)) {
        return parsed.filter((url) => typeof url === 'string' && url.trim().length > 0);
      }
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeStoredDocuments(documents) {
  if (typeof documents === 'string' && documents.trim()) {
    try {
      const parsed = JSON.parse(documents);
      return normalizeAdditionalDocuments(parsed);
    } catch {
      return [];
    }
  }

  return normalizeAdditionalDocuments(documents);
}

function validateCreateAssetPayload(payload) {
  validateAssetPayload(
    {
      title: payload.title,
      assetType: payload.assetType,
      ownershipDocumentType: payload.ownershipDocumentType,
      ownershipDocumentUrl: payload.ownershipDocumentUrl,
    },
    { requireOwnershipUrl: true },
  );

  if (!String(payload.description || '').trim()) {
    throw new AppError('Asset description is required', 400, 'DESCRIPTION_REQUIRED');
  }

  if (!String(payload.conditionNotes || '').trim()) {
    throw new AppError('Asset condition notes are required', 400, 'CONDITION_NOTES_REQUIRED');
  }

  if (!String(payload.location || '').trim()) {
    throw new AppError('Asset location is required', 400, 'LOCATION_REQUIRED');
  }

  const imageUrls = normalizeImageUrls(payload.imageUrls);
  if (!imageUrls.length) {
    throw new AppError('At least one asset photo is required', 400, 'PHOTOS_REQUIRED');
  }

  const reserve = Number(payload.desiredReservePrice);
  if (!Number.isFinite(reserve) || reserve <= 0) {
    throw new AppError('Desired reserve price is required', 400, 'RESERVE_PRICE_REQUIRED');
  }

  if (!String(payload.auctionConditions || '').trim()) {
    throw new AppError('Auction conditions are required', 400, 'AUCTION_CONDITIONS_REQUIRED');
  }

  const additionalDocuments = normalizeAdditionalDocuments(payload.additionalDocuments);
  if (!additionalDocuments.length) {
    throw new AppError('At least one supporting PDF is required', 400, 'SUPPORTING_DOCS_REQUIRED');
  }
}

function validateAssetPayload(payload, { requireOwnershipUrl = false } = {}) {
  if (payload.title !== undefined && !String(payload.title).trim()) {
    throw new AppError('Asset title is required', 400, 'TITLE_REQUIRED');
  }

  if (payload.assetType !== undefined && !ASSET_TYPES.includes(payload.assetType)) {
    throw new AppError('Valid asset type is required', 400, 'INVALID_ASSET_TYPE');
  }

  if (payload.ownershipDocumentType !== undefined
    && !OWNERSHIP_DOCUMENT_TYPES.includes(payload.ownershipDocumentType)) {
    throw new AppError('Valid ownership document type is required', 400, 'INVALID_OWNERSHIP_DOC');
  }

  if (payload.assetType && payload.ownershipDocumentType) {
    assertOwnershipDocMatchesType(payload.assetType, payload.ownershipDocumentType);
  }

  if (requireOwnershipUrl) {
    const url = payload.ownershipDocumentUrl;
    if (!url || typeof url !== 'string' || !url.trim()) {
      throw new AppError('Ownership document is required', 400, 'OWNERSHIP_DOC_REQUIRED');
    }
    if (url.startsWith('data:')) {
      throw new AppError('Upload ownership document via file service', 400, 'INVALID_DOCUMENT_URL');
    }
  }
}

const assetInclude = [
  {
    model: AssetOwner,
    as: 'assetOwner',
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'organization_name', 'mobile_number', 'user_type'] }],
  },
  {
    model: Staff,
    as: 'reviewedByStaff',
    required: false,
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'mobile_number'] }],
  },
];

async function attachLinkedAuctions(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return items;
  }

  const assetIds = items.map((item) => item.id);
  const auctions = await Auction.findAll({
    where: { asset_id: { [Op.in]: assetIds }, deleted_at: null },
    attributes: ['id', 'asset_id', 'title', 'status'],
  });

  const auctionByAssetId = new Map(auctions.map((row) => [row.asset_id, row]));

  return items.map((item) => {
    const auction = auctionByAssetId.get(item.id);
    if (!auction) {
      return item;
    }

    return {
      ...item,
      auctionId: auction.id,
      auctionTitle: auction.title,
      auctionStatus: auctionService.mapDisplayStatus(auction.status),
    };
  });
}

function serializeAsset(asset) {
  const plain = asset.get ? asset.get({ plain: true }) : asset;
  const ownerUser = plain.assetOwner?.user;

  return {
    id: plain.id,
    title: plain.title,
    assetType: plain.asset_type,
    category: plain.asset_type,
    description: plain.description,
    conditionNotes: plain.condition_notes,
    location: plain.location,
    address: plain.address,
    imageUrls: normalizeImageUrls(plain.image_urls),
    desiredReservePrice: plain.desired_reserve_price != null
      ? Number(plain.desired_reserve_price)
      : null,
    auctionConditions: plain.auction_conditions,
    ownershipDocumentType: plain.ownership_document_type,
    ownershipDocumentUrl: plain.ownership_document_url,
    additionalDocuments: normalizeStoredDocuments(plain.additional_document_urls),
    status: mapDisplayStatus(plain.status),
    dbStatus: plain.status,
    rejectionReason: plain.rejection_reason,
    ownerName: buildUserDisplayName(ownerUser),
    ownerMobile: ownerUser?.mobile_number ?? null,
    ownerId: plain.asset_owner_id,
    submittedAt: plain.created_at,
    submittedAtFormatted: formatDateForList(plain.created_at),
    reviewedAt: plain.reviewed_at,
    reviewedAtFormatted: formatDateTimeDetail(plain.reviewed_at),
    reviewedByName: buildStaffDisplayName(plain.reviewedByStaff),
    createdAt: plain.created_at,
    updatedAt: plain.updated_at,
  };
}

/**
 * @param {string} userId
 */
export async function findOrCreateAssetOwner(userId) {
  let owner = await AssetOwner.findOne({ where: { user_id: userId, deleted_at: null } });

  if (owner) {
    return owner;
  }

  const user = await User.findByPk(userId, {
    attributes: ['id', 'mobile_number'],
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  owner = await AssetOwner.create({
    id: generateUuid(),
    user_id: userId,
    contact_phone: user.mobile_number || null,
    status: 'active',
  });

  return owner;
}

/**
 * @param {object} scope
 * @param {string} userId
 */
async function assertAssetAccess(asset, scope, userId) {
  if (scope?.isWildcard || scope?.isStaff) {
    return;
  }

  const owner = await AssetOwner.findOne({
    where: { user_id: userId, deleted_at: null },
    attributes: ['id'],
  });

  if (!owner || asset.asset_owner_id !== owner.id) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }
}

async function findAssetOrThrow(id) {
  const asset = await Asset.findOne({
    where: { id, deleted_at: null },
    include: assetInclude,
  });

  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }

  return asset;
}

/**
 * @param {string} userId
 * @param {object} payload
 */
export async function createAsset(userId, payload) {
  const {
    title,
    assetType,
    description,
    conditionNotes,
    location,
    address,
    imageUrls,
    desiredReservePrice,
    auctionConditions,
    ownershipDocumentType,
    ownershipDocumentUrl,
    additionalDocuments,
  } = payload;

  validateCreateAssetPayload({
    title,
    assetType,
    description,
    conditionNotes,
    location,
    ownershipDocumentType,
    ownershipDocumentUrl,
    imageUrls,
    desiredReservePrice,
    auctionConditions,
    additionalDocuments,
  });

  const owner = await findOrCreateAssetOwner(userId);
  const resolvedDocType = ownershipDocumentType || ASSET_TYPE_OWNERSHIP_DOC[assetType];
  assertOwnershipDocMatchesType(assetType, resolvedDocType);

  const asset = await Asset.create({
    id: generateUuid(),
    asset_owner_id: owner.id,
    asset_type: assetType,
    title: title.trim(),
    description: description.trim(),
    condition_notes: conditionNotes.trim(),
    location: location.trim(),
    address: address?.trim() || null,
    image_urls: normalizeImageUrls(imageUrls),
    desired_reserve_price: Number(desiredReservePrice),
    auction_conditions: auctionConditions.trim(),
    ownership_document_type: resolvedDocType,
    ownership_document_url: ownershipDocumentUrl.trim(),
    additional_document_urls: normalizeAdditionalDocuments(additionalDocuments),
    status: 'pending_review',
  });

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Asset',
    entityId: asset.id,
    metadata: { title: asset.title, assetType: asset.asset_type },
  });

  return serializeAsset(await findAssetOrThrow(asset.id));
}

/**
 * @param {{ status?: string, search?: string, includeStats?: boolean }} options
 * @param {{ isStaff?: boolean, isWildcard?: boolean, userId?: string }} scope
 */
export async function listAssets(options = {}, scope = {}) {
  const where = { deleted_at: null };
  const include = [...assetInclude];

  if (!scope.isStaff && !scope.isWildcard && scope.userId) {
    const owner = await AssetOwner.findOne({
      where: { user_id: scope.userId, deleted_at: null },
      attributes: ['id'],
    });

    if (!owner) {
      return { items: [], stats: options.includeStats ? buildEmptyStats() : undefined };
    }

    where.asset_owner_id = owner.id;
  }

  if (options.status) {
    const filter = String(options.status).toUpperCase();
    const statuses = STATUS_FILTER_GROUPS[filter];
    if (statuses) {
      where.status = { [Op.in]: statuses };
    }
  }

  if (options.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { location: { [Op.like]: term } },
      { description: { [Op.like]: term } },
    ];
  }

  const assets = await Asset.findAll({
    where,
    include,
    order: [['created_at', 'DESC']],
  });

  let items = assets.map(serializeAsset);
  items = await attachLinkedAuctions(items);

  const result = { items };

  if (options.includeStats) {
    result.stats = await computeStats(scope);
  }

  return result;
}

function buildEmptyStats() {
  return {
    pending_review: 0,
    approved: 0,
    rejected: 0,
    under_evaluation: 0,
  };
}

/**
 * @param {{ isStaff?: boolean, isWildcard?: boolean, userId?: string }} scope
 */
async function computeStats(scope) {
  const where = { deleted_at: null };

  if (!scope.isStaff && !scope.isWildcard && scope.userId) {
    const owner = await AssetOwner.findOne({
      where: { user_id: scope.userId, deleted_at: null },
      attributes: ['id'],
    });
    if (!owner) {
      return buildEmptyStats();
    }
    where.asset_owner_id = owner.id;
  }

  const rows = await Asset.findAll({
    where,
    attributes: ['status'],
    raw: true,
  });

  const stats = buildEmptyStats();
  rows.forEach((row) => {
    if (row.status === 'pending_review') stats.pending_review++;
    else if (row.status === 'approved') stats.approved++;
    else if (row.status === 'rejected') stats.rejected++;
    else if (['under_evaluation', 'evaluated', 'in_auction'].includes(row.status)) {
      stats.under_evaluation++;
    }
  });

  return stats;
}

/**
 * @param {string} id
 * @param {object} scope
 * @param {string} userId
 */
export async function getAssetById(id, scope, userId) {
  const asset = await findAssetOrThrow(id);
  await assertAssetAccess(asset, scope, userId);
  const [enriched] = await attachLinkedAuctions([serializeAsset(asset)]);
  return enriched;
}

/**
 * @param {string} id
 * @param {string} userId
 * @param {object} payload
 * @param {object} scope
 */
export async function updateAsset(id, userId, payload, scope) {
  const asset = await findAssetOrThrow(id);
  await assertAssetAccess(asset, scope, userId);

  if (scope.isStaff || scope.isWildcard) {
    throw new AppError('Staff cannot update asset via this endpoint', 403, 'FORBIDDEN');
  }

  if (asset.status !== 'pending_review') {
    throw new AppError('Asset cannot be edited in its current status', 400, 'ASSET_NOT_EDITABLE');
  }

  validateAssetPayload(payload);

  const updates = {};

  if (payload.title !== undefined) updates.title = payload.title.trim();
  if (payload.assetType !== undefined) updates.asset_type = payload.assetType;
  if (payload.description !== undefined) updates.description = payload.description?.trim() || null;
  if (payload.conditionNotes !== undefined) {
    updates.condition_notes = payload.conditionNotes?.trim() || null;
  }
  if (payload.location !== undefined) updates.location = payload.location?.trim() || null;
  if (payload.address !== undefined) updates.address = payload.address?.trim() || null;
  if (payload.imageUrls !== undefined) {
    updates.image_urls = normalizeImageUrls(payload.imageUrls);
  }
  if (payload.desiredReservePrice !== undefined) {
    updates.desired_reserve_price = Number(payload.desiredReservePrice);
  }
  if (payload.auctionConditions !== undefined) {
    updates.auction_conditions = payload.auctionConditions?.trim() || null;
  }
  if (payload.ownershipDocumentType !== undefined) {
    updates.ownership_document_type = payload.ownershipDocumentType;
  }
  if (payload.ownershipDocumentUrl !== undefined) {
    updates.ownership_document_url = payload.ownershipDocumentUrl.trim();
  }
  if (payload.additionalDocuments !== undefined) {
    updates.additional_document_urls = normalizeAdditionalDocuments(payload.additionalDocuments);
  }

  const nextType = updates.asset_type ?? asset.asset_type;
  const nextDocType = updates.ownership_document_type ?? asset.ownership_document_type;
  if (nextType && nextDocType) {
    assertOwnershipDocMatchesType(nextType, nextDocType);
  }

  await asset.update(updates);

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Asset',
    entityId: asset.id,
    metadata: { title: asset.title },
  });

  return getAssetById(id, scope, userId);
}

/**
 * @param {string} id
 * @param {string} staffId
 * @param {string|null} reviewNotes
 */
export async function approveAsset(id, staffId, reviewNotes = null) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const asset = await findAssetOrThrow(id);

  if (asset.status !== 'pending_review') {
    throw new AppError('Asset is not pending review', 400, 'INVALID_ASSET_STATUS');
  }

  const now = new Date();
  await asset.update({
    reviewed_by_staff_id: staffId,
    reviewed_at: now,
    rejection_reason: null,
  });

  const auction = await auctionService.createPublishedAuctionFromApprovedAsset(asset, staffId);

  await asset.update({ status: 'in_auction' });

  const owner = await AssetOwner.findByPk(asset.asset_owner_id, { attributes: ['user_id'] });

  await auditService.writeAuditLog({
    staffId,
    userId: owner?.user_id ?? null,
    action: AUDIT_ACTIONS.APPROVE,
    entityType: 'Asset',
    entityId: asset.id,
    metadata: { reviewNotes, auctionId: auction.id },
    newValues: { status: 'in_auction' },
  });

  if (owner?.user_id) {
    await notificationService.sendAssetApproved(owner.user_id);
  }

  return getAssetById(id, { isStaff: true }, null);
}

/**
 * @param {string} id
 * @param {string} staffId
 * @param {string} rejectionReason
 */
export async function rejectAsset(id, staffId, rejectionReason) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const reason = rejectionReason?.trim();
  if (!reason) {
    throw new AppError('Rejection reason is required', 400, 'REJECTION_REASON_REQUIRED');
  }

  const asset = await findAssetOrThrow(id);

  if (asset.status !== 'pending_review') {
    throw new AppError('Asset is not pending review', 400, 'INVALID_ASSET_STATUS');
  }

  const now = new Date();
  await asset.update({
    status: 'rejected',
    reviewed_by_staff_id: staffId,
    reviewed_at: now,
    rejection_reason: reason,
  });

  const owner = await AssetOwner.findByPk(asset.asset_owner_id, { attributes: ['user_id'] });

  await auditService.writeAuditLog({
    staffId,
    userId: owner?.user_id ?? null,
    action: AUDIT_ACTIONS.REJECT,
    entityType: 'Asset',
    entityId: asset.id,
    metadata: { rejectionReason: reason },
    newValues: { status: 'rejected' },
  });

  if (owner?.user_id) {
    await notificationService.sendAssetRejected(owner.user_id, reason);
  }

  return getAssetById(id, { isStaff: true }, null);
}

export const assetService = Object.freeze({
  findOrCreateAssetOwner,
  createAsset,
  listAssets,
  getAssetById,
  updateAsset,
  approveAsset,
  rejectAsset,
});

export default assetService;
