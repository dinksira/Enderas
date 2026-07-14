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
    u.avatar_url,
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
      avatarUrl: row.avatar_url,
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
      status: { [Op.notIn]: [USER_STATUSES.SUSPENDED, USER_STATUSES.DEACTIVATED] },
    },
    attributes: [
      'id',
      'password',
      'status',
      'failed_login_attempts',
      'mobile_number',
      'is_mobile_verified',
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

  // Credentials are correct but the account never finished OTP verification
  // (e.g. the app was closed mid-registration). Rather than reporting invalid
  // credentials, signal the controller to resume verification.
  if (!user.is_mobile_verified) {
    return {
      userId: user.id,
      mobileNumber: user.mobile_number,
      requiresVerification: true,
    };
  }

  await user.update({
    last_login_at: new Date(),
    failed_login_attempts: 0,
  });

  return { userId: user.id, requiresVerification: false };
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

/**
 * Exchange a persisted opaque refresh token for a new access/refresh pair.
 * Tokens rotate on every use so a stolen older token cannot be replayed.
 *
 * @param {string} opaqueToken
 * @param {{ ipAddress?: string, userAgent?: string }} [sessionContext]
 */
export async function refreshSession(opaqueToken, sessionContext = {}) {
  if (!opaqueToken || typeof opaqueToken !== 'string') {
    throw new UnauthorizedError('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
  }

  const tokenHash = hashToken(opaqueToken);
  const existingToken = await RefreshToken.findOne({
    where: { token_hash: tokenHash },
  });

  if (!existingToken) {
    throw new UnauthorizedError('Invalid refresh token', 'REFRESH_TOKEN_INVALID');
  }

  if (existingToken.revoked_at) {
    await RefreshToken.update(
      { revoked_at: new Date() },
      {
        where: {
          family_id: existingToken.family_id,
          revoked_at: null,
        },
      },
    );
    throw new UnauthorizedError('Refresh token has been revoked', 'REFRESH_TOKEN_REVOKED');
  }

  if (new Date(existingToken.expires_at).getTime() <= Date.now()) {
    await existingToken.update({ revoked_at: new Date() });
    throw new UnauthorizedError('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED');
  }

  await existingToken.update({ revoked_at: new Date() });

  const session = await completeLogin(existingToken.user_id, {
    ...sessionContext,
    familyId: existingToken.family_id,
  });

  await existingToken.update({
    replaced_by: session.session?.refreshTokenId ?? null,
  });

  return session;
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

  // Pending (never verified) accounts are eligible too: a user who abandoned
  // registration before OTP and later forgot their password would otherwise be
  // locked out of every recovery path. The reset OTP is delivered to the phone,
  // so completing it also proves ownership (see resetPasswordWithOtp).
  return User.unscoped().findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      deleted_at: null,
      status: { [Op.notIn]: [USER_STATUSES.SUSPENDED, USER_STATUSES.DEACTIVATED] },
    },
    attributes: ['id', 'mobile_number', 'status', 'is_mobile_verified'],
  });
}

async function revokeUserRefreshTokens(userId) {
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { user_id: userId, revoked_at: null } },
  );
}

async function checkDuplicateRegistrationIdentifiers(
  { nationalIdNumber, tinNumber, excludeUserId } = {},
  transaction = null,
) {
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

  const where = {
    [Op.or]: orConditions,
    deleted_at: null,
  };

  if (excludeUserId) {
    where.id = { [Op.ne]: excludeUserId };
  }

  const duplicateUser = await User.unscoped().findOne({
    where,
    attributes: ['id', 'national_id_number', 'tin_number'],
    ...(transaction ? { transaction } : {}),
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

  const bidderRole = await Role.findOne({
    where: { code: 'bidder', is_active: true },
  });

  if (!bidderRole) {
    throw new AppError('System configuration error', 500, 'ROLE_NOT_FOUND');
  }

  const hashedPassword = await hashPassword(password);

  // A pending (never verified) account for this number means an earlier
  // registration was abandoned before OTP verification. Ownership of the
  // number is only proven by verifying the OTP, so it is safe to resume that
  // record with the latest details instead of leaving the user locked out
  // (can't re-register -> "already exists", can't log in -> "not verified").
  const { user, resumed } = await sequelize.transaction(async (transaction) => {
    const existingUser = await User.unscoped().findOne({
      where: {
        mobile_number: { [Op.in]: lookupCandidates },
        deleted_at: null,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existingUser && existingUser.is_mobile_verified) {
      throw new AppError(
        'This mobile number is already registered. Please log in instead.',
        409,
        'DUPLICATE_MOBILE',
      );
    }

    await checkDuplicateRegistrationIdentifiers(
      { nationalIdNumber, tinNumber, excludeUserId: existingUser?.id },
      transaction,
    );

    const sharedFields = {
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
      is_mobile_verified: false,
      status: USER_STATUSES.PENDING,
      failed_login_attempts: 0,
    };

    if (existingUser) {
      await existingUser.update(sharedFields, { transaction });
      return { user: existingUser, resumed: true };
    }

    const createdUser = await User.create(
      {
        id: generateUuid(),
        ...sharedFields,
        is_email_verified: false,
        preferred_language: 'en',
      },
      { transaction },
    );

    return { user: createdUser, resumed: false };
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
    action: resumed ? AUDIT_ACTIONS.UPDATE : AUDIT_ACTIONS.CREATE,
    entityType: 'User',
    entityId: user.id,
    metadata: {
      userType,
      action: resumed ? 'register_resumed' : 'register',
      otpExpiresIn: otpExpiry.otpExpiresIn,
    },
  });

  return {
    userId: user.id,
    mobileNumber: user.mobile_number,
    requiresOTPVerification: true,
    resumed,
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
      'Account must exist and not be suspended/deactivated (pending/unverified accounts are eligible).',
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

  // Successfully entering an OTP sent to this number proves ownership, so an
  // abandoned pending registration is verified here and promoted out of the
  // pending state — the user can now log in normally.
  if (!user.is_mobile_verified) {
    passwordUpdates.is_mobile_verified = true;
  }

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

/**
 * Update the authenticated user's own profile fields.
 * Allowed fields: email, firstName, lastName, preferredLanguage.
 * @param {string} userId
 * @param {object} patch
 */
export async function updateMe(userId, patch) {
  const allowedFields = ['email', 'firstName', 'lastName', 'preferredLanguage'];
  const updates = {};

  for (const field of allowedFields) {
    if (patch[field] !== undefined) {
      updates[field] = patch[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update', 400, 'VALIDATION_ERROR');
  }

  const user = await User.unscoped().findByPk(userId, {
    attributes: ['id', 'email', 'first_name', 'last_name', 'preferred_language'],
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const dbUpdates = {};

  if (updates.email !== undefined && updates.email !== user.email) {
    if (updates.email) {
      const existing = await User.unscoped().findOne({
        where: {
          email: updates.email,
          id: { [Op.ne]: userId },
          deleted_at: null,
        },
        attributes: ['id'],
      });
      if (existing) {
        throw new AppError('Email already in use', 400, 'DUPLICATE_EMAIL');
      }
    }
    dbUpdates.email = updates.email || null;
  }

  if (updates.firstName !== undefined) {
    dbUpdates.first_name = updates.firstName || null;
  }

  if (updates.lastName !== undefined) {
    dbUpdates.last_name = updates.lastName || null;
  }

  if (updates.preferredLanguage !== undefined) {
    if (!['en', 'am'].includes(updates.preferredLanguage)) {
      throw new AppError('Invalid language. Must be "en" or "am"', 400, 'VALIDATION_ERROR');
    }
    dbUpdates.preferred_language = updates.preferredLanguage;
  }

  if (Object.keys(dbUpdates).length === 0) {
    return { success: true };
  }

  await user.update(dbUpdates);

  await auditService.writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: user.id,
    metadata: { action: 'profile_update', fields: Object.keys(dbUpdates) },
  });

  const freshUser = await User.unscoped().findByPk(userId, {
    attributes: ['id', 'email', 'first_name', 'last_name', 'preferred_language', 'avatar_url'],
  });

  return {
    success: true,
    user: {
      email: freshUser.email,
      firstName: freshUser.first_name,
      lastName: freshUser.last_name,
      preferredLanguage: freshUser.preferred_language,
      avatarUrl: freshUser.avatar_url,
    },
  };
}

/**
 * Update the authenticated user's avatar.
 * @param {string} userId
 * @param {object} file - multer file object (buffer, originalname, mimetype, size)
 */
export async function updateAvatar(userId, file) {
  if (!file) {
    throw new AppError('No file provided', 400, 'VALIDATION_ERROR');
  }

  const user = await User.unscoped().findByPk(userId, {
    attributes: ['id', 'avatar_url'],
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const { fileStorageService } = await import('../../services/fileStorage.service.js');
  const uploadResult = await fileStorageService.uploadFile(file, 'avatars');

  await user.update({ avatar_url: uploadResult.fileUrl });

  await auditService.writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: user.id,
    metadata: { action: 'avatar_update', avatarUrl: uploadResult.fileUrl },
  });

  return {
    success: true,
    avatarUrl: uploadResult.fileUrl,
  };
}

/**
 * Change the authenticated user's password.
 * Requires currentPassword verification.
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400, 'VALIDATION_ERROR');
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400, 'VALIDATION_ERROR');
  }

  const user = await User.unscoped().findByPk(userId, {
    attributes: ['id', 'password'],
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const passwordMatches = await verifyPassword(currentPassword, user.password);
  if (!passwordMatches) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
  }

  const hashedPassword = await hashPassword(newPassword);
  await user.update({ password: hashedPassword });

  await revokeUserRefreshTokens(userId);

  await auditService.writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: user.id,
    metadata: { action: 'password_changed' },
  });

  return { success: true };
}

/**
 * Hard-deletes pending registrations that never completed OTP verification and
 * are older than the configured TTL. Uses force:true because soft-deleted rows
 * still occupy unique mobile/email/national-id/tin indexes and would block the
 * real phone owner from registering.
 *
 * @param {number} ttlHours
 * @returns {Promise<{ deleted: number }>}
 */
export async function purgeExpiredPendingRegistrations(ttlHours = 12) {
  const ttl = Number(ttlHours);
  const effectiveTtl = Number.isFinite(ttl) && ttl > 0 ? ttl : 12;
  const cutoff = new Date(Date.now() - effectiveTtl * 60 * 60 * 1000);

  const deleted = await User.unscoped().destroy({
    force: true,
    where: {
      is_mobile_verified: false,
      status: USER_STATUSES.PENDING,
      created_at: { [Op.lt]: cutoff },
    },
  });

  return { deleted };
>>>>>>> magersoftware/main
}

export const authService = Object.freeze({
  aggregateIdentity,
  loginWithCredentials,
  completeLogin,
  refreshSession,
  register,
  verifyOTP,
  resendOTP,
  requestPasswordReset,
  verifyPasswordResetOtpCode,
  resetPasswordWithOtp,
  updateMe,
  changePassword,
  updateAvatar,
  purgeExpiredPendingRegistrations,
});

export default authService;
