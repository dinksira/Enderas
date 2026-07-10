/**
 * Manual flow verification — Tests 1–4 for asset → evaluation → auction gate.
 * Run: node scripts/run-asset-flow-tests.mjs
 */
import '../src/config/load-env.js';
import { sequelize } from '../src/config/db.config.js';

const BASE = 'http://localhost:3000/api';

const USERS = {
  bidder: { mobile: '0998765432', password: 'pass3' },
  admin: { mobile: '0912345678', password: 'pass1' },
  cso: { mobile: '0955555555', password: 'pass1' },
  evalOfficer: { mobile: '0933333333', password: 'pass1' },
  auctionManager: { mobile: '0922222222', password: 'pass1' },
};

const results = [];

function pass(test, detail) {
  results.push({ test, status: 'PASS', detail });
  console.log(`✅ ${test}: ${detail}`);
}

function fail(test, detail) {
  results.push({ test, status: 'FAIL', detail });
  console.log(`❌ ${test}: ${detail}`);
}

async function login(mobile, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number: mobile, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Login failed for ${mobile}: ${json.message || res.status}`);
  }
  return json.data;
}

async function api(token, method, path, body) {
  const res = await fetch(`${BASE}/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, ok: res.ok };
}

async function uploadFile(token, filename, content, mime, folder) {
  const form = new FormData();
  form.append('file', new Blob([content], { type: mime }), filename);
  form.append('folder', folder);
  const res = await fetch(`${BASE}/v1/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Upload failed: ${json.message || res.status}`);
  }
  return json.data.fileUrl;
}

async function dbAssetStatus(assetId) {
  const [rows] = await sequelize.query(
    'SELECT status FROM assets WHERE id = :id AND deleted_at IS NULL',
    { replacements: { id: assetId } },
  );
  return rows[0]?.status ?? null;
}

async function dbEvaluationStatus(evaluationId) {
  const [rows] = await sequelize.query(
    'SELECT status FROM evaluations WHERE id = :id AND deleted_at IS NULL',
    { replacements: { id: evaluationId } },
  );
  return rows[0]?.status ?? null;
}

async function dbAuctionCountForAsset(assetId) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM auctions
     WHERE asset_id = :id AND deleted_at IS NULL
       AND status NOT IN ('closed', 'cancelled')`,
    { replacements: { id: assetId } },
  );
  return Number(rows[0]?.cnt ?? 0);
}

async function evalOfficerNotifications(evalUserId, assetTitle) {
  const [rows] = await sequelize.query(
    `SELECT id, title, message FROM notifications
     WHERE user_id = :userId AND title = 'Asset Ready for Evaluation'
     ORDER BY created_at DESC LIMIT 5`,
    { replacements: { userId: evalUserId } },
  );
  return rows.filter((r) => r.message?.includes(assetTitle));
}

async function createTestAsset(bidderToken, uploadToken) {
  const ownershipUrl = await uploadFile(
    uploadToken,
    'ownership.pdf',
    '%PDF-1.4 test ownership',
    'application/pdf',
    'assets/ownership',
  );
  const supportUrl = await uploadFile(
    uploadToken,
    'support.pdf',
    '%PDF-1.4 test support',
    'application/pdf',
    'assets/documents',
  );
  const photoUrl = await uploadFile(
    uploadToken,
    'photo.jpg',
    Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]),
    'image/jpeg',
    'assets/photos',
  );

  const title = `Flow Test Asset ${Date.now()}`;
  const { status, json, ok } = await api(bidderToken, 'POST', '/assets', {
    title,
    assetType: 'vehicle',
    description: 'Integration test asset description for flow verification.',
    conditionNotes: 'Good condition, test only.',
    location: 'Addis Ababa',
    imageUrls: [photoUrl],
    desiredReservePrice: 250000,
    auctionConditions: 'Standard auction conditions apply.',
    ownershipDocumentType: 'vehicle_registration_book',
    ownershipDocumentUrl: ownershipUrl,
    additionalDocuments: [{ name: 'support.pdf', url: supportUrl, size: 1024 }],
  });

  if (!ok) {
    throw new Error(`Asset create failed (${status}): ${json.message}`);
  }

  const asset = json.data?.asset ?? json.data;
  return { asset, title };
}

async function main() {
  console.log('\n=== Asset Flow Tests 1–4 ===\n');

  const bidderSession = await login(USERS.bidder.mobile, USERS.bidder.password);
  const adminSession = await login(USERS.admin.mobile, USERS.admin.password);
  const csoSession = await login(USERS.cso.mobile, USERS.cso.password);
  const evalSession = await login(USERS.evalOfficer.mobile, USERS.evalOfficer.password);
  const mgrSession = await login(USERS.auctionManager.mobile, USERS.auctionManager.password);

  const evalUserId = evalSession.user?.id ?? evalSession.identity?.userId;

  // --- Test 1 ---
  console.log('\n--- Test 1: Asset Submission & CSO Approval ---');
  const { asset, title } = await createTestAsset(bidderSession.accessToken, adminSession.accessToken);
  const assetId = asset.id;

  const approveRes = await api(csoSession.accessToken, 'POST', `/assets/${assetId}/approve`, {
    reviewNotes: 'Ownership verified in flow test',
  });

  if (!approveRes.ok) {
    fail('Test 1', `CSO approve failed: ${approveRes.json.message}`);
  } else {
    const dbStatus = await dbAssetStatus(assetId);
    const auctionCount = await dbAuctionCountForAsset(assetId);
    const officerNotes = evalUserId
      ? await evalOfficerNotifications(evalUserId, title)
      : [];

    if (dbStatus === 'approved') {
      pass('Test 1a', `asset.status === 'approved' (DB confirmed)`);
    } else {
      fail('Test 1a', `Expected approved, got '${dbStatus}'`);
    }

    if (auctionCount === 0) {
      pass('Test 1b', 'No auction auto-created for asset');
    } else {
      fail('Test 1b', `Expected 0 auctions, found ${auctionCount}`);
    }

    if (officerNotes.length > 0) {
      pass('Test 1c', `Evaluation officer received notification (${officerNotes.length})`);
    } else {
      fail('Test 1c', 'No evaluation officer notification found (seed eval officer user?)');
    }

    const apiStatus = approveRes.json.data?.asset?.dbStatus ?? approveRes.json.data?.dbStatus;
    if (apiStatus === 'approved') {
      pass('Test 1d', 'API response shows approved status');
    } else {
      fail('Test 1d', `API dbStatus: ${apiStatus}`);
    }
  }

  // --- Test 2 ---
  console.log('\n--- Test 2: Evaluation Scheduling ---');
  const eligibleRes = await api(evalSession.accessToken, 'GET', '/evaluations/eligible-assets');
  const eligibleItems = eligibleRes.json.data?.items ?? [];
  const inEligible = eligibleItems.some((item) => item.id === assetId);

  if (inEligible) {
    pass('Test 2a', 'Approved asset appears in eligible-assets list');
  } else {
    fail('Test 2a', `Asset ${assetId} not in eligible list (${eligibleItems.length} items)`);
  }

  const scheduleRes = await api(evalSession.accessToken, 'POST', '/evaluations', {
    assetId,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    notes: 'Scheduled in flow test',
  });

  let evaluationId = null;
  if (!scheduleRes.ok) {
    fail('Test 2b', `Schedule failed: ${scheduleRes.json.message}`);
  } else {
    evaluationId = scheduleRes.json.data?.evaluation?.id;
    const underEval = await dbAssetStatus(assetId);
    if (underEval === 'under_evaluation') {
      pass('Test 2b', `asset.status === 'under_evaluation' after schedule`);
    } else {
      fail('Test 2b', `Expected under_evaluation, got '${underEval}'`);
    }
  }

  // --- Test 3 ---
  console.log('\n--- Test 3: Evaluation Completion ---');
  if (evaluationId) {
    const startRes = await api(evalSession.accessToken, 'POST', `/evaluations/${evaluationId}/start`);
    if (!startRes.ok) {
      fail('Test 3a', `Start evaluation failed: ${startRes.json.message}`);
    }

    const reportUrl = await uploadFile(
      adminSession.accessToken,
      'report.pdf',
      '%PDF-1.4 evaluation report',
      'application/pdf',
      'evaluations/reports',
    );
    const photoUrl = await uploadFile(
      adminSession.accessToken,
      'eval-photo.jpg',
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
      'image/jpeg',
      'evaluations/photos',
    );

    const completeRes = await api(evalSession.accessToken, 'POST', `/evaluations/${evaluationId}/complete`, {
      valuationAmount: 300000,
      reservePriceRecommendation: 250000,
      photoUrls: [photoUrl],
      reportUrl,
      notes: 'Completed in flow test',
    });

    if (!completeRes.ok) {
      fail('Test 3b', `Complete failed: ${completeRes.json.message}`);
    } else {
      pass('Test 3b', 'Evaluation completed with valuation, photos, report');
    }

    const evalOfficerApprove = await api(evalSession.accessToken, 'POST', `/evaluations/${evaluationId}/approve`, {
      reviewNotes: 'Should be denied',
    });
    if (!evalOfficerApprove.ok) {
      pass('Test 3c-role', 'Evaluation officer cannot approve evaluations');
    } else {
      fail('Test 3c-role', 'Evaluation officer should not approve evaluations');
    }

    const approveEvalRes = await api(adminSession.accessToken, 'POST', `/evaluations/${evaluationId}/approve`, {
      reviewNotes: 'Approved in flow test',
    });

    if (!approveEvalRes.ok) {
      fail('Test 3c', `Approve evaluation failed: ${approveEvalRes.json.message}`);
    } else {
      const evalStatus = await dbEvaluationStatus(evaluationId);
      const assetEvaluated = await dbAssetStatus(assetId);

      if (evalStatus === 'approved') {
        pass('Test 3c', `evaluation.status === 'approved'`);
      } else {
        fail('Test 3c', `Expected evaluation approved, got '${evalStatus}'`);
      }

      if (assetEvaluated === 'evaluated') {
        pass('Test 3d', `asset.status === 'evaluated'`);
      } else {
        fail('Test 3d', `Expected asset evaluated, got '${assetEvaluated}'`);
      }
    }
  } else {
    fail('Test 3', 'Skipped — no evaluationId from Test 2');
  }

  // --- Test 4 ---
  console.log('\n--- Test 4: Auction Creation Gate ---');
  const futureStart = new Date(Date.now() + 2 * 86400000).toISOString();
  const futureEnd = new Date(Date.now() + 7 * 86400000).toISOString();
  const docUrl = await uploadFile(
    adminSession.accessToken,
    'auction-doc.pdf',
    '%PDF-1.4 auction doc',
    'application/pdf',
    'auctions/documents',
  );

  const auctionPayload = {
    title: `Flow Test Auction ${Date.now()}`,
    category: 'vehicles',
    description: 'Test auction',
    startDate: futureStart,
    endDate: futureEnd,
    reservePrice: 250000,
    documentFee: 500,
    cpoPercentage: 5,
    documents: [{ name: 'auction-doc.pdf', url: docUrl, size: 512 }],
    assetId,
  };

  const createOk = await api(mgrSession.accessToken, 'POST', '/auctions', auctionPayload);
  if (createOk.ok) {
    pass('Test 4a', 'Auction creation with evaluated asset succeeded');
  } else {
    fail('Test 4a', `Expected success, got ${createOk.status}: ${createOk.json.message}`);
  }

  const createDup = await api(mgrSession.accessToken, 'POST', '/auctions', {
    ...auctionPayload,
    title: `Duplicate Auction ${Date.now()}`,
  });
  if (!createDup.ok && createDup.json.code === 'ASSET_AUCTION_EXISTS') {
    pass('Test 4b', 'Second auction for same asset blocked (ASSET_AUCTION_EXISTS)');
  } else {
    fail('Test 4b', `Expected ASSET_AUCTION_EXISTS, got ${createDup.status} ${createDup.json.code}`);
  }

  const { asset: pendingAsset } = await createTestAsset(
    bidderSession.accessToken,
    adminSession.accessToken,
  );
  const pendingFail = await api(mgrSession.accessToken, 'POST', '/auctions', {
    ...auctionPayload,
    title: `Pending Asset Auction ${Date.now()}`,
    assetId: pendingAsset.id,
  });
  if (!pendingFail.ok && pendingFail.json.code === 'ASSET_NOT_EVALUATED') {
    pass('Test 4c', 'pending_review asset blocked (ASSET_NOT_EVALUATED)');
  } else {
    fail('Test 4c', `Expected ASSET_NOT_EVALUATED, got ${pendingFail.status} ${pendingFail.json.code}`);
  }

  const { asset: approvedOnlyAsset } = await createTestAsset(
    bidderSession.accessToken,
    adminSession.accessToken,
  );
  await api(csoSession.accessToken, 'POST', `/assets/${approvedOnlyAsset.id}/approve`, {});
  const approvedFail = await api(mgrSession.accessToken, 'POST', '/auctions', {
    ...auctionPayload,
    title: `Approved Asset Auction ${Date.now()}`,
    assetId: approvedOnlyAsset.id,
  });
  if (!approvedFail.ok && approvedFail.json.code === 'ASSET_NOT_EVALUATED') {
    pass('Test 4d', 'approved (not evaluated) asset blocked (ASSET_NOT_EVALUATED)');
  } else {
    fail('Test 4d', `Expected ASSET_NOT_EVALUATED, got ${approvedFail.status} ${approvedFail.json.code}`);
  }

  // Summary
  console.log('\n=== Summary ===');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`PASS: ${passed}  FAIL: ${failed}  TOTAL: ${results.length}`);
  if (failed > 0) {
    console.log('\nFailures:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.test}: ${r.detail}`));
    process.exit(1);
  }

  await sequelize.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\nFatal:', err.message);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
