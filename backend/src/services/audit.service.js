import { AuditLog } from '../models/auditLog.model.js';
import { generateUuid } from '../utils/crypto.util.js';

export const AUDIT_ACTIONS = Object.freeze({
  LOGIN: 'LOGIN',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ROLE_CHANGE: 'ROLE_CHANGE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  PUBLISH: 'PUBLISH',
  DELETE: 'DELETE',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
});

/**
 * @param {{
 *   userId?: string|null,
 *   staffId?: string|null,
 *   action: string,
 *   entityType?: string|null,
 *   entityId?: string|null,
 *   ipAddress?: string|null,
 *   userAgent?: string|null,
 *   oldValues?: object|null,
 *   newValues?: object|null,
 *   metadata?: object|null,
 * }} entry
 */
export async function writeAuditLog(entry) {
  try {
    await AuditLog.create({
      id: generateUuid(),
      user_id: entry.userId ?? null,
      staff_id: entry.staffId ?? null,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
      old_values: entry.oldValues ?? null,
      new_values: entry.newValues ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (error) {
    console.warn('[audit.service] write failed:', error.message);
  }
}

export async function logLogin(req, userId, metadata = {}) {
  return writeAuditLog({
    userId,
    staffId: req.user?.staffId ?? req.auth?.staffId ?? null,
    action: AUDIT_ACTIONS.LOGIN,
    entityType: 'User',
    entityId: userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    metadata,
  });
}

export async function logAccessDenied(req, context = {}) {
  return writeAuditLog({
    userId: req.user?.id ?? req.auth?.userId ?? null,
    staffId: req.user?.staffId ?? req.auth?.staffId ?? null,
    action: AUDIT_ACTIONS.ACCESS_DENIED,
    entityType: 'Route',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    metadata: {
      method: req.method,
      path: req.originalUrl,
      ...context,
    },
  });
}

export async function logApproval(req, entityType, entityId, metadata = {}) {
  return writeAuditLog({
    userId: req.user?.id ?? req.auth?.userId ?? null,
    staffId: req.user?.staffId ?? req.auth?.staffId ?? null,
    action: AUDIT_ACTIONS.APPROVE,
    entityType,
    entityId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    metadata,
  });
}

export async function logRejection(req, entityType, entityId, metadata = {}) {
  return writeAuditLog({
    userId: req.user?.id ?? req.auth?.userId ?? null,
    staffId: req.user?.staffId ?? req.auth?.staffId ?? null,
    action: AUDIT_ACTIONS.REJECT,
    entityType,
    entityId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    metadata,
  });
}

export const auditService = Object.freeze({
  writeAuditLog,
  logLogin,
  logAccessDenied,
  logApproval,
  logRejection,
  AUDIT_ACTIONS,
});

export default auditService;
