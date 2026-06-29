import { Staff, Role } from '../models/index.js';
import { AppError } from './error.util.js';

export async function resolveStaffRoleCode(staffId) {
  if (!staffId) {
    return null;
  }

  const staff = await Staff.findByPk(staffId, {
    include: [{ model: Role, as: 'role', attributes: ['code'] }],
  });

  return staff?.role?.code ?? null;
}

export async function assertStaffRole(staffId, allowedRoleCodes, message, code = 'FORBIDDEN_ROLE') {
  const roleCode = await resolveStaffRoleCode(staffId);
  if (!roleCode || !allowedRoleCodes.includes(roleCode)) {
    throw new AppError(message, 403, code);
  }
}
