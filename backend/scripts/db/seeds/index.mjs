import { sequelize } from '../../../src/config/db.config.js';
import { seedBaseline } from './shared.mjs';
import { seedTestUsers } from './test-users.mjs';
import { seedOperationalStaff } from './operational-staff.mjs';
import { seedAuctionCatalog } from './auctions.mjs';
import { seedAuctionDocuments } from './auction-documents.mjs';

const SEED_STEPS = Object.freeze({
  baseline: seedBaseline,
  users: seedTestUsers,
  staff: seedOperationalStaff,
  auctions: seedAuctionCatalog,
  'auction-documents': seedAuctionDocuments,
});

const NORMAL_STEPS = ['baseline'];
const TEST_STEPS = ['baseline', 'users', 'staff', 'auctions', 'auction-documents'];

function resolveSteps(mode, only) {
  const baseSteps = mode === 'normal' ? NORMAL_STEPS : TEST_STEPS;

  if (!only || only.length === 0) {
    return baseSteps;
  }

  const allowed = new Set(baseSteps);
  const requested = only.filter((step) => allowed.has(step));

  if (requested.length === 0) {
    throw new Error(`No valid seed steps for mode '${mode}'. Allowed: ${baseSteps.join(', ')}`);
  }

  return requested;
}

export async function runSeed({ mode = 'test', only = [], logger = console }) {
  const steps = resolveSteps(mode, only);
  const transaction = await sequelize.transaction();

  try {
    for (const step of steps) {
      logger.log(`[seed] running step: ${step}`);
      await SEED_STEPS[step]({ transaction, logger });
    }

    await transaction.commit();
    logger.log(`[seed] completed (${mode}: ${steps.join(' -> ')})`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export function printSeedCredentials(mode, logger = console) {
  if (mode !== 'test') {
    logger.log('\n[credentials] production super-admin: +251900000000 (password set in migration data)');
    return;
  }

  logger.log('\n[credentials] test accounts:');
  logger.log('  Super Admin (dev)     0912345678 / pass1');
  logger.log('  Test Owner            0987654321 / pass2');
  logger.log('  Test Bidder           0998765432 / pass3');
  logger.log('  Auction Manager       0922222222 / pass1');
  logger.log('  Evaluation Officer    0933333333 / pass1');
  logger.log('  Finance Officer       0944444444 / pass1');
  logger.log('  Customer Service      0955555555 / pass1');
}
