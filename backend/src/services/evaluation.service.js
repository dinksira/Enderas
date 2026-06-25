import { Op } from 'sequelize';
import { Evaluation, EVALUATION_STATUSES } from '../models/evaluation.model.js';
import { Asset, AssetOwner, User, Staff } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { notificationService } from './notification.service.js';

const evaluationInclude = [
  {
    model: Asset,
    as: 'asset',
    include: [
      {
        model: AssetOwner,
        as: 'assetOwner',
        include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'organization_name'] }],
      },
    ],
  },
  {
    model: Staff,
    as: 'evaluatedByStaff',
    required: false,
    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
  },
];

function buildUserDisplayName(user) {
  if (!user) return null;
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
    || user.organization_name
    || user.mobile_number
    || null;
}

function buildStaffDisplayName(staff) {
  if (!staff?.user) return staff?.employee_id || null;
  return buildUserDisplayName(staff.user) || staff.employee_id || null;
}

function normalizePhotoUrls(urls) {
  if (Array.isArray(urls)) {
    return urls.filter((url) => typeof url === 'string' && url.trim().length > 0);
  }
  return [];
}

function buildTabWhere(tab) {
  if (!tab || tab === 'all') return {};
  if (EVALUATION_STATUSES.includes(tab)) return { status: tab };
  return {};
}

async function getEvaluationStats() {
  const [all, scheduled, inProgress, completed, approved, rejected] = await Promise.all([
    Evaluation.count({ where: { deleted_at: null } }),
    Evaluation.count({ where: { status: 'scheduled', deleted_at: null } }),
    Evaluation.count({ where: { status: 'in_progress', deleted_at: null } }),
    Evaluation.count({ where: { status: 'completed', deleted_at: null } }),
    Evaluation.count({ where: { status: 'approved', deleted_at: null } }),
    Evaluation.count({ where: { status: 'rejected', deleted_at: null } }),
  ]);
  return { all, scheduled, in_progress: inProgress, completed, approved, rejected };
}

function serializeEvaluationListRow(evaluation) {
  const plain = evaluation.get ? evaluation.get({ plain: true }) : evaluation;
  const asset = plain.asset;
  const ownerUser = asset?.assetOwner?.user;

  return {
    id: plain.id,
    assetId: plain.asset_id,
    assetTitle: asset?.title ?? null,
    assetType: asset?.asset_type ?? null,
    ownerName: buildUserDisplayName(ownerUser),
    status: plain.status,
    scheduledAt: plain.scheduled_at,
    startedAt: plain.started_at,
    completedAt: plain.completed_at,
    valuationAmount: plain.valuation_amount != null ? Number(plain.valuation_amount) : null,
    evaluatorName: buildStaffDisplayName(plain.evaluatedByStaff),
    createdAt: plain.created_at,
  };
}

function serializeEvaluationDetail(evaluation) {
  const row = serializeEvaluationListRow(evaluation);
  const plain = evaluation.get ? evaluation.get({ plain: true }) : evaluation;

  return {
    ...row,
    currency: plain.currency,
    reservePriceRecommendation: plain.reserve_price_recommendation != null
      ? Number(plain.reserve_price_recommendation)
      : null,
    photoUrls: normalizePhotoUrls(plain.photo_urls),
    reportUrl: plain.report_url,
    recommendation: plain.recommendation,
    notes: plain.notes,
    evaluatedByStaffId: plain.evaluated_by_staff_id,
    ownerUserId: plain.asset?.assetOwner?.user?.id ?? null,
    asset: plain.asset ? {
      id: plain.asset.id,
      title: plain.asset.title,
      assetType: plain.asset.asset_type,
      status: plain.asset.status,
      location: plain.asset.location,
      address: plain.asset.address,
      description: plain.asset.description,
      conditionNotes: plain.asset.condition_notes,
      ownershipDocumentUrl: plain.asset.ownership_document_url,
      imageUrls: Array.isArray(plain.asset.image_urls) ? plain.asset.image_urls : [],
      desiredReservePrice: plain.asset.desired_reserve_price != null
        ? Number(plain.asset.desired_reserve_price)
        : null,
    } : null,
    updatedAt: plain.updated_at,
  };
}

async function findEvaluationOrThrow(id) {
  const evaluation = await Evaluation.findOne({
    where: { id, deleted_at: null },
    include: evaluationInclude,
  });
  if (!evaluation) {
    throw new AppError('Evaluation not found', 404, 'EVALUATION_NOT_FOUND');
  }
  return evaluation;
}

export async function listEvaluations(options = {}) {
  const {
    page = 1,
    limit = 20,
    tab = null,
    status = null,
    search = null,
    includeStats = false,
  } = options;

  const where = { deleted_at: null, ...buildTabWhere(tab) };
  if (status && !tab) where.status = status;

  const assetInclude = {
    model: Asset,
    as: 'asset',
    required: false,
    include: [
      {
        model: AssetOwner,
        as: 'assetOwner',
        include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'organization_name'] }],
      },
    ],
  };

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    assetInclude.where = {
      [Op.or]: [
        { title: { [Op.like]: term } },
        { location: { [Op.like]: term } },
        { '$assetOwner.user.first_name$': { [Op.like]: term } },
        { '$assetOwner.user.last_name$': { [Op.like]: term } },
        { '$assetOwner.user.mobile_number$': { [Op.like]: term } },
        { '$assetOwner.user.organization_name$': { [Op.like]: term } },
      ],
    };
    assetInclude.required = true;
  }

  const { count, rows } = await Evaluation.findAndCountAll({
    where,
    include: [
      assetInclude,
      {
        model: Staff,
        as: 'evaluatedByStaff',
        required: false,
        include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });

  const result = {
    items: rows.map(serializeEvaluationListRow),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) || 0 },
  };

  if (includeStats) {
    result.stats = await getEvaluationStats();
  }

  return result;
}

export { getEvaluationStats };

export async function getEvaluationById(id) {
  const evaluation = await findEvaluationOrThrow(id);
  return serializeEvaluationDetail(evaluation);
}

export async function scheduleEvaluation(
  { assetId, scheduledAt, notes, evaluatedByStaffId },
  staffId,
) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const asset = await Asset.findOne({ where: { id: assetId, deleted_at: null } });
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }
  if (asset.status !== 'approved') {
    throw new AppError('Asset must be approved before evaluation', 400, 'INVALID_ASSET_STATUS');
  }

  const existing = await Evaluation.findOne({ where: { asset_id: assetId, deleted_at: null } });
  if (existing) {
    throw new AppError('Evaluation already exists for this asset', 409, 'EVALUATION_EXISTS');
  }

  const assigneeId = evaluatedByStaffId || staffId;

  const evaluation = await Evaluation.create({
    id: generateUuid(),
    asset_id: assetId,
    evaluated_by_staff_id: assigneeId,
    scheduled_at: scheduledAt ? new Date(scheduledAt) : new Date(),
    status: 'scheduled',
    notes: notes?.trim() || null,
    currency: 'ETB',
  });

  await asset.update({ status: 'under_evaluation' });

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Evaluation',
    entityId: evaluation.id,
    metadata: { assetId, scheduledAt },
  });

  const owner = await AssetOwner.findByPk(asset.asset_owner_id, { attributes: ['user_id'] });
  if (owner?.user_id) {
    await notificationService.createInAppNotification({
      userId: owner.user_id,
      type: 'general',
      title: 'Evaluation Scheduled',
      message: `An evaluation has been scheduled for your asset "${asset.title}".`,
      metadata: { evaluationId: evaluation.id, assetId },
    });
  }

  return getEvaluationById(evaluation.id);
}

export async function updateEvaluation(id, payload, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const evaluation = await findEvaluationOrThrow(id);
  if (!['scheduled', 'in_progress'].includes(evaluation.status)) {
    throw new AppError('Cannot update evaluation in its current status', 400, 'EVALUATION_LOCKED');
  }

  const updates = {};
  if (payload.scheduledAt !== undefined) updates.scheduled_at = payload.scheduledAt ? new Date(payload.scheduledAt) : null;
  if (payload.notes !== undefined) updates.notes = payload.notes?.trim() || null;
  if (payload.evaluatedByStaffId !== undefined) {
    updates.evaluated_by_staff_id = payload.evaluatedByStaffId || null;
  }
  if (payload.valuationAmount !== undefined) updates.valuation_amount = Number(payload.valuationAmount);
  if (payload.reservePriceRecommendation !== undefined) {
    updates.reserve_price_recommendation = Number(payload.reservePriceRecommendation);
  }
  if (payload.photoUrls !== undefined) updates.photo_urls = normalizePhotoUrls(payload.photoUrls);
  if (payload.reportUrl !== undefined) updates.report_url = payload.reportUrl?.trim() || null;

  await evaluation.update(updates);

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Evaluation',
    entityId: id,
    metadata: { fields: Object.keys(updates) },
  });

  return getEvaluationById(id);
}

export async function markInProgress(id, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const evaluation = await findEvaluationOrThrow(id);
  if (evaluation.status !== 'scheduled') {
    throw new AppError('Evaluation must be scheduled to start', 400, 'INVALID_EVALUATION_STATUS');
  }

  await evaluation.update({
    status: 'in_progress',
    started_at: new Date(),
    evaluated_by_staff_id: staffId,
  });

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Evaluation',
    entityId: id,
    metadata: { action: 'mark_in_progress' },
  });

  return getEvaluationById(id);
}

export async function completeEvaluation(id, payload, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const evaluation = await findEvaluationOrThrow(id);
  if (evaluation.status !== 'in_progress') {
    throw new AppError('Evaluation must be in progress to complete', 400, 'INVALID_EVALUATION_STATUS');
  }

  const valuationAmount = Number(payload.valuationAmount ?? evaluation.valuation_amount);
  if (!Number.isFinite(valuationAmount) || valuationAmount <= 0) {
    throw new AppError('Valuation amount is required', 400, 'VALUATION_REQUIRED');
  }

  const reservePrice = Number(
    payload.reservePriceRecommendation ?? evaluation.reserve_price_recommendation,
  );
  if (!Number.isFinite(reservePrice) || reservePrice <= 0) {
    throw new AppError('Reserve price recommendation is required', 400, 'RESERVE_PRICE_REQUIRED');
  }
  if (reservePrice > valuationAmount) {
    throw new AppError('Reserve price cannot exceed valuation amount', 400, 'RESERVE_PRICE_TOO_HIGH');
  }

  await evaluation.update({
    status: 'completed',
    completed_at: new Date(),
    evaluated_by_staff_id: staffId,
    valuation_amount: valuationAmount,
    reserve_price_recommendation: reservePrice,
    photo_urls: payload.photoUrls !== undefined
      ? normalizePhotoUrls(payload.photoUrls)
      : evaluation.photo_urls,
    report_url: payload.reportUrl?.trim() || evaluation.report_url,
    notes: payload.notes?.trim() || evaluation.notes,
  });

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Evaluation',
    entityId: id,
    metadata: { action: 'complete', valuationAmount },
  });

  return getEvaluationById(id);
}

export async function approveEvaluation(id, reviewNotes, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const evaluation = await findEvaluationOrThrow(id);
  if (evaluation.status !== 'completed') {
    throw new AppError('Evaluation must be completed before approval', 400, 'INVALID_EVALUATION_STATUS');
  }

  await evaluation.update({
    status: 'approved',
    recommendation: 'approved',
    notes: reviewNotes?.trim() || evaluation.notes,
    evaluated_by_staff_id: staffId,
  });

  const asset = await Asset.findByPk(evaluation.asset_id);
  if (asset) {
    await asset.update({ status: 'evaluated' });
    const owner = await AssetOwner.findByPk(asset.asset_owner_id, { attributes: ['user_id'] });
    if (owner?.user_id) {
      await notificationService.createInAppNotification({
        userId: owner.user_id,
        type: 'asset_approved',
        title: 'Evaluation Approved',
        message: `Your asset "${asset.title}" has been evaluated and approved for auction.`,
        metadata: { evaluationId: id, assetId: asset.id },
      });
    }
  }

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.APPROVE,
    entityType: 'Evaluation',
    entityId: id,
    metadata: { reviewNotes },
  });

  return getEvaluationById(id);
}

export async function rejectEvaluation(id, rejectionReason, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const reason = rejectionReason?.trim();
  if (!reason) {
    throw new AppError('Rejection reason is required', 400, 'REJECTION_REASON_REQUIRED');
  }

  const evaluation = await findEvaluationOrThrow(id);
  if (evaluation.status !== 'completed') {
    throw new AppError('Evaluation must be completed before rejection', 400, 'INVALID_EVALUATION_STATUS');
  }

  await evaluation.update({
    status: 'rejected',
    recommendation: 'rejected',
    notes: reason,
    evaluated_by_staff_id: staffId,
  });

  const asset = await Asset.findByPk(evaluation.asset_id);
  if (asset) {
    await asset.update({ status: 'approved' });
    const owner = await AssetOwner.findByPk(asset.asset_owner_id, { attributes: ['user_id'] });
    if (owner?.user_id) {
      await notificationService.createInAppNotification({
        userId: owner.user_id,
        type: 'asset_rejected',
        title: 'Evaluation Rejected',
        message: reason,
        metadata: { evaluationId: id, assetId: asset.id },
      });
    }
  }

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.REJECT,
    entityType: 'Evaluation',
    entityId: id,
    metadata: { rejectionReason: reason },
  });

  return getEvaluationById(id);
}

export async function rescheduleEvaluation(id, { scheduledAt, notes, evaluatedByStaffId }, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const evaluation = await findEvaluationOrThrow(id);
  if (evaluation.status !== 'rejected') {
    throw new AppError('Only rejected evaluations can be re-scheduled', 400, 'INVALID_EVALUATION_STATUS');
  }

  if (!scheduledAt) {
    throw new AppError('Scheduled date is required', 400, 'SCHEDULED_AT_REQUIRED');
  }

  await evaluation.update({
    status: 'scheduled',
    scheduled_at: new Date(scheduledAt),
    started_at: null,
    completed_at: null,
    valuation_amount: null,
    reserve_price_recommendation: null,
    photo_urls: null,
    report_url: null,
    recommendation: null,
    notes: notes?.trim() || null,
    evaluated_by_staff_id: evaluatedByStaffId || evaluation.evaluated_by_staff_id || staffId,
  });

  const asset = await Asset.findByPk(evaluation.asset_id);
  if (asset) {
    await asset.update({ status: 'under_evaluation' });
  }

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Evaluation',
    entityId: id,
    metadata: { action: 'reschedule', scheduledAt },
  });

  const owner = asset
    ? await AssetOwner.findByPk(asset.asset_owner_id, { attributes: ['user_id'] })
    : null;
  if (owner?.user_id && asset) {
    await notificationService.createInAppNotification({
      userId: owner.user_id,
      type: 'general',
      title: 'Evaluation Re-scheduled',
      message: `A new evaluation has been scheduled for your asset "${asset.title}".`,
      metadata: { evaluationId: id, assetId: asset.id },
    });
  }

  return getEvaluationById(id);
}

export async function listEligibleAssets({ search } = {}) {
  const where = { status: 'approved', deleted_at: null };
  const include = [
    {
      model: AssetOwner,
      as: 'assetOwner',
      include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name', 'mobile_number'] }],
    },
  ];

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { location: { [Op.like]: term } },
    ];
  }

  const assets = await Asset.findAll({
    where,
    include: [
      ...include,
      { model: Evaluation, as: 'evaluation', required: false, attributes: ['id'] },
    ],
    order: [['created_at', 'DESC']],
  });

  return assets
    .filter((asset) => !asset.evaluation)
    .map((asset) => {
      const plain = asset.get({ plain: true });
      return {
        id: plain.id,
        title: plain.title,
        assetType: plain.asset_type,
        location: plain.location,
        ownerName: buildUserDisplayName(plain.assetOwner?.user),
        submittedAt: plain.created_at,
      };
    });
}

export const evaluationService = Object.freeze({
  listEvaluations,
  getEvaluationStats,
  getEvaluationById,
  scheduleEvaluation,
  updateEvaluation,
  markInProgress,
  completeEvaluation,
  approveEvaluation,
  rejectEvaluation,
  rescheduleEvaluation,
  listEligibleAssets,
});

export default evaluationService;
