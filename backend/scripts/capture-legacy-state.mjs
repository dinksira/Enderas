/**
 * Capture pre-migration baseline for multi-asset auction rollout.
 * Run BEFORE migration 032: node scripts/capture-legacy-state.mjs
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../src/config/load-env.js';
import { sequelize } from '../src/config/db.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, 'legacy-state-snapshot.json');

async function capture() {
  const [auctions] = await sequelize.query(`
    SELECT
      id,
      asset_id,
      reserve_price,
      status
    FROM auctions
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC
  `);

  const [bids] = await sequelize.query(`
    SELECT id, auction_id, user_id, amount
    FROM bids
    ORDER BY created_at ASC
  `);

  const [winners] = await sequelize.query(`
    SELECT id, auction_id, bid_id
    FROM winners
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC
  `);

  const [cpos] = await sequelize.query(`
    SELECT id, auction_id, user_id, status
    FROM cpos
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC
  `);

  const snapshot = {
    capturedAt: new Date().toISOString(),
    counts: {
      auctions: auctions.length,
      bids: bids.length,
      winners: winners.length,
      cpos: cpos.length,
    },
    auctions: auctions.map((row) => ({
      id: row.id,
      asset_id: row.asset_id,
      reserve_price: row.reserve_price != null ? String(row.reserve_price) : null,
      status: row.status,
      auction_mode: row.auction_mode ?? null,
    })),
    bids: bids.map((row) => ({
      id: row.id,
      auction_id: row.auction_id,
      user_id: row.user_id,
      amount: row.amount != null ? String(row.amount) : null,
    })),
    winners: winners.map((row) => ({
      id: row.id,
      auction_id: row.auction_id,
      bid_id: row.bid_id,
    })),
    cpos: cpos.map((row) => ({
      id: row.id,
      auction_id: row.auction_id,
      user_id: row.user_id,
      status: row.status,
    })),
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(`Legacy snapshot written to ${OUTPUT_PATH}`);
  console.log(`  auctions: ${snapshot.counts.auctions}`);
  console.log(`  bids:     ${snapshot.counts.bids}`);
  console.log(`  winners:  ${snapshot.counts.winners}`);
  console.log(`  cpos:     ${snapshot.counts.cpos}`);
}

capture()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Capture failed:', error.message);
    await sequelize.close();
    process.exit(1);
  });
