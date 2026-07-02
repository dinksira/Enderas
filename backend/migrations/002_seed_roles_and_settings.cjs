'use strict';

const {
  ROLE_IDS,
  ROLE_SEEDS,
  DEFAULT_SETTINGS,
  SUPER_ADMIN_USER_ID,
  SUPER_ADMIN_STAFF_ID,
  SUPER_ADMIN_PASSWORD_HASH,
} = require('./data/role-permissions.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'roles',
      ROLE_SEEDS.map((role) => ({
        id: role.id,
        name: role.name,
        code: role.code,
        description: JSON.stringify(role.description),
        is_active: role.is_active,
        created_at: now,
        updated_at: now,
      })),
    );

    await queryInterface.bulkInsert('users', [
      {
        id: SUPER_ADMIN_USER_ID,
        role_id: ROLE_IDS.super_admin,
        user_type: 'individual',
        mobile_number: '+251900000000',
        email: 'admin@enderass.com',
        password: SUPER_ADMIN_PASSWORD_HASH,
        national_id_number: null,
        tin_number: null,
        first_name: 'System',
        last_name: 'Administrator',
        organization_name: null,
        preferred_language: 'en',
        is_mobile_verified: 1,
        is_email_verified: 1,
        status: 'active',
        last_login_at: null,
        failed_login_attempts: 0,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

    await queryInterface.bulkInsert('staff', [
      {
        id: SUPER_ADMIN_STAFF_ID,
        user_id: SUPER_ADMIN_USER_ID,
        role_id: ROLE_IDS.super_admin,
        employee_id: null,
        department: 'Administration',
        is_active: 1,
        activated_at: now,
        deactivated_at: null,
        created_by_staff_id: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

    await queryInterface.bulkInsert(
      'system_settings',
      DEFAULT_SETTINGS.map((row) => ({
        id: row.id,
        setting_key: row.setting_key,
        setting_value: JSON.stringify(row.setting_value),
        description: row.description,
        updated_by_staff_id: null,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('system_settings', null, {});
    await queryInterface.bulkDelete('staff', { id: SUPER_ADMIN_STAFF_ID }, {});
    await queryInterface.bulkDelete('users', { id: SUPER_ADMIN_USER_ID }, {});
    await queryInterface.bulkDelete('roles', null, {});
  },
};
