import { Op } from 'sequelize';
import {
  User,
  Role,
  Staff,
  KYCVerification,
  AssetOwner,
  RefreshToken,
} from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { hashPassword } from '../utils/password.util.js';
import { getMobileLookupCandidates, resolveMobileForStorage } from '../utils/mobile.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { USER_STATUSES } from './kyc.service.js';
import { isAssignableEndUserRoleCode } from '../constants/end-user-role.constants.js';

const STAFF_ROLE_CODES = Object.freeze([
  'super_admin',
  'auction_manager',
  'evaluation_officer',
  'finance_officer',
  'customer_service_officer',
]);

const USER_LIST_TABS = Object.freeze({
  ALL: 'all',
  ACTIVE: 'active',
  KYC_PENDING: 'kyc_pending',
  KYC_UNDER_REVIEW: 'kyc_under_review',
  KYC_REJECTED: 'kyc_rejected',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
});

function buildDisplayName(user) {
  if (!user) return null;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fullName || user.organization_name || user.mobile_number || null;
}

function buildTabWhere(tab) {
  if (!tab || tab === USER_LIST_TABS.ALL) {
    return {};
  }

  const statusMap = {
    [USER_LIST_TABS.ACTIVE]: USER_STATUSES.ACTIVE,
    [USER_LIST_TABS.KYC_PENDING]: USER_STATUSES.KYC_PENDING,
    [USER_LIST_TABS.KYC_UNDER_REVIEW]: USER_STATUSES.KYC_UNDER_REVIEW,
    [USER_LIST_TABS.KYC_REJECTED]: USER_STATUSES.KYC_REJECTED,
    [USER_LIST_TABS.SUSPENDED]: USER_STATUSES.SUSPENDED,
    [USER_LIST_TABS.DEACTIVATED]: USER_STATUSES.DEACTIVATED,
  };

  if (statusMap[tab]) {
    return { status: statusMap[tab] };
  }

  return {};
}

/**
 * @param {import('express').Request|{ dataScope?: object }} req
 * @param {object} filters
 */
export function buildUserListWhere(req, filters = {}) {
  const scope = req.dataScope ?? {};
  const where = { ...buildTabWhere(filters.tab) };

  if (filters.status && !filters.tab) {
    where.status = filters.status;
  }

  if (filters.userType) {
    where.user_type = filters.userType;
  }

  if (!scope.isWildcard && !scope.isStaff && scope.userId) {
    where.id = scope.userId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.created_at = {};
    if (filters.dateFrom) {
      where.created_at[Op.gte] = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = end;
    }
  }

  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    where[Op.or] = [
      { first_name: { [Op.like]: term } },
      { last_name: { [Op.like]: term } },
      { mobile_number: { [Op.like]: term } },
      { email: { [Op.like]: term } },
      { organization_name: { [Op.like]: term } },
    ];
  }

  return where;
}

export function serializeUserListRow(user) {
  const kyc = user.kycVerification;
  return {
    id: user.id,
    displayName: buildDisplayName(user),
    mobileNumber: user.mobile_number,
    email: user.email,
    userType: user.user_type,
    status: user.status,
    roleCode: user.role?.code ?? null,
    roleName: user.role?.name ?? null,
    kycStatus: kyc?.status ?? null,
    registeredAt: user.created_at,
    lastLoginAt: user.last_login_at,
  };
}

export function serializeUserDetail(user) {
  const kyc = user.kycVerification;
  const assetOwner = user.assetOwnerProfile;
  const staffProfile = user.staffProfile;

  return {
    id: user.id,
    displayName: buildDisplayName(user),
    mobileNumber: user.mobile_number,
    email: user.email,
    userType: user.user_type,
    status: user.status,
    firstName: user.first_name,
    lastName: user.last_name,
    organizationName: user.organization_name,
    preferredLanguage: user.preferred_language,
    isMobileVerified: user.is_mobile_verified,
    isEmailVerified: user.is_email_verified,
    roleId: user.role_id,
    roleCode: user.role?.code ?? null,
    roleName: user.role?.name ?? null,
    registeredAt: user.created_at,
    lastLoginAt: user.last_login_at,
    isStaff: Boolean(staffProfile),
    staffId: staffProfile?.id ?? null,
    kyc: kyc
      ? {
          id: kyc.id,
          status: kyc.status,
          documentType: kyc.document_type,
          reviewedAt: kyc.reviewed_at,
          underReviewAt: kyc.under_review_at,
        }
      : null,
    assetOwner: assetOwner
      ? {
          id: assetOwner.id,
          status: assetOwner.status,
          city: assetOwner.city,
          region: assetOwner.region,
        }
      : null,
  };
}

async function fetchUserStats() {
  const statuses = Object.values(USER_STATUSES);
  const counts = await Promise.all(
    statuses.map((status) => User.count({ where: { status } })),
  );

  const byStatus = statuses.reduce((acc, status, index) => {
    acc[status] = counts[index];
    return acc;
  }, {});

  return {
    all: await User.count(),
    active: byStatus[USER_STATUSES.ACTIVE] ?? 0,
    kyc_pending: byStatus[USER_STATUSES.KYC_PENDING] ?? 0,
    kyc_under_review: byStatus[USER_STATUSES.KYC_UNDER_REVIEW] ?? 0,
    kyc_rejected: byStatus[USER_STATUSES.KYC_REJECTED] ?? 0,
    suspended: byStatus[USER_STATUSES.SUSPENDED] ?? 0,
    deactivated: byStatus[USER_STATUSES.DEACTIVATED] ?? 0,
  };
}

async function loadUserById(id, { includeKyc = true, includeAssetOwner = true } = {}) {
  const include = [
    {
      model: Role,
      as: 'role',
      attributes: ['id', 'name', 'code'],
    },
    {
      model: Staff,
      as: 'staffProfile',
      attributes: ['id', 'is_active'],
      required: false,
    },
  ];

  if (includeKyc) {
    include.push({
      model: KYCVerification,
      as: 'kycVerification',
      required: false,
    });
  }

  if (includeAssetOwner) {
    include.push({
      model: AssetOwner,
      as: 'assetOwnerProfile',
      required: false,
    });
  }

  return User.findByPk(id, { include });
}

async function assertNonStaffUser(user) {
  const staffProfile = await Staff.findOne({
    where: { user_id: user.id, deleted_at: null },
  });

  if (staffProfile) {
    throw new AppError('Staff users must be managed via staff module', 400, 'STAFF_USER_IMMUTABLE');
  }
}

async function revokeUserRefreshTokens(userId) {
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { user_id: userId, revoked_at: null } },
  );
}

/**
 * @param {object} options
 * @param {import('express').Request|{ dataScope?: object }} req
 */
export async function listUsers(options = {}, req = {}) {
  const {
    page = 1,
    limit = 20,
    tab = null,
    status = null,
    userType = null,
    search = null,
    dateFrom = null,
    dateTo = null,
    includeStats = false,
  } = options;

  const where = buildUserListWhere(req, { tab, status, userType, search, dateFrom, dateTo });

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: KYCVerification,
        as: 'kycVerification',
        attributes: ['id', 'status'],
        required: false,
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  const result = {
    users: rows.map(serializeUserListRow),
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit) || 1,
    },
  };

  if (includeStats) {
    result.stats = await fetchUserStats();
  }

  return result;
}

export async function getUserStats() {
  return fetchUserStats();
}

export async function getUserById(id, options = {}) {
  const user = await loadUserById(id, options);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return serializeUserDetail(user);
}

export async function createUser(payload, actorStaffId) {
  const {
    mobileNumber,
    password,
    roleId,
    userType = 'individual',
    firstName,
    lastName,
    email,
    organizationName,
    preferredLanguage = 'en',
    status = USER_STATUSES.ACTIVE,
  } = payload;

  if (!mobileNumber || !password || !roleId) {
    throw new AppError('Mobile number, password, and role are required', 400, 'VALIDATION_ERROR');
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

  const role = await Role.findOne({ where: { id: roleId, is_active: true } });
  if (!role) {
    throw new AppError('Role not found or inactive', 404, 'ROLE_NOT_FOUND');
  }

  if (STAFF_ROLE_CODES.includes(role.code) || !isAssignableEndUserRoleCode(role.code)) {
    throw new AppError(
      'Only the bidder role can be assigned to new users',
      400,
      'INVALID_USER_ROLE',
    );
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    id: generateUuid(),
    role_id: roleId,
    user_type: userType,
    mobile_number: normalizedMobile,
    email: email || null,
    password: hashedPassword,
    first_name: firstName || null,
    last_name: lastName || null,
    organization_name: organizationName || null,
    preferred_language: preferredLanguage,
    is_mobile_verified: true,
    is_email_verified: false,
    status,
    failed_login_attempts: 0,
  });

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'User',
    entityId: user.id,
    newValues: {
      mobile_number: user.mobile_number,
      role_id: user.role_id,
      user_type: user.user_type,
      status: user.status,
    },
  });

  return getUserById(user.id);
}

export async function updateUser(id, payload, actorStaffId) {
  const user = await User.findByPk(id, {
    include: [{ model: Role, as: 'role', attributes: ['id', 'code', 'name'] }],
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  await assertNonStaffUser(user);

  const oldValues = {
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    organization_name: user.organization_name,
    preferred_language: user.preferred_language,
    role_id: user.role_id,
  };

  const updates = {};

  if (payload.email !== undefined) updates.email = payload.email || null;
  if (payload.firstName !== undefined) updates.first_name = payload.firstName || null;
  if (payload.lastName !== undefined) updates.last_name = payload.lastName || null;
  if (payload.organizationName !== undefined) {
    updates.organization_name = payload.organizationName || null;
  }
  if (payload.preferredLanguage !== undefined) {
    updates.preferred_language = payload.preferredLanguage;
  }

  if (payload.roleId !== undefined && payload.roleId !== user.role_id) {
    const role = await Role.findOne({ where: { id: payload.roleId, is_active: true } });
    if (!role || !isAssignableEndUserRoleCode(role.code)) {
      throw new AppError(
        'Only the bidder role can be assigned to end users',
        400,
        'INVALID_USER_ROLE',
      );
    }
    updates.role_id = payload.roleId;
  }

  if (Object.keys(updates).length === 0) {
    return getUserById(id);
  }

  await user.update(updates);

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: user.id,
    oldValues,
    newValues: updates,
  });

  return getUserById(id);
}

export async function updateUserStatus(id, { status, reason }, actorStaffId, actorUserId = null) {
  const allowedStatuses = [USER_STATUSES.ACTIVE, USER_STATUSES.SUSPENDED, USER_STATUSES.DEACTIVATED];
  if (!allowedStatuses.includes(status)) {
    throw new AppError('Invalid status transition', 400, 'INVALID_STATUS');
  }

  if (actorUserId && actorUserId === id) {
    throw new AppError('You cannot change your own account status', 400, 'SELF_STATUS_CHANGE');
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const oldStatus = user.status;
  await user.update({ status });

  if (status === USER_STATUSES.SUSPENDED || status === USER_STATUSES.DEACTIVATED) {
    await revokeUserRefreshTokens(user.id);
  }

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: user.id,
    oldValues: { status: oldStatus },
    newValues: { status },
    metadata: reason ? { reason } : null,
  });

  return getUserById(id);
}

export async function deleteUser(id, actorStaffId, actorUserId = null) {
  if (actorUserId && actorUserId === id) {
    throw new AppError('You cannot delete your own account', 400, 'SELF_DELETE');
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  await assertNonStaffUser(user);
  await revokeUserRefreshTokens(user.id);
  await user.destroy();

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'User',
    entityId: id,
    oldValues: {
      mobile_number: user.mobile_number,
      status: user.status,
    },
  });

  return { deleted: true, id };
}

export async function updateMyProfile(userId, payload = {}) {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: 'role', attributes: ['id', 'code', 'name'] }],
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const oldValues = {
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    organization_name: user.organization_name,
    preferred_language: user.preferred_language,
  };

  const updates = {};

  if (payload.email !== undefined) {
    updates.email = payload.email?.trim() ? payload.email.trim() : null;
  }

  if (payload.preferredLanguage !== undefined) {
    const lang = payload.preferredLanguage;
    if (!['en', 'am'].includes(lang)) {
      throw new AppError('preferredLanguage must be en or am', 400, 'VALIDATION_ERROR');
    }
    updates.preferred_language = lang;
  }

  if (user.user_type === 'organization') {
    if (payload.organizationName !== undefined) {
      const name = payload.organizationName?.trim();
      if (!name) {
        throw new AppError('organizationName is required', 400, 'VALIDATION_ERROR');
      }
      updates.organization_name = name;
    }
  } else {
    if (payload.firstName !== undefined) {
      const firstName = payload.firstName?.trim();
      if (!firstName) {
        throw new AppError('firstName is required', 400, 'VALIDATION_ERROR');
      }
      updates.first_name = firstName;
    }
    if (payload.lastName !== undefined) {
      updates.last_name = payload.lastName?.trim() ? payload.lastName.trim() : null;
    }
    if (payload.organizationName !== undefined) {
      updates.organization_name = payload.organizationName?.trim() ? payload.organizationName.trim() : null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return serializeUserDetail(user);
  }

  await user.update(updates);

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: user.id,
    oldValues,
    newValues: updates,
    metadata: { action: 'self_profile_update' },
  });

  await user.reload({
    include: [{ model: Role, as: 'role', attributes: ['id', 'code', 'name'] }],
  });

  return serializeUserDetail(user);
}

export const userService = Object.freeze({
  listUsers,
  getUserStats,
  getUserById,
  createUser,
  updateUser,
  updateMyProfile,
  updateUserStatus,
  deleteUser,
  serializeUserListRow,
  serializeUserDetail,
  buildUserListWhere,
  USER_LIST_TABS,
});

export default userService;
