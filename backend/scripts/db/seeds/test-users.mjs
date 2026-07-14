import { TEST_USERS } from '../data/test-users.mjs';
import { hashPassword } from '../../../src/utils/password.util.js';
import {
  findRoleByCode,
  purgeUsersByMobiles,
  upsertUser,
  upsertStaff,
  removeStaffForUser,
} from './shared.mjs';

export async function seedTestUsers({ transaction, logger = console }) {
  const superAdminRole = await findRoleByCode('super_admin', transaction);
  if (!superAdminRole) {
    throw new Error("Required role 'super_admin' was not found. Run migrations or seed normal first.");
  }

  const bidderRole = await findRoleByCode('bidder', transaction);
  if (!bidderRole) {
    throw new Error("Required role 'bidder' was not found. Run migrations or seed normal first.");
  }

  await purgeUsersByMobiles(
    [
      TEST_USERS.admin.mobileNumber,
      TEST_USERS.owner.mobileNumber,
      TEST_USERS.bidder.mobileNumber,
    ],
    transaction,
  );

  const adminPasswordHash = await hashPassword(TEST_USERS.admin.password);
  const ownerPasswordHash = await hashPassword(TEST_USERS.owner.password);
  const bidderPasswordHash = await hashPassword(TEST_USERS.bidder.password);

  const adminUserId = await upsertUser(
    TEST_USERS.admin,
    superAdminRole.id,
    adminPasswordHash,
    transaction,
  );

  await upsertStaff(TEST_USERS.admin, adminUserId, superAdminRole.id, transaction);

  const ownerUserId = await upsertUser(
    TEST_USERS.owner,
    bidderRole.id,
    ownerPasswordHash,
    transaction,
  );

  await removeStaffForUser(ownerUserId, transaction);

  const bidderUserId = await upsertUser(
    TEST_USERS.bidder,
    bidderRole.id,
    bidderPasswordHash,
    transaction,
  );

  await removeStaffForUser(bidderUserId, transaction);

  logger.log(
    '[seed] upserted test admin (0912345678 / pass1), owner (0987654321 / pass2), bidder (0998765432 / pass3)',
  );
}
