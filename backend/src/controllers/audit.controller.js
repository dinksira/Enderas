import { sendSuccess } from '../utils/response.util.js';
import { AppError } from '../utils/error.util.js';
import { auditService } from '../services/audit.service.js';

export async function listAuditLogs(req, res, next) {
  try {
    const {
      page,
      limit,
      action,
      entityType,
      entityId,
      userId,
      staffId,
      search,
      dateFrom,
      dateTo,
    } = req.query;

    const result = await auditService.listAuditLogs({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      action: action || null,
      entityType: entityType || null,
      entityId: entityId || null,
      userId: userId || null,
      staffId: staffId || null,
      search: search || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getAuditLogById(req, res, next) {
  try {
    const auditLog = await auditService.getAuditLogById(req.params.id);

    if (!auditLog) {
      throw new AppError('Audit log not found', 404, 'AUDIT_LOG_NOT_FOUND');
    }

    return sendSuccess(res, { auditLog });
  } catch (error) {
    return next(error);
  }
}

export async function listAuditLogsForEntity(req, res, next) {
  try {
    const { entityType, entityId } = req.params;
    const { page, limit } = req.query;

    const result = await auditService.listAuditLogs({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      entityType,
      entityId,
    });

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export const auditController = Object.freeze({
  listAuditLogs,
  getAuditLogById,
  listAuditLogsForEntity,
});

export default auditController;
