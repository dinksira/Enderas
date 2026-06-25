import { sendSuccess } from '../utils/response.util.js';
import { evaluationService } from '../services/evaluation.service.js';

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

export async function listEvaluations(req, res, next) {
  try {
    const { page, limit, tab, status, search, includeStats } = req.query;
    const result = await evaluationService.listEvaluations({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      tab: tab || null,
      status: status || null,
      search: search || null,
      includeStats: includeStats === 'true',
    });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getEvaluationById(req, res, next) {
  try {
    const evaluation = await evaluationService.getEvaluationById(req.params.id);
    return sendSuccess(res, { evaluation });
  } catch (error) {
    return next(error);
  }
}

export async function scheduleEvaluation(req, res, next) {
  try {
    const evaluation = await evaluationService.scheduleEvaluation(
      {
        assetId: req.body.assetId || req.body.asset_id,
        scheduledAt: req.body.scheduledAt || req.body.scheduled_at,
        notes: req.body.notes,
        evaluatedByStaffId: req.body.evaluatedByStaffId || req.body.evaluated_by_staff_id,
      },
      resolveStaffId(req),
    );
    return sendSuccess(res, { evaluation }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateEvaluation(req, res, next) {
  try {
    const evaluation = await evaluationService.updateEvaluation(
      req.params.id,
      req.body,
      resolveStaffId(req),
    );
    return sendSuccess(res, { evaluation });
  } catch (error) {
    return next(error);
  }
}

export async function markInProgress(req, res, next) {
  try {
    const evaluation = await evaluationService.markInProgress(req.params.id, resolveStaffId(req));
    return sendSuccess(res, { evaluation });
  } catch (error) {
    return next(error);
  }
}

export async function completeEvaluation(req, res, next) {
  try {
    const evaluation = await evaluationService.completeEvaluation(
      req.params.id,
      req.body,
      resolveStaffId(req),
    );
    return sendSuccess(res, { evaluation });
  } catch (error) {
    return next(error);
  }
}

export async function approveEvaluation(req, res, next) {
  try {
    const evaluation = await evaluationService.approveEvaluation(
      req.params.id,
      req.body.reviewNotes || req.body.notes || null,
      resolveStaffId(req),
    );
    return sendSuccess(res, { evaluation });
  } catch (error) {
    return next(error);
  }
}

export async function rejectEvaluation(req, res, next) {
  try {
    const evaluation = await evaluationService.rejectEvaluation(
      req.params.id,
      req.body.rejectionReason || req.body.reason,
      resolveStaffId(req),
    );
    return sendSuccess(res, { evaluation });
  } catch (error) {
    return next(error);
  }
}

export async function rescheduleEvaluation(req, res, next) {
  try {
    const evaluation = await evaluationService.rescheduleEvaluation(
      req.params.id,
      {
        scheduledAt: req.body.scheduledAt || req.body.scheduled_at,
        notes: req.body.notes,
        evaluatedByStaffId: req.body.evaluatedByStaffId || req.body.evaluated_by_staff_id,
      },
      resolveStaffId(req),
    );
    return sendSuccess(res, { evaluation });
  } catch (error) {
    return next(error);
  }
}

export async function listEligibleAssets(req, res, next) {
  try {
    const items = await evaluationService.listEligibleAssets({ search: req.query.search });
    return sendSuccess(res, { items });
  } catch (error) {
    return next(error);
  }
}

export const evaluationController = Object.freeze({
  listEvaluations,
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

export default evaluationController;
