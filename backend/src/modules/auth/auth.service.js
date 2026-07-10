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
import { getMobileLookupCandidates, normalizeMobileNumber, resolveMobileForStorage } from '../../utils/mobile.util.js';
import { withRedis } from '../../utils/redis-safe.util.js';
import { UnauthorizedError, AppError, InvalidCredentialsError } from '../../utils/error.util.js';
import { env } from '../../config/env.config.js';
import { auditService, AUDIT_ACTIONS } from '../../services/audit.service.js';
import { settingsService } from '../../services/settings.service.js';
import {
  USER_STATUSES,
  LOGIN_ALLOWED_STATUSES,
} from '../../services/kyc.service.js';
import { resolvePublicUploadUrl } from '../../utils/media-url.util.js';
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
    u.profile_picture,
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
      profilePicture: resolvePublicUploadUrl(row.profile_picture) ?? null,
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
    moduleActions: permissions.moduleActions,
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
    profilePicture: permissions.profilePicture ?? null,
    mobileNumber: permissions.mobileNumber,
    email: permissions.email,
    status: permissions.userStatus,
    permissions: {
      wildcard: permissions.wildcard,
      modules: permissions.modules,
      actions: permissions.actions,
      routes: permissions.routes,
      moduleActions: permissions.moduleActions,
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
    profilePicture: permissions.profilePicture ?? null,
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
      deleted_at: null,
      is_mobile_verified: true,
      status: { [Op.notIn]: [USER_STATUSES.SUSPENDED, USER_STATUSES.DEACTIVATED] },
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

const DEFAULT_OTP_TTL_SECONDS = 300;
const otpMemoryFallback = new Map();

function normalizeOtpTtlSeconds(value) {
  const ttl = Number(value);
  if (!Number.isFinite(ttl) || ttl < 60 || ttl > 3600) {
    return DEFAULT_OTP_TTL_SECONDS;
  }
  return Math.floor(ttl);
}

async function resolveOtpTtlSeconds() {
  try {
    const configured = await settingsService.getSetting('otp.ttl_seconds');
    return normalizeOtpTtlSeconds(configured);
  } catch {
    return DEFAULT_OTP_TTL_SECONDS;
  }
}

function buildOtpExpiry(issuedAt, ttlSeconds) {
  return new Date(issuedAt.getTime() + ttlSeconds * 1000).toISOString();
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOtpKey(mobileNumber) {
  const normalized = normalizeMobileNumber(mobileNumber);
  return `otp:${normalized}`;
}

function buildPasswordResetOtpKey(mobileNumber) {
  const normalized = normalizeMobileNumber(mobileNumber);
  return `password-reset:otp:${normalized}`;
}

async function storeOtpForKey(key, otp, expiresIn = DEFAULT_OTP_TTL_SECONDS) {
  const ttlSeconds = normalizeOtpTtlSeconds(expiresIn);
  const issuedAt = new Date();

  const stored = await withRedis(async (client) => {
    await client.setex(key, ttlSeconds, otp);
    return true;
  }, false);

  if (!stored) {
    otpMemoryFallback.set(key, {
      otp,
      expiresAt: issuedAt.getTime() + ttlSeconds * 1000,
    });
  }

  return {
    otpExpiresIn: ttlSeconds,
    otpExpiresAt: buildOtpExpiry(issuedAt, ttlSeconds),
  };
}

async function storeOTP(mobileNumber, otp, expiresIn = DEFAULT_OTP_TTL_SECONDS) {
  return storeOtpForKey(buildOtpKey(mobileNumber), otp, expiresIn);
}

async function storePasswordResetOTP(mobileNumber, otp, expiresIn = DEFAULT_OTP_TTL_SECONDS) {
  return storeOtpForKey(buildPasswordResetOtpKey(mobileNumber), otp, expiresIn);
}

/**
 * @returns {Promise<'valid' | 'expired' | 'invalid'>}
 */
async function checkOtpForKey(key, otp) {
  const redisResult = await withRedis(async (client) => {
    const storedOTP = await client.get(key);
    if (!storedOTP) {
      return 'expired';
    }
    if (storedOTP !== otp) {
      return 'invalid';
    }
    return 'valid';
  }, null);

  if (redisResult === 'valid' || redisResult === 'invalid' || redisResult === 'expired') {
    return redisResult;
  }

  const memoryEntry = otpMemoryFallback.get(key);
  if (!memoryEntry) {
    return 'expired';
  }

  if (memoryEntry.expiresAt < Date.now()) {
    return 'expired';
  }

  if (memoryEntry.otp !== otp) {
    return 'invalid';
  }

  return 'valid';
}

/**
 * @returns {Promise<'valid' | 'expired' | 'invalid'>}
 */
async function verifyOtpForKey(key, otp) {

  const redisResult = await withRedis(async (client) => {
    const storedOTP = await client.get(key);
    if (!storedOTP) {
      return 'expired';
    }
    if (storedOTP !== otp) {
      return 'invalid';
    }
    await client.del(key);
    return 'valid';
  }, null);

  if (redisResult === 'valid' || redisResult === 'invalid' || redisResult === 'expired') {
    return redisResult;
  }

  const memoryEntry = otpMemoryFallback.get(key);
  if (!memoryEntry) {
    return 'expired';
  }

  if (memoryEntry.expiresAt < Date.now()) {
    otpMemoryFallback.delete(key);
    return 'expired';
  }

  if (memoryEntry.otp !== otp) {
    return 'invalid';
  }

  otpMemoryFallback.delete(key);
  return 'valid';
}

async function verifyStoredOTP(mobileNumber, otp) {
  return verifyOtpForKey(buildOtpKey(mobileNumber), otp);
}

async function verifyPasswordResetOTP(mobileNumber, otp) {
  return verifyOtpForKey(buildPasswordResetOtpKey(mobileNumber), otp);
}

async function checkPasswordResetOTP(mobileNumber, otp) {
  return checkOtpForKey(buildPasswordResetOtpKey(mobileNumber), otp);
}

async function findPasswordResetEligibleUser(mobileNumber) {
  const normalizedMobile = normalizeMobileNumber(mobileNumber);
  const lookupCandidates = getMobileLookupCandidates(normalizedMobile);

  return User.unscoped().findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      is_mobile_verified: true,
      deleted_at: null,
      status: { [Op.notIn]: [USER_STATUSES.SUSPENDED, USER_STATUSES.DEACTIVATED] },
    },
    attributes: ['id', 'mobile_number', 'status'],
  });
}

async function revokeUserRefreshTokens(userId) {
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { user_id: userId, revoked_at: null } },
  );
}

async function checkDuplicateRegistrationIdentifiers({ nationalIdNumber, tinNumber }) {
  const orConditions = [];

  if (nationalIdNumber) {
    orConditions.push({ national_id_number: nationalIdNumber });
  }

  if (tinNumber) {
    orConditions.push({ tin_number: tinNumber });
  }

  if (orConditions.length === 0) {
    return;
  }

  const duplicateUser = await User.unscoped().findOne({
    where: {
      [Op.or]: orConditions,
      deleted_at: null,
    },
    attributes: ['id', 'national_id_number', 'tin_number'],
  });

  if (!duplicateUser) {
    return;
  }

  if (nationalIdNumber && duplicateUser.national_id_number === nationalIdNumber) {
    throw new AppError('National ID number already registered', 400, 'DUPLICATE_NATIONAL_ID');
  }

  if (tinNumber && duplicateUser.tin_number === tinNumber) {
    throw new AppError('TIN number already registered', 400, 'DUPLICATE_TIN');
  }
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
    nationalIdNumber: rawNationalIdNumber,
    nationalId: rawNationalId,
    tinNumber: rawTinNumber,
  } = userData;

  const nationalIdNumber = (rawNationalIdNumber ?? rawNationalId ?? '').trim() || null;
  const tinNumber = (rawTinNumber ?? '').trim() || null;

  if (userType === 'individual' && !nationalIdNumber) {
    throw new AppError('National ID number is required', 400, 'VALIDATION_ERROR');
  }

  if (userType === 'organization' && !tinNumber) {
    throw new AppError('TIN number is required', 400, 'VALIDATION_ERROR');
  }

  const normalizedMobile = resolveMobileForStorage(mobileNumber);

  const lookupCandidates = getMobileLookupCandidates(normalizedMobile);
  const existingUser = await User.findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      deleted_at: null,
    },
  });

  if (existingUser) {
    throw new AppError('Mobile number already registered', 400, 'DUPLICATE_MOBILE');
  }

  await checkDuplicateRegistrationIdentifiers({ nationalIdNumber, tinNumber });

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
    mobile_number: normalizedMobile,
    email: email || null,
    password: hashedPassword,
    first_name: firstName || null,
    last_name: lastName || null,
    organization_name: organizationName || null,
    national_id_number: userType === 'individual' ? nationalIdNumber : null,
    tin_number: userType === 'organization' ? tinNumber : null,
    preferred_language: 'en',
    is_mobile_verified: false,
    is_email_verified: false,
    status: USER_STATUSES.PENDING,
    failed_login_attempts: 0,
  });

  const otp = generateOTP();
  const otpTtlSeconds = await resolveOtpTtlSeconds();
  const otpExpiry = await storeOTP(normalizedMobile, otp, otpTtlSeconds);

  if (env.isProduction) {
    console.info('[auth.service] OTP sent to registered mobile (production)');
  } else {
    console.log('');
    console.log('==================================================');
    console.log(`[DEV] Registration OTP: ${otp}`);
    console.log(`[DEV] Mobile: ${normalizedMobile}`);
    console.log('==================================================');
    console.log('');
  }

  await auditService.writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'User',
    entityId: user.id,
    metadata: { userType, action: 'register', otpExpiresIn: otpExpiry.otpExpiresIn },
  });

  return {
    userId: user.id,
    mobileNumber: user.mobile_number,
    requiresOTPVerification: true,
    otpExpiresIn: otpExpiry.otpExpiresIn,
    otpExpiresAt: otpExpiry.otpExpiresAt,
    ...(!env.isProduction ? { devOtp: otp } : {}),
  };
}

/**
 * @param {string} mobileNumber
 * @param {string} otp
 */
export async function verifyOTP(mobileNumber, otp) {
  const normalizedMobile = normalizeMobileNumber(mobileNumber);
  const otpStatus = await verifyStoredOTP(normalizedMobile, otp);

  if (otpStatus === 'expired') {
    throw new AppError('OTP has expired. Request a new code.', 400, 'OTP_EXPIRED');
  }

  if (otpStatus === 'invalid') {
    throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  }

  const lookupCandidates = getMobileLookupCandidates(normalizedMobile);
  const user = await User.unscoped().findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      deleted_at: null,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.is_mobile_verified) {
    throw new AppError('Mobile number already verified', 400, 'ALREADY_VERIFIED');
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
  const normalizedMobile = normalizeMobileNumber(mobileNumber);
  const lookupCandidates = getMobileLookupCandidates(normalizedMobile);
  const user = await User.findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      deleted_at: null,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.is_mobile_verified) {
    throw new AppError('Mobile number already verified', 400, 'ALREADY_VERIFIED');
  }

  const otp = generateOTP();
  const otpTtlSeconds = await resolveOtpTtlSeconds();
  const otpExpiry = await storeOTP(normalizedMobile, otp, otpTtlSeconds);

  if (env.isProduction) {
    console.info('[auth.service] OTP resent (production)');
  } else {
    console.log('');
    console.log('==================================================');
    console.log(`[DEV] Registration OTP (resend): ${otp}`);
    console.log(`[DEV] Mobile: ${normalizedMobile}`);
    console.log('==================================================');
    console.log('');
  }

  return {
    success: true,
    otpExpiresIn: otpExpiry.otpExpiresIn,
    otpExpiresAt: otpExpiry.otpExpiresAt,
    ...(!env.isProduction ? { devOtp: otp } : {}),
  };
}

/**
 * Send a password-reset OTP to a verified mobile number.
 * Always returns a generic success payload to avoid account enumeration.
 * @param {string} mobileNumber
 */
export async function requestPasswordReset(mobileNumber) {
  const normalizedMobile = normalizeMobileNumber(mobileNumber);
  const user = await findPasswordResetEligibleUser(normalizedMobile);
  const otpTtlSeconds = await resolveOtpTtlSeconds();

  if (user) {
    const otp = generateOTP();
    const otpExpiry = await storePasswordResetOTP(normalizedMobile, otp, otpTtlSeconds);

    if (env.isProduction) {
      console.info('[auth.service] Password reset OTP sent (production)');
    } else {
      console.log('');
      console.log('==================================================');
      console.log(`[DEV] Password reset code: ${otp}`);
      console.log(`[DEV] Mobile: ${normalizedMobile}`);
      console.log('==================================================');
      console.log('');
    }

    await auditService.writeAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: 'User',
      entityId: user.id,
      metadata: { action: 'password_reset_requested', otpExpiresIn: otpExpiry.otpExpiresIn },
    });

    return {
      success: true,
      otpExpiresIn: otpExpiry.otpExpiresIn,
      otpExpiresAt: otpExpiry.otpExpiresAt,
      ...(!env.isProduction ? { devOtp: otp } : {}),
    };
  }

  if (!env.isProduction) {
    console.warn(
      `[auth.service] Password reset: no eligible account for ${normalizedMobile}. ` +
      'Account must exist, be mobile-verified, and have status active/kyc_pending/kyc_under_review/kyc_rejected.',
    );
  }

  return {
    success: true,
    otpExpiresIn: otpTtlSeconds,
    otpExpiresAt: buildOtpExpiry(new Date(), otpTtlSeconds),
  };
}

/**
 * @param {string} mobileNumber
 * @param {string} otp
 * @param {string} newPassword
 */
export async function resetPasswordWithOtp(mobileNumber, otp, newPassword) {
  const normalizedMobile = normalizeMobileNumber(mobileNumber);
  const otpStatus = await verifyPasswordResetOTP(normalizedMobile, otp);

  if (otpStatus === 'expired') {
    throw new AppError('OTP has expired. Request a new code.', 400, 'OTP_EXPIRED');
  }

  if (otpStatus === 'invalid') {
    throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  }

  const user = await findPasswordResetEligibleUser(normalizedMobile);
  if (!user) {
    throw new AppError('Unable to reset password for this account', 400, 'PASSWORD_RESET_NOT_ALLOWED');
  }

  const hashedPassword = await hashPassword(newPassword);
  const passwordUpdates = {
    password: hashedPassword,
    failed_login_attempts: 0,
  };

  if (!user.status || user.status === USER_STATUSES.PENDING) {
    passwordUpdates.status = USER_STATUSES.KYC_PENDING;
  }

  await User.unscoped().update(
    passwordUpdates,
    { where: { id: user.id } },
  );

  const updatedUser = await User.unscoped().findByPk(user.id, {
    attributes: ['id', 'password', 'status'],
  });

  const passwordSaved = await verifyPassword(newPassword, updatedUser?.password);
  if (!passwordSaved) {
    throw new AppError('Password could not be saved. Please try again.', 500, 'PASSWORD_UPDATE_FAILED');
  }

  await revokeUserRefreshTokens(user.id);

  await auditService.writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: user.id,
    metadata: { action: 'password_reset_completed' },
  });

  return { success: true };
}

/**
 * Check a password-reset OTP without consuming it (for inline UI validation).
 * @param {string} mobileNumber
 * @param {string} otp
 */
export async function verifyPasswordResetOtpCode(mobileNumber, otp) {
  const normalizedMobile = normalizeMobileNumber(mobileNumber);
  const otpStatus = await checkPasswordResetOTP(normalizedMobile, otp);

  if (otpStatus === 'expired') {
    throw new AppError('OTP has expired. Request a new code.', 400, 'OTP_EXPIRED');
  }

  if (otpStatus === 'invalid') {
    throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  }

  const user = await findPasswordResetEligibleUser(normalizedMobile);
  if (!user) {
    throw new AppError('Unable to reset password for this account', 400, 'PASSWORD_RESET_NOT_ALLOWED');
  }

  return { valid: true };
}

export const authService = Object.freeze({
  aggregateIdentity,
  loginWithCredentials,
  completeLogin,
  register,
  verifyOTP,
  resendOTP,
  requestPasswordReset,
  verifyPasswordResetOtpCode,
  resetPasswordWithOtp,
});

export default authService;
