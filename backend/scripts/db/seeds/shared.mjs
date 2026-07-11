import { Op } from 'sequelize';

import { sequelize } from '../../../src/config/db.config.js';
import { Role } from '../../../src/models/role.model.js';
import { User } from '../../../src/models/user.model.js';
import { Staff } from '../../../src/models/staff.model.js';
import { RefreshToken } from '../../../src/models/refreshToken.model.js';
import { SystemSetting } from '../../../src/models/systemSetting.model.js';
import { hashPassword } from '../../../src/utils/password.util.js';
import { rolePermissions } from '../lib/role-permissions.mjs';

const {
  ROLE_SEEDS,
  DEFAULT_SETTINGS,
  SUPER_ADMIN_USER_ID,
  SUPER_ADMIN_STAFF_ID,
  SUPER_ADMIN_PASSWORD_HASH,
  ROLE_IDS,
} = rolePermissions;

export async function seedBaseline({ transaction, logger = console }) {
  const now = new Date();

  for (const role of ROLE_SEEDS) {
    await Role.upsert(
      {
        id: role.id,
        name: role.name,
        code: role.code,
        description: JSON.stringify(role.description),
        is_active: Boolean(role.is_active),
      },
      { transaction },
    );
  }
  logger.log(`[seed] upserted ${ROLE_SEEDS.length} roles`);

  await User.upsert(
    {
      id: SUPER_ADMIN_USER_ID,
      role_id: ROLE_IDS.super_admin,
      user_type: 'individual',
      mobile_number: '+251900000000',
      email: 'admin@enderass.com',
      password: SUPER_ADMIN_PASSWORD_HASH,
      first_name: 'System',
      last_name: 'Administrator',
      preferred_language: 'en',
      is_mobile_verified: true,
      is_email_verified: true,
      status: 'active',
      failed_login_attempts: 0,
      deleted_at: null,
    },
    { transaction },
  );

  await Staff.upsert(
    {
      id: SUPER_ADMIN_STAFF_ID,
      user_id: SUPER_ADMIN_USER_ID,
      role_id: ROLE_IDS.super_admin,
      department: 'Administration',
      is_active: true,
      activated_at: now,
      deactivated_at: null,
      deleted_at: null,
    },
    { transaction },
  );
  logger.log('[seed] upserted production super-admin (+251900000000)');

  for (const row of DEFAULT_SETTINGS) {
    await SystemSetting.upsert(
      {
        id: row.id,
        setting_key: row.setting_key,
        setting_value: row.setting_value,
        description: row.description,
      },
      { transaction },
    );
  }
  logger.log(`[seed] upserted ${DEFAULT_SETTINGS.length} system settings`);
}

export async function findRoleByCode(code, transaction) {
  return Role.findOne({
    where: { code, is_active: true },
    attributes: ['id', 'code', 'name'],
    transaction,
  });
}

export async function purgeUsersByMobiles(mobileNumbers, transaction) {
  const users = await User.unscoped().findAll({
    where: { mobile_number: { [Op.in]: mobileNumbers } },
    attributes: ['id'],
    transaction,
  });

  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) {
    return [];
  }

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

  await RefreshToken.destroy({
    where: { user_id: { [Op.in]: userIds } },
    transaction,
  });

  await Staff.destroy({
    where: { user_id: { [Op.in]: userIds } },
    force: true,
    transaction,
  });

  await User.destroy({
    where: { id: { [Op.in]: userIds } },
    force: true,
    transaction,
  });

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });

  return userIds;
}

export async function upsertUser(profile, roleId, passwordHash, transaction) {
  await User.upsert(
    {
      id: profile.id,
      role_id: roleId,
      user_type: 'individual',
      mobile_number: profile.mobileNumber,
      email: profile.email,
      password: passwordHash,
      first_name: profile.firstName,
      last_name: profile.lastName,
      preferred_language: 'en',
      is_mobile_verified: true,
      is_email_verified: profile.roleCode === 'super_admin',
      status: 'active',
      failed_login_attempts: 0,
      deleted_at: null,
    },
    { transaction },
  );

  return profile.id;
}

export async function upsertStaff(profile, userId, roleId, transaction) {
  await Staff.upsert(
    {
      id: profile.staffId,
      user_id: userId,
      role_id: roleId,
      employee_id: profile.employeeId,
      department: profile.department,
      is_active: true,
      activated_at: new Date(),
      deactivated_at: null,
      deleted_at: null,
    },
    { transaction },
  );
}

export async function removeStaffForUser(userId, transaction) {
  await Staff.destroy({
    where: { user_id: userId },
    force: true,
    transaction,
  });
}
