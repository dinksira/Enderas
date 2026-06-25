import { Op } from 'sequelize';
import { sequelize } from '../config/db.config.js';
import { User, Staff, Role } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { hashPassword } from '../utils/password.util.js';
import { getMobileLookupCandidates } from '../utils/mobile.util.js';
import { invalidateRolePermissionCache } from '../middleware/auth.middleware.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { USER_STATUSES } from './kyc.service.js';
import { buildRolePermissionProfile, getPermissionCatalog } from './role-admin.service.js';

const NON_STAFF_ROLE_CODES = Object.freeze(['bidder', 'asset_owner']);

function buildDisplayName(user) {
  if (!user) return null;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fullName || user.organization_name || user.mobile_number || null;
}

export async function assertStaffRole(roleId) {
  const role = await Role.findOne({ where: { id: roleId, is_active: true } });
  if (!role) {
    throw new AppError('Role not found or inactive', 404, 'ROLE_NOT_FOUND');
  }

  if (NON_STAFF_ROLE_CODES.includes(role.code)) {
    throw new AppError('Selected role cannot be assigned to staff', 400, 'INVALID_STAFF_ROLE');
  }

  return role;
}

export function serializeStaffListRow(staff) {
  const user = staff.user;
  return {
    id: staff.id,
    employeeId: staff.employee_id,
    department: staff.department,
    isActive: staff.is_active,
    displayName: buildDisplayName(user),
    mobileNumber: user?.mobile_number ?? null,
    email: user?.email ?? null,
    roleCode: staff.role?.code ?? null,
    roleName: staff.role?.name ?? null,
    activatedAt: staff.activated_at,
    deactivatedAt: staff.deactivated_at,
    createdAt: staff.created_at,
  };
}

export function serializeStaffDetail(staff) {
  const user = staff.user;
  const createdBy = staff.createdByStaff?.user;
  const roleProfile = staff.role ? buildRolePermissionProfile(staff.role, staff.role?.staffMembersCount ?? 0) : null;

  return {
    id: staff.id,
    userId: staff.user_id,
    employeeId: staff.employee_id,
    department: staff.department,
    isActive: staff.is_active,
    activatedAt: staff.activated_at,
    deactivatedAt: staff.deactivated_at,
    roleId: staff.role_id,
    roleCode: staff.role?.code ?? null,
    roleName: staff.role?.name ?? null,
    roleSummary: roleProfile?.summary ?? null,
    rolePermissions: roleProfile?.permissions ?? null,
    rolePermissionMatrix: roleProfile?.matrix ?? [],
    roleAffectedStaffCount: roleProfile?.affectedStaffCount ?? 0,
    permissionCatalog: roleProfile?.catalog ?? null,
    roleIsWildcard: roleProfile?.wildcard ?? false,
    createdAt: staff.created_at,
    createdByStaffId: staff.created_by_staff_id,
    createdByName: buildDisplayName(createdBy),
    user: user
      ? {
          id: user.id,
          displayName: buildDisplayName(user),
          mobileNumber: user.mobile_number,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          status: user.status,
          preferredLanguage: user.preferred_language,
        }
      : null,
  };
}

async function fetchStaffStats() {
  const [active, inactive] = await Promise.all([
    Staff.count({ where: { is_active: true } }),
    Staff.count({ where: { is_active: false } }),
  ]);

  return { active, inactive, all: active + inactive };
}

const staffIncludes = [
  {
    model: User,
    as: 'user',
    attributes: [
      'id',
      'first_name',
      'last_name',
      'mobile_number',
      'email',
      'status',
      'organization_name',
    ],
  },
  {
    model: Role,
    as: 'role',
    attributes: ['id', 'name', 'code', 'description', 'is_active'],
  },
];

/**
 * @param {object} options
 */
export async function listStaff(options = {}) {
  const {
    page = 1,
    limit = 20,
    search = null,
    department = null,
    isActive = null,
    includeStats = false,
  } = options;

  const where = {};

  if (department) {
    where.department = department;
  }

  if (isActive === true || isActive === 'true' || isActive === '1') {
    where.is_active = true;
  } else if (isActive === false || isActive === 'false' || isActive === '0') {
    where.is_active = false;
  }

  if (search) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { employee_id: { [Op.like]: term } },
      { department: { [Op.like]: term } },
      { '$user.first_name$': { [Op.like]: term } },
      { '$user.last_name$': { [Op.like]: term } },
      { '$user.mobile_number$': { [Op.like]: term } },
      { '$user.email$': { [Op.like]: term } },
    ];
  }

  const { rows, count } = await Staff.findAndCountAll({
    where,
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
          'status',
          'organization_name',
        ],
      },
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'code'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });

  const result = {
    staff: rows.map(serializeStaffListRow),
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit) || 1,
    },
  };

  if (includeStats) {
    result.stats = await fetchStaffStats();
  }

  return result;
}

export async function getStaffStats() {
  return fetchStaffStats();
}

export async function getStaffById(id) {
  const staff = await Staff.findByPk(id, {
    include: [
      ...staffIncludes,
      {
        model: Staff,
        as: 'createdByStaff',
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
    ],
  });

  if (!staff) {
    throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
  }

  if (staff.role) {
    staff.role.setDataValue(
      'staffMembersCount',
      await Staff.count({ where: { role_id: staff.role_id, deleted_at: null } }),
    );
  }

  return serializeStaffDetail(staff);
}

export async function createStaff(payload, actorStaffId) {
  const {
    mobileNumber,
    password,
    roleId,
    firstName,
    lastName,
    email,
    employeeId,
    department,
    preferredLanguage = 'en',
  } = payload;

  if (!mobileNumber || !password || !roleId) {
    throw new AppError('Mobile number, password, and role are required', 400, 'VALIDATION_ERROR');
  }

  await assertStaffRole(roleId);

  const lookupCandidates = getMobileLookupCandidates(mobileNumber);
  const existingUser = await User.unscoped().findOne({
    where: {
      mobile_number: { [Op.in]: lookupCandidates },
      deleted_at: null,
    },
  });

  if (existingUser) {
    throw new AppError('Mobile number already registered', 400, 'DUPLICATE_MOBILE');
  }

  if (employeeId) {
    const existingEmployee = await Staff.findOne({
      where: { employee_id: employeeId, deleted_at: null },
    });
    if (existingEmployee) {
      throw new AppError('Employee ID already in use', 400, 'DUPLICATE_EMPLOYEE_ID');
    }
  }

  const hashedPassword = await hashPassword(password);
  const now = new Date();

  const result = await sequelize.transaction(async (transaction) => {
    const user = await User.create(
      {
        id: generateUuid(),
        role_id: roleId,
        user_type: 'individual',
        mobile_number: mobileNumber,
        email: email || null,
        password: hashedPassword,
        first_name: firstName || null,
        last_name: lastName || null,
        preferred_language: preferredLanguage,
        is_mobile_verified: true,
        is_email_verified: false,
        status: USER_STATUSES.ACTIVE,
        failed_login_attempts: 0,
      },
      { transaction },
    );

    const staff = await Staff.create(
      {
        id: generateUuid(),
        user_id: user.id,
        role_id: roleId,
        employee_id: employeeId || null,
        department: department || null,
        is_active: true,
        activated_at: now,
        deactivated_at: null,
        created_by_staff_id: actorStaffId,
      },
      { transaction },
    );

    return staff.id;
  });

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Staff',
    entityId: result,
    newValues: {
      mobile_number: mobileNumber,
      role_id: roleId,
      employee_id: employeeId || null,
      department: department || null,
    },
  });

  return getStaffById(result);
}

export async function updateStaff(id, payload, actorStaffId) {
  const staff = await Staff.findByPk(id, {
    include: [{ model: User, as: 'user' }],
  });

  if (!staff) {
    throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
  }

  const oldValues = {
    employee_id: staff.employee_id,
    department: staff.department,
    role_id: staff.role_id,
    is_active: staff.is_active,
  };

  const updates = {};
  const userUpdates = {};

  if (payload.firstName !== undefined) {
    userUpdates.first_name = payload.firstName || null;
  }

  if (payload.lastName !== undefined) {
    userUpdates.last_name = payload.lastName || null;
  }

  if (payload.email !== undefined) {
    userUpdates.email = payload.email || null;
  }

  if (payload.preferredLanguage !== undefined) {
    userUpdates.preferred_language = payload.preferredLanguage || 'en';
  }

  if (payload.employeeId !== undefined) {
    if (payload.employeeId) {
      const duplicate = await Staff.findOne({
        where: {
          employee_id: payload.employeeId,
          id: { [Op.ne]: id },
          deleted_at: null,
        },
      });
      if (duplicate) {
        throw new AppError('Employee ID already in use', 400, 'DUPLICATE_EMPLOYEE_ID');
      }
    }
    updates.employee_id = payload.employeeId || null;
  }

  if (payload.department !== undefined) {
    updates.department = payload.department || null;
  }

  if (payload.roleId !== undefined && payload.roleId !== staff.role_id) {
    await assertStaffRole(payload.roleId);
    updates.role_id = payload.roleId;
  }

  if (payload.isActive !== undefined) {
    updates.is_active = Boolean(payload.isActive);
    if (updates.is_active) {
      updates.activated_at = new Date();
      updates.deactivated_at = null;
    } else {
      updates.deactivated_at = new Date();
    }
  }

  if (updates.role_id) {
    userUpdates.role_id = updates.role_id;
  }

  const hasStaffUpdates = Object.keys(updates).length > 0;
  const hasUserUpdates = Object.keys(userUpdates).length > 0;

  if (!hasStaffUpdates && !hasUserUpdates) {
    return getStaffById(id);
  }

  if (hasStaffUpdates) {
    await staff.update(updates);

    if (updates.role_id) {
      await invalidateRolePermissionCache(updates.role_id);
    }
  }

  if (hasUserUpdates) {
    await staff.user.update(userUpdates);
  }

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Staff',
    entityId: staff.id,
    oldValues,
    newValues: { ...updates, ...userUpdates },
  });

  return getStaffById(id);
}

export async function deactivateStaff(id, actorStaffId) {
  if (actorStaffId === id) {
    throw new AppError('You cannot deactivate your own staff account', 400, 'SELF_DEACTIVATE');
  }

  const staff = await Staff.findByPk(id, {
    include: [{ model: User, as: 'user' }],
  });

  if (!staff) {
    throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
  }

  if (!staff.is_active) {
    return getStaffById(id);
  }

  await staff.update({
    is_active: false,
    deactivated_at: new Date(),
  });

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Staff',
    entityId: staff.id,
    oldValues: { is_active: true },
    newValues: { is_active: false },
    metadata: { action: 'deactivate' },
  });

  return getStaffById(id);
}

export async function deleteStaff(id, actorStaffId) {
  if (actorStaffId === id) {
    throw new AppError('You cannot delete your own staff account', 400, 'SELF_DELETE');
  }

  const staff = await Staff.findByPk(id);
  if (!staff) {
    throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
  }

  await staff.destroy();

  await auditService.writeAuditLog({
    staffId: actorStaffId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'Staff',
    entityId: id,
    oldValues: {
      user_id: staff.user_id,
      role_id: staff.role_id,
      employee_id: staff.employee_id,
    },
  });

  return { deleted: true, id };
}

export async function listAssignableRoles() {
  const roles = await Role.findAll({
    where: {
      is_active: true,
      code: { [Op.notIn]: NON_STAFF_ROLE_CODES },
    },
    attributes: ['id', 'name', 'code', 'description', 'is_active'],
    order: [['name', 'ASC']],
  });

  const permissionCatalog = getPermissionCatalog();
  const affectedCounts = await Promise.all(
    roles.map((role) => Staff.count({ where: { role_id: role.id, deleted_at: null } })),
  );

  return {
    roles: roles.map((role, index) => ({
      id: role.id,
      name: role.name,
      code: role.code,
      ...buildRolePermissionProfile(role, affectedCounts[index]),
    })),
    permissionCatalog: {
      modules: permissionCatalog.modules,
      actions: permissionCatalog.actions,
    },
  };
}

export const staffService = Object.freeze({
  listStaff,
  getStaffStats,
  getStaffById,
  createStaff,
  updateStaff,
  deactivateStaff,
  deleteStaff,
  listAssignableRoles,
  serializeStaffListRow,
  serializeStaffDetail,
  assertStaffRole,
});

export default staffService;
