import { OPERATIONAL_STAFF } from '../data/operational-staff.mjs';
import { hashPassword } from '../../../src/utils/password.util.js';
import {
  findRoleByCode,
  purgeUsersByMobiles,
  upsertUser,
  upsertStaff,
} from './shared.mjs';

export async function seedOperationalStaff({ transaction, logger = console }) {
  const passwordHash = await hashPassword('pass1');

  await purgeUsersByMobiles(
    OPERATIONAL_STAFF.map((user) => user.mobileNumber),
    transaction,
  );

  for (const profile of OPERATIONAL_STAFF) {
    const role = await findRoleByCode(profile.roleCode, transaction);
    if (!role) {
      throw new Error(`Required role '${profile.roleCode}' was not found. Run migrations or seed normal first.`);
    }

    const userId = await upsertUser(profile, role.id, passwordHash, transaction);
    await upsertStaff(profile, userId, role.id, transaction);
  }

  logger.log('[seed] upserted 4 operational staff test accounts (all pass1)');
}
