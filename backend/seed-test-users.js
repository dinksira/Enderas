/**
 * Local RBAC test-user seeder for enderass_auction.
 *
 * Usage (from backend/):
 *   npm run db:seed:test
 *
 * Credentials after seeding:
 *   Admin  — 0912345678 / pass1  (super_admin + staff)
 *   Bidder — 0987654321 / pass2  (external customer role, no staff)
 */

import './src/config/load-env.js';

import { Op } from 'sequelize';
import { sequelize } from './src/config/db.config.js';
import { User } from './src/models/user.model.js';
import { Role } from './src/models/role.model.js';
import { Staff } from './src/models/staff.model.js';
import { RefreshToken } from './src/models/refreshToken.model.js';
import { hashPassword, verifyPassword } from './src/utils/password.util.js';

const TEST_USERS = Object.freeze({
  admin: Object.freeze({
    id: 'a1000001-0001-4001-8001-000000000001',
    staffId: 'a2000001-0001-4001-8001-000000000001',
    mobileNumber: '0912345678',
    password: 'pass1',
    firstName: 'System',
    lastName: 'Admin',
    email: 'system.admin.test@enderass.local',
    employeeId: 'EMP-TEST-ADMIN-001',
    department: 'Executive Management',
  }),
  bidder: Object.freeze({
    id: 'a1000002-0002-4002-8002-000000000002',
    mobileNumber: '0987654321',
    password: 'pass2',
    firstName: 'Test',
    lastName: 'Bidder',
    email: 'test.bidder@enderass.local',
  }),
});

const EXTERNAL_ROLE_CODES = Object.freeze([
  'bidder',
  'customer',
  'user',
  'asset_owner',
]);

const DEFAULT_BIDDER_ROLE = Object.freeze({
  id: '3f64293e-93eb-4bc0-8839-5dadbfb12a5a',
  name: 'Bidder',
  code: 'bidder',
  description: JSON.stringify({
    summary: 'Participates in auctions by submitting bids and related payments.',
    permissions: {
      modules: ['bids', 'payments', 'cpo', 'notifications'],
      actions: ['create', 'read', 'update'],
      routes: [
        'POST /api/v1/bids',
        'GET /api/v1/bids/my',
        'POST /api/v1/payments',
        'GET /api/v1/payments',
        'POST /api/v1/cpo',
        'GET /api/v1/notifications',
      ],
    },
    permissionVersion: 1,
  }),
});

async function findRoleByCode(code) {
  return Role.findOne({
    where: { code, is_active: true },
    attributes: ['id', 'code', 'name'],
  });
}

/**
 * Resolves an external customer role. users.role_id is NOT NULL in schema,
 * so we never insert NULL — we find or create a bidder/customer role.
 */
async function resolveExternalCustomerRoleId(transaction) {
  for (const code of EXTERNAL_ROLE_CODES) {
    const role = await Role.findOne({
      where: { code, is_active: true },
      attributes: ['id', 'code', 'name'],
      transaction,
    });

    if (role) {
      return role;
    }
  }

  const [role] = await Role.upsert(
    {
      id: DEFAULT_BIDDER_ROLE.id,
      name: DEFAULT_BIDDER_ROLE.name,
      code: DEFAULT_BIDDER_ROLE.code,
      description: DEFAULT_BIDDER_ROLE.description,
      is_active: true,
    },
    { transaction },
  );

  return role;
}

async function purgeConflictingMobiles(mobileNumbers, transaction) {
  const users = await User.unscoped().findAll({
    where: { mobile_number: { [Op.in]: mobileNumbers } },
    attributes: ['id'],
    transaction,
  });

  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) {
    return;
  }

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
}

async function upsertUser(profile, roleId, passwordHash, transaction) {
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
      is_email_verified: profile === TEST_USERS.admin,
      status: 'active',
      failed_login_attempts: 0,
      deleted_at: null,
    },
    { transaction },
  );

  return profile.id;
}

async function upsertStaff(profile, userId, roleId, transaction) {
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

async function removeStaffForUser(userId, transaction) {
  await Staff.destroy({
    where: { user_id: userId },
    force: true,
    transaction,
  });
}

async function verifySeededLogin(mobileNumber, plainPassword) {
  const user = await User.unscoped().findOne({
    where: {
      mobile_number: mobileNumber,
      status: 'active',
      deleted_at: null,
    },
    attributes: ['id', 'password', 'mobile_number'],
  });

  if (!user) {
    return { mobileNumber, ok: false, reason: 'user not found' };
  }

  const ok = await verifyPassword(plainPassword, user.password);
  return { mobileNumber, ok, userId: user.id };
}

async function printSummary(transaction) {
  const rows = await sequelize.query(
    `
      SELECT
        u.id AS user_id,
        u.mobile_number,
        u.first_name,
        u.last_name,
        u.status,
        r.code AS user_role_code,
        s.id AS staff_id,
        s.department,
        sr.code AS staff_role_code,
        COALESCE(sr.code, r.code) AS effective_role_code
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      LEFT JOIN staff s
        ON s.user_id = u.id
       AND s.deleted_at IS NULL
       AND s.is_active = 1
      LEFT JOIN roles sr ON sr.id = s.role_id
      WHERE u.mobile_number IN (:adminMobile, :bidderMobile)
        AND u.deleted_at IS NULL
      ORDER BY u.mobile_number
    `,
    {
      replacements: {
        adminMobile: TEST_USERS.admin.mobileNumber,
        bidderMobile: TEST_USERS.bidder.mobileNumber,
      },
      type: sequelize.QueryTypes.SELECT,
      transaction,
    },
  );

  console.table(rows);
}

async function seedTestUsers() {
  const transaction = await sequelize.transaction();

  try {
    const superAdminRole = await findRoleByCode('super_admin');
    if (!superAdminRole) {
      throw new Error("Required role 'super_admin' was not found in roles table.");
    }

    const externalRole = await resolveExternalCustomerRoleId(transaction);

    const adminPasswordHash = await hashPassword(TEST_USERS.admin.password);
    const bidderPasswordHash = await hashPassword(TEST_USERS.bidder.password);

    await purgeConflictingMobiles(
      [TEST_USERS.admin.mobileNumber, TEST_USERS.bidder.mobileNumber],
      transaction,
    );

    const adminUserId = await upsertUser(
      TEST_USERS.admin,
      superAdminRole.id,
      adminPasswordHash,
      transaction,
    );

    await upsertStaff(
      TEST_USERS.admin,
      adminUserId,
      superAdminRole.id,
      transaction,
    );

    const bidderUserId = await upsertUser(
      TEST_USERS.bidder,
      externalRole.id,
      bidderPasswordHash,
      transaction,
    );

    await removeStaffForUser(bidderUserId, transaction);

    await transaction.commit();

    const adminCheck = await verifySeededLogin(
      TEST_USERS.admin.mobileNumber,
      TEST_USERS.admin.password,
    );
    const bidderCheck = await verifySeededLogin(
      TEST_USERS.bidder.mobileNumber,
      TEST_USERS.bidder.password,
    );

    console.log('\n[seed] bcrypt verification (backend config, 12 rounds):');
    console.log(`  Admin  ${adminCheck.ok ? 'OK' : 'FAILED'} — ${TEST_USERS.admin.mobileNumber} / pass1`);
    console.log(`  Bidder ${bidderCheck.ok ? 'OK' : 'FAILED'} — ${TEST_USERS.bidder.mobileNumber} / pass2`);

    console.log('\n[seed] effective RBAC snapshot:');
    await printSummary();

    console.log('\n[seed] completed successfully.');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('[seed] failed:', error);
    process.exit(1);
  }
}

await sequelize.authenticate();
console.log('[db] connected');
await seedTestUsers();
