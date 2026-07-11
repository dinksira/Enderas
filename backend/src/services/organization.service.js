import { Op } from 'sequelize';
import { User, Role, AssetOwner, Asset, Auction, OrganizationAuction } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { hashPassword } from '../utils/password.util.js';
import { getMobileLookupCandidates, resolveMobileForStorage } from '../utils/mobile.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { USER_STATUSES } from './kyc.service.js';

const BIDDER_ROLE_CODE = 'bidder';

function buildDisplayName(user) {
  if (!user) return null;
  return user.organization_name || [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.mobile_number || null;
}

export function serializeOrgListRow(user) {
  return {
    id: user.id,
    organizationName: user.organization_name,
    tinNumber: user.tin_number,
    mobileNumber: user.mobile_number,
    email: user.email,
    status: user.status,
    preferredLanguage: user.preferred_language,
    createdAt: user.created_at,
  };
}

export function serializeOrgDetail(user) {
  return {
    id: user.id,
    organizationName: user.organization_name,
    tinNumber: user.tin_number,
    mobileNumber: user.mobile_number,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    displayPassword: user.display_password || undefined,
    status: user.status,
    preferredLanguage: user.preferred_language,
    isMobileVerified: user.is_mobile_verified,
    isEmailVerified: user.is_email_verified,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    roleId: user.role_id,
    roleCode: user.role?.code ?? null,
    roleName: user.role?.name ?? null,
  };
}

const orgIncludes = [
  {
    model: Role,
    as: 'role',
    attributes: ['id', 'name', 'code'],
  },
];

async function fetchOrgStats() {
  const [active, kycPending, suspended] = await Promise.all([
    User.count({ where: { user_type: 'organization', status: 'active', deleted_at: null } }),
    User.count({ where: { user_type: 'organization', status: 'kyc_pending', deleted_at: null } }),
    User.count({ where: { user_type: 'organization', status: 'suspended', deleted_at: null } }),
  ]);

  return { all: active + kycPending + suspended, active, kyc_pending: kycPending, suspended };
}

export async function listOrganizations(options = {}) {
  const {
    page = 1,
    limit = 20,
    search = null,
    status = null,
    includeStats = false,
  } = options;

  const where = { user_type: 'organization' };

  if (status) {
    where.status = status;
  }

  if (search) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { organization_name: { [Op.like]: term } },
      { tin_number: { [Op.like]: term } },
      { mobile_number: { [Op.like]: term } },
      { email: { [Op.like]: term } },
      { first_name: { [Op.like]: term } },
      { last_name: { [Op.like]: term } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    include: orgIncludes,
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });

  const result = {
    organizations: rows.map(serializeOrgListRow),
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit) || 1,
    },
  };

  if (includeStats) {
    result.stats = await fetchOrgStats();
  }

  return result;
}

export async function getOrgStats() {
  return fetchOrgStats();
}

export async function getOrganizationById(id) {
  const user = await User.scope('withDisplayPassword').findByPk(id, {
    include: orgIncludes,
  });

  if (!user) {
    throw new AppError('Organization not found', 404, 'ORG_NOT_FOUND');
  }

  return serializeOrgDetail(user);
}

export async function createOrganization(payload, actorStaffId) {
  const {
    organizationName,
    tinNumber,
    mobileNumber,
    email,
    firstName,
    lastName,
    password,
    preferredLanguage = 'en',
  } = payload;

  if (!organizationName) {
    throw new AppError('Organization name is required', 400, 'VALIDATION_ERROR');
  }

  if (!mobileNumber || !password) {
    throw new AppError('Mobile number and password are required', 400, 'VALIDATION_ERROR');
  }

  const normalizedMobile = resolveMobileForStorage(mobileNumber);
  const lookupCandidates = getMobileLookupCandidates(normalizedMobile);
  const existingUser = await User.unscoped().findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      deleted_at: null,
    },
  });

  if (existingUser) {
    throw new AppError('Mobile number already registered', 400, 'DUPLICATE_MOBILE');
  }

  const normalizedEmail = email?.trim() || null;
  if (normalizedEmail) {
    const existingEmailUser = await User.unscoped().findOne({
      where: { email: normalizedEmail, deleted_at: null },
    });
    if (existingEmailUser) {
      throw new AppError('Email address already registered', 400, 'DUPLICATE_EMAIL');
    }
  }

  if (tinNumber) {
    const existingTinUser = await User.unscoped().findOne({
      where: { tin_number: tinNumber, deleted_at: null },
    });
    if (existingTinUser) {
      throw new AppError('TIN number already registered', 400, 'DUPLICATE_TIN');
    }
  }

  let roleId = payload.roleId;
  if (!roleId) {
    const defaultRole = await Role.findOne({
      where: { code: BIDDER_ROLE_CODE, is_active: true },
      attributes: ['id'],
    });
    if (defaultRole) {
      roleId = defaultRole.id;
    } else {
      throw new AppError('Default bidder role not found. Contact administrator.', 500, 'ROLE_NOT_FOUND');
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    id: generateUuid(),
    user_type: 'organization',
    mobile_number: normalizedMobile,
    email: normalizedEmail,
    password: hashedPassword,
    display_password: password,
    organization_name: organizationName,
    tin_number: tinNumber || null,
    first_name: firstName || null,
    last_name: lastName || null,
    preferred_language: preferredLanguage,
    is_mobile_verified: true,
    is_email_verified: false,
    status: USER_STATUSES.ACTIVE,
    failed_login_attempts: 0,
    role_id: roleId,
  });

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Organization',
    entityId: user.id,
    newValues: {
      organization_name: organizationName,
      tin_number: tinNumber || null,
      mobile_number: normalizedMobile,
      email: normalizedEmail,
    },
  });

  return serializeOrgDetail(user);
}

export async function updateOrganization(id, payload, actorStaffId) {
  const user = await User.findByPk(id);

  if (!user) {
    throw new AppError('Organization not found', 404, 'ORG_NOT_FOUND');
  }

  if (user.user_type !== 'organization') {
    throw new AppError('User is not an organization', 400, 'NOT_ORGANIZATION');
  }

  const oldValues = {
    organization_name: user.organization_name,
    tin_number: user.tin_number,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    status: user.status,
  };

  const updates = {};

  if (payload.organizationName !== undefined) {
    updates.organization_name = payload.organizationName;
  }

  if (payload.tinNumber !== undefined) {
    if (payload.tinNumber) {
      const duplicate = await User.unscoped().findOne({
        where: {
          tin_number: payload.tinNumber,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });
      if (duplicate) {
        throw new AppError('TIN number already in use', 400, 'DUPLICATE_TIN');
      }
    }
    updates.tin_number = payload.tinNumber || null;
  }

  if (payload.email !== undefined) {
    const normalizedEmail = payload.email?.trim() || null;
    if (normalizedEmail) {
      const duplicate = await User.unscoped().findOne({
        where: { email: normalizedEmail, id: { [Op.ne]: id }, deleted_at: null },
      });
      if (duplicate) {
        throw new AppError('Email address already registered', 400, 'DUPLICATE_EMAIL');
      }
    }
    updates.email = normalizedEmail;
  }

  if (payload.firstName !== undefined) {
    updates.first_name = payload.firstName || null;
  }

  if (payload.lastName !== undefined) {
    updates.last_name = payload.lastName || null;
  }

  if (payload.preferredLanguage !== undefined) {
    updates.preferred_language = payload.preferredLanguage || 'en';
  }

  if (payload.password) {
    updates.password = await hashPassword(payload.password);
    updates.display_password = payload.password;
  }

  if (payload.status !== undefined) {
    updates.status = payload.status;
  }

  if (Object.keys(updates).length === 0) {
    return serializeOrgDetail(user);
  }

  await user.update(updates);

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Organization',
    entityId: user.id,
    oldValues,
    newValues: updates,
  });

  return serializeOrgDetail(user);
}

export async function deleteOrganization(id, actorStaffId) {
  const user = await User.findByPk(id);

  if (!user) {
    throw new AppError('Organization not found', 404, 'ORG_NOT_FOUND');
  }

  if (user.user_type !== 'organization') {
    throw new AppError('User is not an organization', 400, 'NOT_ORGANIZATION');
  }

  await user.destroy();

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'Organization',
    entityId: id,
    oldValues: {
      organization_name: user.organization_name,
      tin_number: user.tin_number,
      mobile_number: user.mobile_number,
    },
  });

  return { deleted: true, id };
}

export async function getOrganizationPortal(userId) {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: AssetOwner,
        as: 'assetOwnerProfile',
        include: [
          {
            model: Asset,
            as: 'assets',
            required: false,
            where: { deleted_at: null },
            include: [
              {
                model: Auction,
                as: 'auction',
                attributes: ['id', 'title', 'status', 'start_date', 'end_date', 'reserve_price', 'currency'],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!user || user.user_type !== 'organization') {
    throw new AppError('Organization not found', 404, 'ORG_NOT_FOUND');
  }

  const [linkedAuctions, portalAssets] = await Promise.all([
    OrganizationAuction.findAll({
      where: { organization_user_id: userId },
      include: [
        {
          model: Auction,
          as: 'auction',
          attributes: ['id', 'title', 'status', 'start_date', 'end_date', 'reserve_price', 'currency', 'published_at'],
        },
      ],
      order: [['created_at', 'DESC']],
    }),
    (user.assetOwnerProfile
      ? Asset.findAll({
          where: { asset_owner_id: user.assetOwnerProfile.id, deleted_at: null },
          include: [
            {
              model: Auction,
              as: 'auction',
              attributes: ['id', 'title', 'status', 'start_date', 'end_date', 'reserve_price', 'currency'],
            },
          ],
          order: [['created_at', 'DESC']],
        })
      : Promise.resolve([])),
  ]);

  const activeLinkedAuctions = linkedAuctions.filter(
    (l) => l.auction && l.auction.status === 'published',
  );

  const activeAuctionAssets = portalAssets.filter(
    (a) => a.auction && ['published', 'pending_approval'].includes(a.auction.status),
  );

  const stats = {
    totalAssets: portalAssets.length,
    inAuction: portalAssets.filter((a) => a.status === 'in_auction').length,
    sold: portalAssets.filter((a) => a.status === 'sold').length,
    pendingReview: portalAssets.filter((a) => a.status === 'pending_review').length,
    activeAuctions: activeAuctionAssets.length,
    linkedAuctions: linkedAuctions.length,
    activeLinkedAuctions: activeLinkedAuctions.length,
  };

  return {
    profile: {
      id: user.id,
      organizationName: user.organization_name,
      tinNumber: user.tin_number,
      mobileNumber: user.mobile_number,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      status: user.status,
      preferredLanguage: user.preferred_language,
      createdAt: user.created_at,
    },
    stats,
    assets: portalAssets.map((a) => ({
      id: a.id,
      title: a.title,
      assetType: a.asset_type,
      status: a.status,
      desiredReservePrice: a.desired_reserve_price,
      createdAt: a.created_at,
      auction: a.auction
        ? {
            id: a.auction.id,
            title: a.auction.title,
            status: a.auction.status,
            startDate: a.auction.start_date,
            endDate: a.auction.end_date,
            reservePrice: a.auction.reserve_price,
            currency: a.auction.currency,
          }
        : null,
    })),
    linkedAuctions: linkedAuctions
      .filter((l) => l.auction)
      .map((l) => ({
        id: l.auction.id,
        title: l.auction.title,
        status: l.auction.status,
        startDate: l.auction.start_date,
        endDate: l.auction.end_date,
        reservePrice: l.auction.reserve_price,
        currency: l.auction.currency,
        publishedAt: l.auction.published_at,
        linkedAt: l.createdAt,
      })),
  };
}

export async function getOrganizationActiveAuctions(orgId) {
  const user = await User.findByPk(orgId, {
    include: [
      {
        model: AssetOwner,
        as: 'assetOwnerProfile',
        attributes: ['id'],
      },
    ],
  });

  if (!user || user.user_type !== 'organization') {
    throw new AppError('Organization not found', 404, 'ORG_NOT_FOUND');
  }

  if (!user.assetOwnerProfile) {
    return { assets: [], auctions: [] };
  }

  const assets = await Asset.findAll({
    where: {
      asset_owner_id: user.assetOwnerProfile.id,
      deleted_at: null,
      status: 'in_auction',
    },
    include: [
      {
        model: Auction,
        as: 'auction',
        attributes: ['id', 'title', 'status', 'start_date', 'end_date', 'reserve_price', 'currency', 'published_at'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  const activeAssets = assets.filter(a => a.auction && a.auction.status === 'published');

  return {
    assets: activeAssets.map(a => ({
      id: a.id,
      title: a.title,
      assetType: a.asset_type,
      status: a.status,
      desiredReservePrice: a.desired_reserve_price,
      createdAt: a.created_at,
      auction: {
        id: a.auction.id,
        title: a.auction.title,
        status: a.auction.status,
        startDate: a.auction.start_date,
        endDate: a.auction.end_date,
        reservePrice: a.auction.reserve_price,
        currency: a.auction.currency,
        publishedAt: a.auction.published_at,
      },
    })),
    auctions: [...new Set(activeAssets.map(a => a.auction.id))].map(aucId => {
      const first = activeAssets.find(a => a.auction.id === aucId);
      return {
        id: first.auction.id,
        title: first.auction.title,
        status: first.auction.status,
        startDate: first.auction.start_date,
        endDate: first.auction.end_date,
        assetCount: activeAssets.filter(a => a.auction.id === aucId).length,
      };
    }),
  };
}

export async function getOrganizationPortalAssets(userId) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'user_type'],
    include: [
      {
        model: AssetOwner,
        as: 'assetOwnerProfile',
        attributes: ['id'],
      },
    ],
  });

  if (!user || user.user_type !== 'organization') {
    throw new AppError('Organization not found', 404, 'ORG_NOT_FOUND');
  }

  if (!user.assetOwnerProfile) {
    return { assets: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
  }

  const assets = await Asset.findAll({
    where: { asset_owner_id: user.assetOwnerProfile.id, deleted_at: null },
    include: [
      {
        model: Auction,
        as: 'auction',
        attributes: ['id', 'title', 'status', 'start_date', 'end_date', 'reserve_price', 'currency'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  return {
    assets: assets.map(a => ({
      id: a.id,
      title: a.title,
      assetType: a.asset_type,
      status: a.status,
      desiredReservePrice: a.desired_reserve_price,
      createdAt: a.created_at,
      auction: a.auction ? {
        id: a.auction.id,
        title: a.auction.title,
        status: a.auction.status,
        startDate: a.auction.start_date,
        endDate: a.auction.end_date,
        reservePrice: a.auction.reserve_price,
        currency: a.auction.currency,
      } : null,
    })),
    pagination: { page: 1, limit: 50, total: assets.length, pages: 1 },
  };
}

export const organizationService = Object.freeze({
  listOrganizations,
  getOrgStats,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationPortal,
  getOrganizationPortalAssets,
  getOrganizationActiveAuctions,
  serializeOrgListRow,
  serializeOrgDetail,
});

export default organizationService;
