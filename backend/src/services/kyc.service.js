import { Op } from 'sequelize';
import { KYCVerification, User, Staff, AuditLog } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { notificationService } from './notification.service.js';

export const KYC_STATUSES = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const USER_STATUSES = Object.freeze({
  PENDING: 'pending',
  KYC_PENDING: 'kyc_pending',
  KYC_UNDER_REVIEW: 'kyc_under_review',
  KYC_REJECTED: 'kyc_rejected',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
});

export const LOGIN_ALLOWED_STATUSES = Object.freeze([
  USER_STATUSES.ACTIVE,
  USER_STATUSES.KYC_PENDING,
  USER_STATUSES.KYC_UNDER_REVIEW,
  USER_STATUSES.KYC_REJECTED,
]);

export const DOCUMENT_TYPES = Object.freeze({
  NATIONAL_ID: 'national_id',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  TRADE_LICENSE: 'trade_license',
  TIN_CERTIFICATE: 'tin_certificate',
  BUSINESS_REGISTRATION: 'business_registration',
  OTHER: 'other',
});

/**
 * Check for duplicate document numbers.
 * @param {string|null} documentNumber
 * @param {string|null} tinNumber
 * @param {string|null} excludeUserId
 */
async function checkDuplicateDocuments(documentNumber, tinNumber, excludeUserId = null) {
  const orConditions = [];

  if (documentNumber) {
    orConditions.push({ national_id_number: documentNumber });
  }

  if (tinNumber) {
    orConditions.push({ tin_number: tinNumber });
  }

  if (orConditions.length === 0) {
    return;
  }

  const whereClause = {
    [Op.or]: orConditions,
    deleted_at: null,
  };

  if (excludeUserId) {
    whereClause.id = { [Op.ne]: excludeUserId };
  }

  const duplicateUser = await User.unscoped().findOne({
    where: whereClause,
    attributes: ['id', 'national_id_number', 'tin_number', 'mobile_number'],
  });

  if (duplicateUser) {
    if (documentNumber && duplicateUser.national_id_number === documentNumber) {
      throw new AppError('National ID number already registered', 400, 'DUPLICATE_NATIONAL_ID');
    }
    if (tinNumber && duplicateUser.tin_number === tinNumber) {
      throw new AppError('TIN number already registered', 400, 'DUPLICATE_TIN');
    }
  }
}

/**
 * @param {string|null|undefined} tab
 * @returns {object}
 */
function buildTabWhere(tab) {
  if (!tab || tab === 'all') {
    return {};
  }

  if (tab === 'approved') {
    return { status: KYC_STATUSES.APPROVED };
  }

  if (tab === 'rejected') {
    return { status: KYC_STATUSES.REJECTED };
  }

  if (tab === 'pending') {
    return {
      status: KYC_STATUSES.PENDING,
      under_review_at: null,
    };
  }

  if (tab === 'under_review') {
    return {
      status: KYC_STATUSES.PENDING,
      under_review_at: { [Op.ne]: null },
    };
  }

  return {};
}

/**
 * @param {object} options
 */
async function fetchKYCStats() {
  const [all, pending, underReview, approved, rejected] = await Promise.all([
    KYCVerification.count(),
    KYCVerification.count({ where: { status: KYC_STATUSES.PENDING, under_review_at: null } }),
    KYCVerification.count({ where: { status: KYC_STATUSES.PENDING, under_review_at: { [Op.ne]: null } } }),
    KYCVerification.count({ where: { status: KYC_STATUSES.APPROVED } }),
    KYCVerification.count({ where: { status: KYC_STATUSES.REJECTED } }),
  ]);

  return { all, pending, under_review: underReview, approved, rejected };
}

/**
 * Submit KYC verification.
 * @param {string} userId
 * @param {object} kycData
 * @param {string} userType
 */
export async function submitKYC(userId, kycData, userType) {
  if (userType === 'individual') {
    if (!kycData.document_front_url) {
      throw new AppError('National ID front is required', 400, 'MISSING_DOCUMENT');
    }
    if (!kycData.document_number) {
      throw new AppError('National ID number is required', 400, 'MISSING_DOCUMENT_NUMBER');
    }
  } else if (userType === 'organization') {
    if (!kycData.trade_license_url) {
      throw new AppError('Trade License is required', 400, 'MISSING_DOCUMENT');
    }
    if (!kycData.tin_certificate_url) {
      throw new AppError('TIN Certificate is required', 400, 'MISSING_DOCUMENT');
    }
    if (!kycData.business_registration_url) {
      throw new AppError('Business Registration Certificate is required', 400, 'MISSING_DOCUMENT');
    }
  }

  await checkDuplicateDocuments(
    kycData.document_number,
    kycData.tin_number,
    userId,
  );

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const userUpdateData = {};
  if (kycData.document_number && userType === 'individual') {
    userUpdateData.national_id_number = kycData.document_number;
  }
  if (kycData.tin_number && userType === 'organization') {
    userUpdateData.tin_number = kycData.tin_number;
  }

  if (Object.keys(userUpdateData).length > 0) {
    await user.update(userUpdateData);
  }

  const kyc = await KYCVerification.create({
    id: generateUuid(),
    user_id: userId,
    document_type: kycData.document_type || (userType === 'individual'
      ? DOCUMENT_TYPES.NATIONAL_ID
      : DOCUMENT_TYPES.TRADE_LICENSE),
    document_number: kycData.document_number || null,
    document_front_url: kycData.document_front_url || null,
    document_back_url: kycData.document_back_url || null,
    trade_license_url: kycData.trade_license_url || null,
    tin_certificate_url: kycData.tin_certificate_url || null,
    business_registration_url: kycData.business_registration_url || null,
    status: KYC_STATUSES.PENDING,
  });

  await user.update({
    status: USER_STATUSES.KYC_UNDER_REVIEW,
  });

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'KYCVerification',
    entityId: kyc.id,
    metadata: { status: KYC_STATUSES.PENDING, userType },
  });

  await notificationService.sendKYCSubmitted(userId);

  return kyc;
}

/**
 * @param {string} id
 */
export async function getKYCById(id) {
  const kyc = await KYCVerification.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: [
          'id',
          'first_name',
          'last_name',
          'mobile_number',
          'email',
          'user_type',
          'status',
          'created_at',
        ],
      },
      {
        model: Staff,
        as: 'reviewedByStaff',
        attributes: ['id', 'employee_id', 'department'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name'],
          },
        ],
      },
    ],
  });

  if (!kyc) {
    throw new AppError('KYC record not found', 404, 'KYC_NOT_FOUND');
  }

  return kyc;
}

/**
 * @param {string} userId
 */
export async function getKYCByUserId(userId) {
  return KYCVerification.findOne({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
  });
}

/**
 * @param {{
 *   page?: number,
 *   limit?: number,
 *   status?: string|null,
 *   tab?: string|null,
 *   userType?: string|null,
 *   search?: string|null,
 *   dateFrom?: string|null,
 *   dateTo?: string|null,
 *   includeStats?: boolean,
 * }} options
 */
export async function listKYCs(options = {}) {
  const {
    page = 1,
    limit = 20,
    status = null,
    tab = null,
    userType = null,
    search = null,
    dateFrom = null,
    dateTo = null,
    includeStats = false,
  } = options;
  const offset = (page - 1) * limit;

  const where = { ...buildTabWhere(tab) };

  if (status && !tab) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) {
      where.created_at[Op.gte] = new Date(dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = end;
    }
  }

  const userInclude = {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'email', 'user_type', 'status'],
  };

  if (userType) {
    userInclude.where = { user_type: userType };
  }

  if (search) {
    const term = `%${search.trim()}%`;
    userInclude.where = {
      ...(userInclude.where || {}),
      [Op.or]: [
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } },
        { mobile_number: { [Op.like]: term } },
        { email: { [Op.like]: term } },
      ],
    };
  }

  const { count, rows } = await KYCVerification.findAndCountAll({
    where,
    include: [userInclude],
    order: [['created_at', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  const result = {
    kycs: rows,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit) || 0,
    },
  };

  if (includeStats) {
    result.stats = await fetchKYCStats();
  }

  return result;
}

/**
 * @param {string} kycId
 */
export async function getKYCAuditTrail(kycId) {
  const kyc = await KYCVerification.findByPk(kycId, { attributes: ['id'] });
  if (!kyc) {
    throw new AppError('KYC record not found', 404, 'KYC_NOT_FOUND');
  }

  return AuditLog.findAll({
    where: {
      entity_type: 'KYCVerification',
      entity_id: kycId,
    },
    order: [['created_at', 'DESC']],
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'employee_id', 'department'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name'],
          },
        ],
      },
      {
        model: User,
        as: 'user',
        attributes: ['first_name', 'last_name', 'mobile_number'],
      },
    ],
  });
}

/**
 * @param {string} kycId
 * @param {string} staffId
 * @param {string|null} reviewNotes
 */
export async function markKYCUnderReview(kycId, staffId, reviewNotes = null) {
  const kyc = await KYCVerification.findByPk(kycId, {
    include: [{ model: User, as: 'user' }],
  });

  if (!kyc) {
    throw new AppError('KYC record not found', 404, 'KYC_NOT_FOUND');
  }

  if (kyc.status !== KYC_STATUSES.PENDING) {
    throw new AppError('KYC is not pending review', 400, 'INVALID_KYC_STATUS');
  }

  if (kyc.under_review_at) {
    throw new AppError('KYC is already under review', 400, 'KYC_ALREADY_UNDER_REVIEW');
  }

  const now = new Date();

  await kyc.update({
    under_review_at: now,
    review_notes: reviewNotes ?? kyc.review_notes,
  });

  await kyc.user.update({
    status: USER_STATUSES.KYC_UNDER_REVIEW,
  });

  await auditService.writeAuditLog({
    userId: kyc.user_id,
    staffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'KYCVerification',
    entityId: kycId,
    metadata: { action: 'mark_under_review', reviewNotes },
    newValues: { under_review_at: now },
  });

  return kyc;
}

/**
 * @param {string} kycId
 * @param {string} staffId
 * @param {string|null} reviewNotes
 */
export async function approveKYC(kycId, staffId, reviewNotes = null) {
  const kyc = await KYCVerification.findByPk(kycId, {
    include: [{ model: User, as: 'user' }],
  });

  if (!kyc) {
    throw new AppError('KYC record not found', 404, 'KYC_NOT_FOUND');
  }

  if (kyc.status !== KYC_STATUSES.PENDING) {
    throw new AppError('KYC is not pending review', 400, 'INVALID_KYC_STATUS');
  }

  const oldStatus = kyc.status;
  const now = new Date();

  await kyc.update({
    status: KYC_STATUSES.APPROVED,
    reviewed_by_staff_id: staffId,
    reviewed_at: now,
    review_notes: reviewNotes,
  });

  await kyc.user.update({
    status: USER_STATUSES.ACTIVE,
  });

  await auditService.writeAuditLog({
    userId: kyc.user_id,
    staffId,
    action: AUDIT_ACTIONS.APPROVE,
    entityType: 'KYCVerification',
    entityId: kycId,
    oldValues: { status: oldStatus },
    newValues: { status: KYC_STATUSES.APPROVED, reviewNotes },
  });

  await notificationService.sendKYCApproved(kyc.user_id);

  return kyc;
}

/**
 * @param {string} kycId
 * @param {string} staffId
 * @param {string} rejectionReason
 * @param {string|null} reviewNotes
 */
export async function rejectKYC(kycId, staffId, rejectionReason, reviewNotes = null) {
  if (!rejectionReason) {
    throw new AppError('Rejection reason is required', 400, 'MISSING_REJECTION_REASON');
  }

  const kyc = await KYCVerification.findByPk(kycId, {
    include: [{ model: User, as: 'user' }],
  });

  if (!kyc) {
    throw new AppError('KYC record not found', 404, 'KYC_NOT_FOUND');
  }

  if (kyc.status !== KYC_STATUSES.PENDING) {
    throw new AppError('KYC is not pending review', 400, 'INVALID_KYC_STATUS');
  }

  const oldStatus = kyc.status;
  const now = new Date();

  await kyc.update({
    status: KYC_STATUSES.REJECTED,
    reviewed_by_staff_id: staffId,
    reviewed_at: now,
    rejection_reason: rejectionReason,
    review_notes: reviewNotes,
  });

  await kyc.user.update({
    status: USER_STATUSES.KYC_REJECTED,
  });

  await auditService.writeAuditLog({
    userId: kyc.user_id,
    staffId,
    action: AUDIT_ACTIONS.REJECT,
    entityType: 'KYCVerification',
    entityId: kycId,
    oldValues: { status: oldStatus },
    newValues: { status: KYC_STATUSES.REJECTED, rejectionReason, reviewNotes },
  });

  await notificationService.sendKYCRejected(kyc.user_id, rejectionReason);

  return kyc;
}

/**
 * @param {string} userId
 * @param {object} kycData
 * @param {string} userType
 */
export async function resubmitKYC(userId, kycData, userType) {
  const existingKYC = await getKYCByUserId(userId);
  if (!existingKYC) {
    throw new AppError('No existing KYC found', 404, 'KYC_NOT_FOUND');
  }

  if (existingKYC.status !== KYC_STATUSES.REJECTED) {
    throw new AppError('Only rejected KYC can be resubmitted', 400, 'INVALID_KYC_STATUS');
  }

  await checkDuplicateDocuments(
    kycData.document_number,
    kycData.tin_number,
    userId,
  );

  const updateData = {
    status: KYC_STATUSES.PENDING,
    reviewed_by_staff_id: null,
    reviewed_at: null,
    under_review_at: null,
    rejection_reason: null,
    review_notes: null,
  };

  if (kycData.document_number) updateData.document_number = kycData.document_number;
  if (kycData.document_front_url) updateData.document_front_url = kycData.document_front_url;
  if (kycData.document_back_url) updateData.document_back_url = kycData.document_back_url;
  if (kycData.trade_license_url) updateData.trade_license_url = kycData.trade_license_url;
  if (kycData.tin_certificate_url) updateData.tin_certificate_url = kycData.tin_certificate_url;
  if (kycData.business_registration_url) {
    updateData.business_registration_url = kycData.business_registration_url;
  }

  const updatedKYC = await existingKYC.update(updateData);

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  await user.update({
    status: USER_STATUSES.KYC_UNDER_REVIEW,
  });

  const userUpdateData = {};
  if (kycData.document_number && userType === 'individual') {
    userUpdateData.national_id_number = kycData.document_number;
  }
  if (kycData.tin_number && userType === 'organization') {
    userUpdateData.tin_number = kycData.tin_number;
  }

  if (Object.keys(userUpdateData).length > 0) {
    await user.update(userUpdateData);
  }

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'KYCVerification',
    entityId: updatedKYC.id,
    metadata: { action: 'resubmit' },
  });

  await notificationService.sendKYCSubmitted(userId);

  return updatedKYC;
}

export const kycService = Object.freeze({
  submitKYC,
  getKYCById,
  getKYCByUserId,
  listKYCs,
  getKYCAuditTrail,
  markKYCUnderReview,
  approveKYC,
  rejectKYC,
  resubmitKYC,
  KYC_STATUSES,
  USER_STATUSES,
  LOGIN_ALLOWED_STATUSES,
  DOCUMENT_TYPES,
});

export default kycService;
