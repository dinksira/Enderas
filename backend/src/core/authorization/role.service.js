import { Role } from '../../models/role.model.js';
import { normalizeRolePermissions } from '../../schemas/permission.schema.js';
import { getRolePermissions } from '../../services/permission.service.js';
import { AppError } from '../../utils/error.util.js';

export async function getRoleById(roleId) {
  const role = await Role.findByPk(roleId, {
    attributes: ['id', 'name', 'code', 'description', 'is_active', 'updated_at'],
  });

  if (!role || !role.is_active) {
    throw new AppError('Role not found or inactive', 404, 'ROLE_NOT_FOUND');
  }

  return role.get({ plain: true });
}

export async function getRoleByCode(roleCode) {
  const role = await Role.findOne({
    where: { code: roleCode, is_active: true },
    attributes: ['id', 'name', 'code', 'description', 'is_active', 'updated_at'],
  });

  if (!role) {
    throw new AppError('Role not found or inactive', 404, 'ROLE_NOT_FOUND');
  }

  return role.get({ plain: true });
}

export async function getRolePermissionMatrix(roleId) {
  return getRolePermissions(roleId);
}

export async function parseRoleDescription(role) {
  return normalizeRolePermissions(role);
}

export const roleService = Object.freeze({
  getRoleById,
  getRoleByCode,
  getRolePermissionMatrix,
  parseRoleDescription,
});

export default roleService;
