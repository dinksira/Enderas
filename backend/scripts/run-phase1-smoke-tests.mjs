/**
 * Phase 1 smoke test — linked auction, standalone, duplicate block, publish → in_auction.
 * Mirrors manual UI tests A/B/C at API + DB level.
 * Run: node scripts/run-phase1-smoke-tests.mjs
 */
import '../src/config/load-env.js';
import { sequelize } from '../src/config/db.config.js';

const BASE = 'http://localhost:3000/api';

const USERS = {
  bidder: { mobile: '0987654321', password: 'pass2' },
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

async function dbAuctionRow(auctionId) {
  const [rows] = await sequelize.query(
    `SELECT id, asset_id, status, document_files FROM auctions
     WHERE id = :id AND deleted_at IS NULL`,
    { replacements: { id: auctionId } },
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    assetId: row.asset_id,
    status: row.status,
    documents:
      typeof row.document_files === 'string'
        ? JSON.parse(row.document_files)
        : row.document_files ?? [],
  };
}

async function createEvaluatedAsset(bidderToken, uploadToken, csoToken, evalToken, adminToken = uploadToken) {
  const ownershipUrl = await uploadFile(
    uploadToken,
    'ownership.pdf',
    '%PDF-1.4 ownership',
    'application/pdf',
    'assets/ownership',
  );
  const photoUrl = await uploadFile(
    uploadToken,
    'asset-photo.jpg',
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
    'image/jpeg',
    'assets/photos',
  );

  const supportUrl = await uploadFile(
    uploadToken,
    'support.pdf',
    '%PDF-1.4 support',
    'application/pdf',
    'assets/documents',
  );

  const title = `Phase1 Smoke Asset ${Date.now()}`;
  const createRes = await api(bidderToken, 'POST', '/assets', {
    title,
    assetType: 'vehicle',
    description: 'Phase 1 smoke test asset.',
    conditionNotes: 'Test only.',
    location: 'Addis Ababa',
    imageUrls: [photoUrl],
    desiredReservePrice: 250000,
    auctionConditions: 'Standard conditions.',
    ownershipDocumentType: 'vehicle_registration_book',
    ownershipDocumentUrl: ownershipUrl,
    additionalDocuments: [{ name: 'support.pdf', url: supportUrl, size: 512 }],
  });

  if (!createRes.ok) {
    throw new Error(`Asset create failed: ${createRes.json.message}`);
  }

  const asset = createRes.json.data?.asset ?? createRes.json.data;
  const assetId = asset.id;

  await api(csoToken, 'POST', `/assets/${assetId}/approve`, { reviewNotes: 'Smoke test' });

  const scheduleRes = await api(evalToken, 'POST', '/evaluations', {
    assetId,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    notes: 'Smoke test schedule',
  });
  const evaluationId = scheduleRes.json.data?.evaluation?.id;
  if (!evaluationId) {
    throw new Error('Failed to schedule evaluation');
  }

  await api(evalToken, 'POST', `/evaluations/${evaluationId}/start`);

  const reportUrl = await uploadFile(
    uploadToken,
    'eval-report.pdf',
    '%PDF-1.4 evaluation report smoke',
    'application/pdf',
    'evaluations/reports',
  );
  const evalPhotoUrl = await uploadFile(
    uploadToken,
    'eval-photo.jpg',
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
    'image/jpeg',
    'evaluations/photos',
  );

  await api(evalToken, 'POST', `/evaluations/${evaluationId}/complete`, {
    valuationAmount: 300000,
    reservePriceRecommendation: 250000,
    photoUrls: [evalPhotoUrl],
    reportUrl,
    notes: 'Smoke test complete',
  });

  await api(adminToken, 'POST', `/evaluations/${evaluationId}/approve`, {
    reviewNotes: 'Smoke test approve',
  });

  return { assetId, title, reportUrl, evalPhotoUrl, photoUrl };
}

function futureDates() {
  return {
    startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  };
}

async function main() {
  console.log('\n=== Phase 1 Smoke Tests (A / B / C) ===\n');

  const bidderSession = await login(USERS.bidder.mobile, USERS.bidder.password);
  const adminSession = await login(USERS.admin.mobile, USERS.admin.password);
  const csoSession = await login(USERS.cso.mobile, USERS.cso.password);
  const evalSession = await login(USERS.evalOfficer.mobile, USERS.evalOfficer.password);
  const mgrSession = await login(USERS.auctionManager.mobile, USERS.auctionManager.password);

  const { startDate, endDate } = futureDates();

  // --- Test A: Linked auction ---
  console.log('\n--- Test A: Linked Auction ---');

  const { assetId, title, reportUrl, evalPhotoUrl } = await createEvaluatedAsset(
    bidderSession.accessToken,
    adminSession.accessToken,
    csoSession.accessToken,
    evalSession.accessToken,
  );

  const eligibleRes = await api(mgrSession.accessToken, 'GET', '/auctions/eligible-assets');
  const eligibleItems = eligibleRes.json.data?.items ?? [];
  const eligibleAsset = eligibleItems.find((item) => item.id === assetId);

  if (eligibleRes.ok && eligibleAsset) {
    pass('A1', `Asset "${title}" appears in eligible-assets (${eligibleItems.length} total)`);
  } else {
    fail('A1', `Asset not in eligible-assets list`);
  }

  if (eligibleAsset?.evaluation?.reportUrl) {
    const photoCount = eligibleAsset.evaluation.photoUrls?.length ?? 0;
    pass('A2', `Eligible asset has reportUrl + ${photoCount} evaluation photo(s) for pre-fill`);
  } else {
    fail('A2', 'Missing evaluation reportUrl on eligible asset');
  }

  // Payload mirrors CreateAuctionModal handleSubmit (prefilled docs + images first)
  const linkedPayload = {
    title,
    category: 'vehicles',
    description: 'Linked smoke test auction',
    auctionConditions: 'Standard conditions.',
    startDate,
    endDate,
    reservePrice: eligibleAsset?.evaluation?.reservePriceRecommendation ?? 250000,
    documentFee: 500,
    cpoPercentage: 5,
    imageUrls: [
      ...(eligibleAsset?.evaluation?.photoUrls ?? []),
      ...(eligibleAsset?.imageUrls ?? []),
    ],
    documents: [
      {
        name: 'Evaluation Report',
        url: eligibleAsset?.evaluation?.reportUrl ?? reportUrl,
        size: 0,
      },
    ],
    assetId,
  };

  const firstDocUrl = linkedPayload.documents[0]?.url;
  if (firstDocUrl === reportUrl || firstDocUrl === eligibleAsset?.evaluation?.reportUrl) {
    pass('A3', `documents[0].url is evaluation reportUrl (${firstDocUrl})`);
  } else {
    fail('A3', `documents[0] missing reportUrl — got ${firstDocUrl}`);
  }

  const createLinked = await api(mgrSession.accessToken, 'POST', '/auctions', linkedPayload);
  const linkedAuction = createLinked.json.data?.auction ?? createLinked.json.data;

  if (!createLinked.ok || !linkedAuction?.id) {
    fail('A4', `Create linked auction failed: ${createLinked.json.message}`);
  } else {
    pass('A4', `Created auction ${linkedAuction.id} (status: ${linkedAuction.dbStatus ?? linkedAuction.status})`);
  }

  if (linkedAuction?.id) {
    const dbAuction = await dbAuctionRow(linkedAuction.id);
    const assetStatus = await dbAssetStatus(assetId);

    if (dbAuction?.assetId === assetId) {
      pass('A5', `DB auction.asset_id === ${assetId}`);
    } else {
      fail('A5', `DB asset_id mismatch: ${dbAuction?.assetId}`);
    }

    if (assetStatus === 'evaluated') {
      pass('A6', `asset.status still 'evaluated' before publish`);
    } else {
      fail('A6', `Expected evaluated, got '${assetStatus}'`);
    }

    const storedDocs = dbAuction?.documents ?? [];
    const hasReport = storedDocs.some((doc) => doc.url === reportUrl);
    if (hasReport) {
      pass('A7', 'DB document_files includes evaluation reportUrl');
    } else {
      fail('A7', `Report URL not in stored documents: ${JSON.stringify(storedDocs)}`);
    }

    const eligibleAfterCreate = await api(mgrSession.accessToken, 'GET', '/auctions/eligible-assets');
    const stillEligible = (eligibleAfterCreate.json.data?.items ?? []).some((item) => item.id === assetId);
    if (!stillEligible) {
      pass('A8', 'Asset removed from eligible-assets after pending auction created');
    } else {
      fail('A8', 'Asset still listed as eligible after auction exists');
    }
  }

  // --- Test B: Standalone auction ---
  console.log('\n--- Test B: Standalone Auction ---');

  const extraDocUrl = await uploadFile(
    adminSession.accessToken,
    'standalone-doc.pdf',
    '%PDF-1.4 standalone',
    'application/pdf',
    'auctions/documents',
  );

  const standalonePayload = {
    title: `Standalone Smoke ${Date.now()}`,
    category: 'other_assets',
    description: 'No linked asset',
    auctionConditions: 'Standalone conditions.',
    startDate,
    endDate,
    reservePrice: 100000,
    documentFee: 250,
    cpoPercentage: 3,
    imageUrls: [],
    documents: [{ name: 'standalone-doc.pdf', url: extraDocUrl, size: 256 }],
    assetId: null,
  };

  const createStandalone = await api(mgrSession.accessToken, 'POST', '/auctions', standalonePayload);
  const standaloneAuction = createStandalone.json.data?.auction ?? createStandalone.json.data;

  if (createStandalone.ok && standaloneAuction?.id) {
    pass('B1', `Standalone auction created ${standaloneAuction.id}`);
  } else {
    fail('B1', `Standalone create failed: ${createStandalone.json.message}`);
  }

  if (standaloneAuction?.id) {
    const dbStandalone = await dbAuctionRow(standaloneAuction.id);
    if (dbStandalone?.assetId == null) {
      pass('B2', 'DB auction.asset_id IS NULL');
    } else {
      fail('B2', `Expected null asset_id, got ${dbStandalone?.assetId}`);
    }

    const publishStandalone = await api(
      adminSession.accessToken,
      'POST',
      `/auctions/${standaloneAuction.id}/publish`,
    );
    if (publishStandalone.ok) {
      pass('B3', 'Standalone auction publish succeeded');
    } else {
      fail('B3', `Standalone publish failed: ${publishStandalone.json.message}`);
    }
  }

  // --- Test C: Duplicate block (pending auction, asset still evaluated) ---
  console.log('\n--- Test C: Duplicate Block ---');

  const {
    assetId: dupAssetId,
    title: dupTitle,
    reportUrl: dupReportUrl,
    evalPhotoUrl: dupPhotoUrl,
  } = await createEvaluatedAsset(
    bidderSession.accessToken,
    adminSession.accessToken,
    csoSession.accessToken,
    evalSession.accessToken,
  );

  const dupDates = futureDates();
  const baseDupPayload = {
    title: dupTitle,
    category: 'vehicles',
    description: 'Duplicate test',
    auctionConditions: 'Standard conditions.',
    startDate: dupDates.startDate,
    endDate: dupDates.endDate,
    reservePrice: 250000,
    documentFee: 500,
    cpoPercentage: 5,
    imageUrls: [dupPhotoUrl],
    documents: [{ name: 'Evaluation Report', url: dupReportUrl, size: 0 }],
    assetId: dupAssetId,
  };

  const firstDup = await api(mgrSession.accessToken, 'POST', '/auctions', baseDupPayload);
  if (firstDup.ok) {
    pass('C0', 'First auction for duplicate-test asset created (pending_approval)');
  } else {
    fail('C0', `First auction failed: ${firstDup.json.message}`);
  }

  const createDup = await api(mgrSession.accessToken, 'POST', '/auctions', {
    ...baseDupPayload,
    title: `Duplicate Smoke ${Date.now()}`,
  });

  if (!createDup.ok && createDup.json.code === 'ASSET_AUCTION_EXISTS') {
    pass('C1', 'API returns ASSET_AUCTION_EXISTS (409)');
  } else {
    fail('C1', `Expected ASSET_AUCTION_EXISTS, got ${createDup.status} / ${createDup.json.code}`);
  }

  const uiMessage = createDup.json.message;
  if (uiMessage && uiMessage.includes('active auction')) {
    pass('C2', `Error message surfaces for UI: "${uiMessage}"`);
  } else {
    fail('C2', `Unexpected error message: ${uiMessage}`);
  }

  // Publish linked auction from Test A (asset should move to in_auction)
  if (linkedAuction?.id) {
    console.log('\n--- Test A (publish): Linked auction publish ---');
    const publishRes = await api(adminSession.accessToken, 'POST', `/auctions/${linkedAuction.id}/publish`);
    if (publishRes.ok) {
      pass('A9', 'Publish succeeded from pending_approval');
    } else {
      fail('A9', `Publish failed: ${publishRes.json.message}`);
    }

    const assetAfterPublish = await dbAssetStatus(assetId);
    if (assetAfterPublish === 'in_auction') {
      pass('A10', `DB asset.status === 'in_auction' after publish`);
    } else {
      fail('A10', `Expected in_auction, got '${assetAfterPublish}'`);
    }
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
