import { Op } from 'sequelize';
import { AuditLog, User, Staff } from '../models/index.js';
import { generateUuid } from '../utils/crypto.util.js';

export const AUDIT_ACTIONS = Object.freeze({
  LOGIN: 'LOGIN',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ROLE_CHANGE: 'ROLE_CHANGE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  PUBLISH: 'PUBLISH',
  CLOSE: 'CLOSE',
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

function buildActorName(user) {
  if (!user) return null;
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return full || user.organization_name || user.mobile_number || null;
}

function serializeAuditLogRow(log) {
  const actorUser = log.user;
  const actorStaff = log.staff?.user;
  return {
    id: log.id,
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    userId: log.user_id,
    staffId: log.staff_id,
    actorName: buildActorName(actorStaff) || buildActorName(actorUser) || 'System',
    ipAddress: log.ip_address,
    createdAt: log.created_at,
  };
}

/**
 * @param {{
 *   page?: number,
 *   limit?: number,
 *   action?: string|null,
 *   entityType?: string|null,
 *   entityId?: string|null,
 *   userId?: string|null,
 *   staffId?: string|null,
 *   search?: string|null,
 *   dateFrom?: string|null,
 *   dateTo?: string|null,
 * }} options
 */
export async function listAuditLogs(options = {}) {
  const {
    page = 1,
    limit = 20,
    action = null,
    entityType = null,
    entityId = null,
    userId = null,
    staffId = null,
    search = null,
    dateFrom = null,
    dateTo = null,
  } = options;

  const where = {};

  if (action) where.action = action;
  if (entityType) where.entity_type = entityType;
  if (entityId) where.entity_id = entityId;
  if (userId) where.user_id = userId;
  if (staffId) where.staff_id = staffId;

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = end;
    }
  }

  const include = [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'organization_name'],
      required: false,
    },
    {
      model: Staff,
      as: 'staff',
      attributes: ['id', 'employee_id'],
      required: false,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'mobile_number'],
        },
      ],
    },
  ];

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include,
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  let logs = rows;
  if (search) {
    const term = search.toLowerCase();
    logs = rows.filter((log) => {
      const serialized = serializeAuditLogRow(log);
      return (
        serialized.action?.toLowerCase().includes(term)
        || serialized.entityType?.toLowerCase().includes(term)
        || serialized.actorName?.toLowerCase().includes(term)
      );
    });
  }

  return {
    auditLogs: logs.map(serializeAuditLogRow),
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit) || 1,
    },
  };
}

/**
 * @param {string} id
 */
export async function getAuditLogById(id) {
  const log = await AuditLog.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'organization_name'],
      },
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'employee_id'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'mobile_number'],
          },
        ],
      },
    ],
  });

  if (!log) {
    return null;
  }

  return {
    ...serializeAuditLogRow(log),
    userAgent: log.user_agent,
    oldValues: log.old_values,
    newValues: log.new_values,
    metadata: log.metadata,
  };
}

export const auditService = Object.freeze({
  writeAuditLog,
  logLogin,
  logAccessDenied,
  logApproval,
  logRejection,
  listAuditLogs,
  getAuditLogById,
  AUDIT_ACTIONS,
});

export default auditService;
