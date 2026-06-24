import { Op } from 'sequelize';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/db.config.js';
import { User } from '../../models/user.model.js';
import { Role } from '../../models/role.model.js';
import { RefreshToken } from '../../models/refreshToken.model.js';
import { getUserPermissions } from '../../services/user-permission.service.js';
import { createAccessToken } from '../../middleware/auth.middleware.js';
import { generateOpaqueToken, generateUuid, hashToken } from '../../utils/crypto.util.js';
import { hashPassword, verifyPassword } from '../../utils/password.util.js';
import { getMobileLookupCandidates } from '../../utils/mobile.util.js';
import { withRedis } from '../../utils/redis-safe.util.js';
import { UnauthorizedError, AppError, InvalidCredentialsError } from '../../utils/error.util.js';
import { env } from '../../config/env.config.js';
import { auditService, AUDIT_ACTIONS } from '../../services/audit.service.js';
import {
  USER_STATUSES,
  LOGIN_ALLOWED_STATUSES,
} from '../../services/kyc.service.js';
const IDENTITY_AGGREGATION_SQL = `
  SELECT
    u.id AS user_id,
    u.role_id AS user_role_id,
    u.user_type,
    u.mobile_number,
    u.email,
    u.first_name,
    u.last_name,
    u.organization_name,
    u.preferred_language,
    u.is_mobile_verified,
    u.is_email_verified,
    u.status AS user_status,
    s.id AS staff_id,
    s.employee_id,
    s.department,
    s.role_id AS staff_role_id,
    s.is_active AS staff_is_active,
    COALESCE(s.role_id, u.role_id) AS effective_role_id,
    r.id AS role_id,
    r.code AS role_code,
    r.name AS role_name,
    r.is_active AS role_is_active,
    r.updated_at AS role_updated_at
  FROM users u
  LEFT JOIN staff s
    ON s.user_id = u.id
   AND s.deleted_at IS NULL
   AND s.is_active = 1
  INNER JOIN roles r
    ON r.id = COALESCE(s.role_id, u.role_id)
   AND r.is_active = 1
  WHERE u.id = :userId
    AND u.deleted_at IS NULL
  LIMIT 1
`;

function parseDurationToMs(duration) {
  const match = /^(\d+)([smhd])$/i.exec(duration.trim());
  if (!match) {
    throw new AppError(`Invalid duration format: ${duration}`, 500, 'DURATION_PARSE_ERROR');
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
}

function buildDisplayName({ userType, firstName, lastName, organizationName, mobileNumber }) {
  if (userType === 'organization' && organizationName) {
    return organizationName;
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || mobileNumber;
}

function mapIdentityRow(row) {
  const isStaff = Boolean(row.staff_id);

  return {
    user: {
      id: row.user_id,
      roleId: row.user_role_id,
      userType: row.user_type,
      mobileNumber: row.mobile_number,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      organizationName: row.organization_name,
      preferredLanguage: row.preferred_language,
      isMobileVerified: Boolean(row.is_mobile_verified),
      isEmailVerified: Boolean(row.is_email_verified),
      displayName: buildDisplayName({
        userType: row.user_type,
        firstName: row.first_name,
        lastName: row.last_name,
        organizationName: row.organization_name,
        mobileNumber: row.mobile_number,
      }),
      status: row.user_status,
    },
    staff: isStaff
      ? {
          id: row.staff_id,
          employeeId: row.employee_id,
          department: row.department,
          roleId: row.staff_role_id,
          isActive: Boolean(row.staff_is_active),
        }
      : null,
    role: {
      id: row.role_id,
      code: row.role_code,
      name: row.role_name,
      isActive: Boolean(row.role_is_active),
      updatedAt: row.role_updated_at,
      effectiveRoleId: row.effective_role_id,
    },
    isStaff,
  };
}

function buildAuthzPayload(permissions) {
  return {
    roleId: permissions.effectiveRoleId,
    roleCode: permissions.role.code,
    roleName: permissions.role.name,
    permVersion: permissions.version,
    permissionVersion: permissions.permissionVersion,
    permChecksum: permissions.checksum,
    wildcard: permissions.wildcard,
    modules: permissions.modules,
    actions: permissions.actions,
    routes: permissions.routes,
  };
}

function buildSessionUserPayload(permissions) {
  return {
    id: permissions.userId,
    userId: permissions.userId,
    roleId: permissions.effectiveRoleId,
    roleCode: permissions.role.code,
    userType: permissions.userType,
    staffId: permissions.staffId,
    employeeId: permissions.employeeId,
    department: permissions.department,
    isStaff: permissions.isStaff,
    displayName: permissions.displayName,
    mobileNumber: permissions.mobileNumber,
    email: permissions.email,
    status: permissions.userStatus,
    permissions: {
      wildcard: permissions.wildcard,
      modules: permissions.modules,
      actions: permissions.actions,
      routes: permissions.routes,
    },
  };
}

function buildIdentityPayloadFromPermissions(permissions) {
  return {
    userId: permissions.userId,
    staffId: permissions.staffId,
    employeeId: permissions.employeeId,
    department: permissions.department,
    isStaff: permissions.isStaff,
    userType: permissions.userType,
    mobileNumber: permissions.mobileNumber,
    email: permissions.email,
    displayName: permissions.displayName,
    preferredLanguage: permissions.preferredLanguage,
    isMobileVerified: permissions.isMobileVerified,
    status: permissions.userStatus,
  };
}

/**
 * Resolve user + optional staff + effective role in a single query.
 * Staff role overrides user role via COALESCE(s.role_id, u.role_id).
 * @param {string} userId
 */
export async function aggregateIdentity(userId) {
  const rows = await sequelize.query(IDENTITY_AGGREGATION_SQL, {
    replacements: { userId },
    type: QueryTypes.SELECT,
  });

  const row = rows[0];
  if (!row) {
    throw new UnauthorizedError('Account not found or inactive', 'ACCOUNT_NOT_FOUND');
  }

  const isStaff = Boolean(row.staff_id);

  if (!isStaff) {
    // Only blocked statuses are forbidden for non-staff
    const blockedStatuses = [
      USER_STATUSES.SUSPENDED,
      USER_STATUSES.DEACTIVATED,
    ];

    if (blockedStatuses.includes(row.user_status)) {
      throw new UnauthorizedError(`Account is ${row.user_status}`, 'ACCOUNT_INACTIVE');
    }
    // Allow all other statuses including PENDING, KYC_PENDING, etc.
  } else if (row.user_status !== USER_STATUSES.ACTIVE) {
    throw new UnauthorizedError(`Account is ${row.user_status}`, 'ACCOUNT_INACTIVE');
  }

  if (!row.role_is_active) {
    throw new UnauthorizedError('Assigned role is inactive', 'ROLE_INACTIVE');
  }

  return mapIdentityRow(row);
}

/**
 * Verifies mobile_number + password against the users table.
 * Enforces deleted_at IS NULL (paranoid) and status = 'active'.
 * @param {string} mobileNumber
 * @param {string} plainTextPassword
 */
export async function loginWithCredentials(mobileNumber, plainTextPassword) {
  if (!mobileNumber || !plainTextPassword) {
    throw new InvalidCredentialsError();
  }

  const lookupCandidates = getMobileLookupCandidates(mobileNumber);

  const user = await User.unscoped().findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      status: { [Op.in]: LOGIN_ALLOWED_STATUSES },
      deleted_at: null,
    },
    attributes: [
      'id',
      'password',
      'status',
      'failed_login_attempts',
      'mobile_number',
    ],
  });

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await verifyPassword(plainTextPassword, user.password);

  if (!passwordMatches) {
    await user.update({
      failed_login_attempts: Number(user.failed_login_attempts || 0) + 1,
    });

    throw new InvalidCredentialsError();
  }

  await user.update({
    last_login_at: new Date(),
    failed_login_attempts: 0,
  });

  return user.id;
}

async function issueRefreshToken(userId, sessionContext = {}) {
  const refreshTokenId = generateUuid();
  const familyId = sessionContext.familyId || generateUuid();
  const opaqueToken = generateOpaqueToken(48);
  const tokenHash = hashToken(opaqueToken);
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.jwt.refreshExpiresIn));

  try {
    await RefreshToken.create({
      id: refreshTokenId,
      user_id: userId,
      family_id: familyId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: sessionContext.ipAddress || null,
      user_agent: sessionContext.userAgent || null,
    });
  } catch (error) {
    console.warn('[auth.service] refresh token persistence skipped:', error.message);
    return {
      refreshTokenId: null,
      familyId,
      opaqueToken: null,
      expiresAt: null,
      persisted: false,
    };
  }

  return {
    refreshTokenId,
    familyId,
    opaqueToken,
    expiresAt,
    persisted: true,
  };
}

/**
 * Complete login pipeline:
 * identity aggregation -> permission resolution -> refresh session -> access JWT.
 * @param {string} userId
 * @param {{ ipAddress?: string, userAgent?: string, sessionId?: string, familyId?: string }} [sessionContext]
 */
export async function completeLogin(userId, sessionContext = {}) {
  const permissions = await getUserPermissions(userId, { bypassCache: true });

  const sessionId = sessionContext.sessionId || generateUuid();
  const refreshSession = await issueRefreshToken(userId, sessionContext);

  const identity = buildIdentityPayloadFromPermissions(permissions);
  const authz = buildAuthzPayload(permissions);

  const accessToken = createAccessToken({
    identity,
    authz,
    sessionId,
  });

  return {
    accessToken,
    refreshToken: refreshSession.opaqueToken,
    refreshTokenExpiresAt: refreshSession.expiresAt,
    session: {
      sessionId,
      familyId: refreshSession.familyId,
      refreshTokenId: refreshSession.refreshTokenId,
    },
    identity,
    authz,
    user: buildSessionUserPayload(permissions),
    permissions,
  };
}

const OTP_TTL_SECONDS = 300;
const otpMemoryFallback = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOtpKey(mobileNumber) {
  const candidates = getMobileLookupCandidates(mobileNumber);
  return `otp:${candidates[0] || mobileNumber}`;
}

async function storeOTP(mobileNumber, otp, expiresIn = OTP_TTL_SECONDS) {
  const key = buildOtpKey(mobileNumber);

  const stored = await withRedis(async (client) => {
    await client.setex(key, expiresIn, otp);
    return true;
  }, false);

  if (!stored) {
    otpMemoryFallback.set(key, {
      otp,
      expiresAt: Date.now() + expiresIn * 1000,
    });
  }
}

async function verifyStoredOTP(mobileNumber, otp) {
  const key = buildOtpKey(mobileNumber);

  const redisValid = await withRedis(async (client) => {
    const storedOTP = await client.get(key);
    if (!storedOTP || storedOTP !== otp) {
      return false;
    }
    await client.del(key);
    return true;
  }, null);

  if (redisValid === true) {
    return true;
  }

  if (redisValid === false) {
    return false;
  }

  const memoryEntry = otpMemoryFallback.get(key);
  if (!memoryEntry || memoryEntry.expiresAt < Date.now() || memoryEntry.otp !== otp) {
    return false;
  }

  otpMemoryFallback.delete(key);
  return true;
}

/**
 * @param {object} userData
 */
export async function register(userData) {
  const {
    firstName,
    lastName,
    mobileNumber,
    email,
    password,
    userType = 'individual',
    organizationName,
  } = userData;

  const lookupCandidates = getMobileLookupCandidates(mobileNumber);
  const existingUser = await User.findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      deleted_at: null,
    },
  });

  if (existingUser) {
    throw new AppError('Mobile number already registered', 400, 'DUPLICATE_MOBILE');
  }

  const bidderRole = await Role.findOne({
    where: { code: 'bidder', is_active: true },
  });

  if (!bidderRole) {
    throw new AppError('System configuration error', 500, 'ROLE_NOT_FOUND');
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    id: generateUuid(),
    role_id: bidderRole.id,
    user_type: userType,
    mobile_number: mobileNumber,
    email: email || null,
    password: hashedPassword,
    first_name: firstName || null,
    last_name: lastName || null,
    organization_name: organizationName || null,
    preferred_language: 'en',
    is_mobile_verified: false,
    is_email_verified: false,
    status: USER_STATUSES.PENDING,
    failed_login_attempts: 0,
  });

  const otp = generateOTP();
  await storeOTP(mobileNumber, otp);

  if (env.isProduction) {
    console.info('[auth.service] OTP sent to registered mobile (production)');
  } else {
    console.info('[auth.service] Registration OTP for', mobileNumber, ':', otp);
  }

  await auditService.writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'User',
    entityId: user.id,
    metadata: { userType, action: 'register' },
  });

  return {
    userId: user.id,
    mobileNumber: user.mobile_number,
    requiresOTPVerification: true,
  };
}

/**
 * @param {string} mobileNumber
 * @param {string} otp
 */
export async function verifyOTP(mobileNumber, otp) {
  const isValid = await verifyStoredOTP(mobileNumber, otp);

  if (!isValid) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  const lookupCandidates = getMobileLookupCandidates(mobileNumber);
  const user = await User.unscoped().findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      deleted_at: null,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const oldStatus = user.status;
  await user.update({
    is_mobile_verified: true,
    status: USER_STATUSES.KYC_PENDING,
  });

  await auditService.writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: user.id,
    oldValues: { is_mobile_verified: false, status: oldStatus },
    newValues: { is_mobile_verified: true, status: USER_STATUSES.KYC_PENDING },
    metadata: { action: 'otp_verified' },
  });

  return completeLogin(user.id);
}

/**
 * @param {string} mobileNumber
 */
export async function resendOTP(mobileNumber) {
  const lookupCandidates = getMobileLookupCandidates(mobileNumber);
  const user = await User.findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      deleted_at: null,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const otp = generateOTP();
  await storeOTP(mobileNumber, otp);

  if (env.isProduction) {
    console.info('[auth.service] OTP resent (production)');
  } else {
    console.info('[auth.service] Resent OTP for', mobileNumber, ':', otp);
  }

  return { success: true };
}

export const authService = Object.freeze({
  aggregateIdentity,
  loginWithCredentials,
  completeLogin,
  register,
  verifyOTP,
  resendOTP,
});

export default authService;
