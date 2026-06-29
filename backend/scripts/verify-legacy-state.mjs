/**
 * Verify post-migration state against legacy-state-snapshot.json.
 * Run AFTER migrations 032 + 033: node scripts/verify-legacy-state.mjs
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../src/config/load-env.js';
import { sequelize } from '../src/config/db.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(__dirname, 'legacy-state-snapshot.json');

const results = [];

function pass(test, detail) {
  results.push({ test, status: 'PASS', detail });
  console.log(`✅ ${test}: ${detail}`);
}

function fail(test, detail) {
  results.push({ test, status: 'FAIL', detail });
  console.log(`❌ ${test}: ${detail}`);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function verify() {
  const raw = await readFile(SNAPSHOT_PATH, 'utf8');
  const snapshot = JSON.parse(raw);

  console.log(`\n=== Legacy State Verification ===`);
  console.log(`Snapshot captured: ${snapshot.capturedAt}`);
  console.log(`  auctions: ${snapshot.auctions?.length ?? 0}`);
  console.log(`  bids:     ${snapshot.bids?.length ?? 0}`);
  console.log(`  winners:  ${snapshot.winners?.length ?? 0}`);
  console.log(`  cpos:     ${snapshot.cpos?.length ?? 0}\n`);

  const [currentAuctions] = await sequelize.query(`
    SELECT id, asset_id, reserve_price, status, auction_mode
    FROM auctions
    WHERE deleted_at IS NULL
  `);
  const auctionMap = new Map(currentAuctions.map((row) => [row.id, row]));

  let auctionStatusFailures = 0;
  for (const snap of snapshot.auctions ?? []) {
    const current = auctionMap.get(snap.id);
    if (!current) {
      auctionStatusFailures += 1;
      fail('AUCTION-EXISTS', `Missing auction ${snap.id}`);
      continue;
    }
    if (current.status !== snap.status) {
      auctionStatusFailures += 1;
      fail(
        'AUCTION-STATUS',
        `Auction ${snap.id}: expected status ${snap.status}, got ${current.status}`,
      );
    }
  }
  if (auctionStatusFailures === 0) {
    pass('AUCTION-STATUS', `All ${snapshot.auctions?.length ?? 0} snapshot auctions exist with same status`);
  }

  const [currentBids] = await sequelize.query(`
    SELECT id, auction_id, user_id, amount, auction_asset_id
    FROM bids
  `);
  const bidMap = new Map(currentBids.map((row) => [row.id, row]));

  let bidFailures = 0;
  for (const snap of snapshot.bids ?? []) {
    const current = bidMap.get(snap.id);
    if (!current) {
      bidFailures += 1;
      fail('BID-EXISTS', `Missing bid ${snap.id}`);
      continue;
    }
    if (String(current.amount) !== String(snap.amount)) {
      bidFailures += 1;
      fail(
        'BID-AMOUNT',
        `Bid ${snap.id}: expected amount ${snap.amount}, got ${current.amount}`,
      );
    }
    const snapAuction = snapshot.auctions?.find((a) => a.id === snap.auction_id);
    if (snapAuction?.asset_id && !current.auction_asset_id) {
      bidFailures += 1;
      fail('BID-LOT', `Bid ${snap.id} on linked auction missing auction_asset_id`);
    }
  }
  if (bidFailures === 0) {
    pass('BIDS', `All ${snapshot.bids?.length ?? 0} snapshot bids preserved with auction_asset_id where applicable`);
  }

  const [currentWinners] = await sequelize.query(`
    SELECT id, auction_id, bid_id, auction_asset_id
    FROM winners
    WHERE deleted_at IS NULL
  `);
  const winnerMap = new Map(currentWinners.map((row) => [row.id, row]));

  let winnerFailures = 0;
  for (const snap of snapshot.winners ?? []) {
    const current = winnerMap.get(snap.id);
    if (!current) {
      winnerFailures += 1;
      fail('WINNER-EXISTS', `Missing winner ${snap.id}`);
      continue;
    }
    const snapAuction = snapshot.auctions?.find((a) => a.id === snap.auction_id);
    if (snapAuction?.asset_id && !current.auction_asset_id) {
      winnerFailures += 1;
      fail('WINNER-LOT', `Winner ${snap.id} missing auction_asset_id`);
    }
  }
  if (winnerFailures === 0) {
    pass('WINNERS', `All ${snapshot.winners?.length ?? 0} snapshot winners preserved with auction_asset_id where applicable`);
  }

  const [currentCpos] = await sequelize.query(`
    SELECT id, auction_id, user_id, status, selected_auction_asset_ids
    FROM cpos
    WHERE deleted_at IS NULL
  `);
  const cpoMap = new Map(currentCpos.map((row) => [row.id, row]));

  let cpoFailures = 0;
  for (const snap of snapshot.cpos ?? []) {
    const current = cpoMap.get(snap.id);
    if (!current) {
      cpoFailures += 1;
      fail('CPO-EXISTS', `Missing CPO ${snap.id}`);
      continue;
    }
    if (current.status !== snap.status) {
      cpoFailures += 1;
      fail('CPO-STATUS', `CPO ${snap.id}: expected status ${snap.status}, got ${current.status}`);
    }
    const selected = parseJsonArray(current.selected_auction_asset_ids);
    const snapAuction = snapshot.auctions?.find((a) => a.id === snap.auction_id);
    if (snapAuction?.asset_id && selected.length === 0) {
      cpoFailures += 1;
      fail('CPO-SELECTION', `CPO ${snap.id} missing selected_auction_asset_ids`);
    }
  }
  if (cpoFailures === 0) {
    pass('CPOS', `All ${snapshot.cpos?.length ?? 0} snapshot CPOs preserved with selected_auction_asset_ids where applicable`);
  }

  const [lotCounts] = await sequelize.query(`
    SELECT auction_id, COUNT(*) AS lot_count
    FROM auction_assets
    GROUP BY auction_id
  `);
  const lotCountMap = new Map(lotCounts.map((row) => [row.auction_id, Number(row.lot_count)]));

  let lotFailures = 0;
  const linkedSnapshotAuctions = (snapshot.auctions ?? []).filter((a) => a.asset_id);
  for (const snap of linkedSnapshotAuctions) {
    const count = lotCountMap.get(snap.id) ?? 0;
    if (count !== 1) {
      lotFailures += 1;
      fail('AUCTION-LOTS', `Auction ${snap.id} expected 1 auction_assets row, found ${count}`);
    }
  }
  if (lotFailures === 0) {
    pass(
      'AUCTION-LOTS',
      `All ${linkedSnapshotAuctions.length} asset-linked snapshot auctions have exactly one auction_assets row`,
    );
  }

  const unlinked = (snapshot.auctions ?? []).filter((a) => !a.asset_id);
  if (unlinked.length > 0) {
    let unlinkedLotIssues = 0;
    for (const snap of unlinked) {
      const count = lotCountMap.get(snap.id) ?? 0;
      if (count !== 0) {
        unlinkedLotIssues += 1;
        fail('STANDALONE-LOTS', `Standalone auction ${snap.id} should have 0 lots, found ${count}`);
      }
    }
    if (unlinkedLotIssues === 0) {
      pass('STANDALONE-LOTS', `${unlinked.length} standalone auctions correctly have no auction_assets rows`);
    }
  }

  const [modeRows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt
    FROM auctions
    WHERE deleted_at IS NULL AND auction_mode != 'single'
  `);
  if (Number(modeRows[0]?.cnt) === 0) {
    pass('AUCTION-MODE', 'All existing auctions have auction_mode = single');
  } else {
    fail('AUCTION-MODE', `${modeRows[0].cnt} auctions are not single mode`);
  }

  console.log('\n=== Summary ===');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`PASS: ${passed}  FAIL: ${failed}  TOTAL: ${results.length}`);

  if (failed > 0) {
    console.log('\nFailures:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.test}: ${r.detail}`));
    process.exitCode = 1;
  }
}

verify()
  .then(async () => {
    await sequelize.close();
    if (process.exitCode) {
      process.exit(process.exitCode);
    }
  })
  .catch(async (error) => {
    console.error('\nFatal:', error.message);
    await sequelize.close();
    process.exit(1);
  });
