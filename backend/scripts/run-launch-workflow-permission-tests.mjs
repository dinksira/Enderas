/**
 * Launch workflow permission verification — RBAC + service guards after migration 031.
 * Run: node scripts/run-launch-workflow-permission-tests.mjs
 *
 * Staff must use fresh logins after RBAC migrations (JWT carries stale moduleActions otherwise).
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

async function getAdminUserId() {
  const [rows] = await sequelize.query(
    `SELECT u.id FROM users u
     INNER JOIN staff s ON s.user_id = u.id AND s.deleted_at IS NULL
     INNER JOIN roles r ON r.id = s.role_id AND r.code = 'super_admin'
     WHERE u.mobile_number = :mobile AND u.deleted_at IS NULL
     LIMIT 1`,
    { replacements: { mobile: USERS.admin.mobile } },
  );
  return rows[0]?.id ?? null;
}

async function assertEvalOfficerModuleActions() {
  const [rows] = await sequelize.query(
    `SELECT description FROM roles WHERE code = 'evaluation_officer' LIMIT 1`,
  );
  if (!rows.length) {
    fail('RBAC-030', 'evaluation_officer role not found');
    return;
  }

  const desc = JSON.parse(rows[0].description);
  const evalActions = desc?.permissions?.moduleActions?.evaluations ?? [];
  const hasLeak = evalActions.includes('approve') || evalActions.includes('reject');

  if (!hasLeak) {
    pass('RBAC-030', `moduleActions.evaluations = [${evalActions.join(', ')}]`);
  } else {
    fail('RBAC-030', `Stale approve/reject still present: [${evalActions.join(', ')}]`);
  }
}

async function assertStaffFileUploadPermissions() {
  for (const roleCode of ['evaluation_officer', 'auction_manager']) {
    const [rows] = await sequelize.query(
      `SELECT description FROM roles WHERE code = :roleCode LIMIT 1`,
      { replacements: { roleCode } },
    );
    if (!rows.length) {
      fail('RBAC-031', `${roleCode} role not found`);
      continue;
    }

    const desc = JSON.parse(rows[0].description);
    const permissions = desc?.permissions ?? {};
    const modules = permissions.modules ?? [];
    const fileActions = permissions.moduleActions?.files ?? [];
    const routes = permissions.routes ?? [];
    const hasFilesModule = modules.includes('files') || modules.includes('*');
    const hasCreate = fileActions.includes('create') || permissions.actions?.includes('create');
    const hasUploadRoute = routes.includes('POST /api/v1/files') || routes.includes('*');

    if (hasFilesModule && hasCreate && hasUploadRoute) {
      pass('RBAC-031', `${roleCode} has files:create upload routes`);
    } else {
      fail(
        'RBAC-031',
        `${roleCode} missing files upload grants (module=${hasFilesModule}, create=${hasCreate}, route=${hasUploadRoute})`,
      );
    }
  }
}

async function prepareInProgressEvaluation(tokens) {
  const ownershipUrl = await uploadFile(
    tokens.admin,
    'perm-ownership.pdf',
    '%PDF-1.4 ownership',
    'application/pdf',
    'assets/ownership',
  );
  const photoUrl = await uploadFile(
    tokens.admin,
    'perm-photo.jpg',
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
    'image/jpeg',
    'assets/photos',
  );
  const supportUrl = await uploadFile(
    tokens.admin,
    'perm-support.pdf',
    '%PDF-1.4 support',
    'application/pdf',
    'assets/documents',
  );

  const title = `Permission Test Asset ${Date.now()}`;
  const createRes = await api(tokens.bidder, 'POST', '/assets', {
    title,
    assetType: 'vehicle',
    description: 'Permission verification asset.',
    conditionNotes: 'Test only.',
    location: 'Addis Ababa',
    imageUrls: [photoUrl],
    desiredReservePrice: 250000,
    auctionConditions: 'Standard conditions.',
    ownershipDocumentType: 'vehicle_registration_book',
    ownershipDocumentUrl: ownershipUrl,
    additionalDocuments: [{ name: 'support.pdf', url: supportUrl, size: 512 }],
  });

  const assetId = createRes.json.data?.asset?.id;
  if (!createRes.ok || !assetId) {
    throw new Error(`Asset create failed: ${createRes.json.message}`);
  }

  await api(tokens.cso, 'POST', `/assets/${assetId}/approve`, { reviewNotes: 'Permission test' });

  const scheduleRes = await api(tokens.eval, 'POST', '/evaluations', {
    assetId,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    notes: 'Permission test schedule',
  });
  const evaluationId = scheduleRes.json.data?.evaluation?.id;
  if (!evaluationId) {
    throw new Error('Failed to schedule evaluation');
  }

  await api(tokens.eval, 'POST', `/evaluations/${evaluationId}/start`);

  return { assetId, evaluationId, title };
}

async function main() {
  console.log('\n=== Launch Workflow Permission Tests ===\n');

  await assertEvalOfficerModuleActions();
  await assertStaffFileUploadPermissions();

  const bidderSession = await login(USERS.bidder.mobile, USERS.bidder.password);
  const adminSession = await login(USERS.admin.mobile, USERS.admin.password);
  const csoSession = await login(USERS.cso.mobile, USERS.cso.password);
  const evalSession = await login(USERS.evalOfficer.mobile, USERS.evalOfficer.password);
  const mgrSession = await login(USERS.auctionManager.mobile, USERS.auctionManager.password);

  const tokens = {
    bidder: bidderSession.accessToken,
    admin: adminSession.accessToken,
    cso: csoSession.accessToken,
    eval: evalSession.accessToken,
    mgr: mgrSession.accessToken,
  };

  const adminUserId = await getAdminUserId();
  const { evaluationId, title } = await prepareInProgressEvaluation(tokens);

  const reportUrl = await uploadFile(
    tokens.eval,
    'perm-report.pdf',
    '%PDF-1.4 report',
    'application/pdf',
    'evaluations/reports',
  );
  pass('F1', 'evaluation_officer uploads evaluation report → 200');

  const photoUrl = await uploadFile(
    tokens.eval,
    'perm-photo.jpg',
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
    'image/jpeg',
    'evaluations/photos',
  );
  pass('F2', 'evaluation_officer uploads evaluation photo → 200');

  const completeRes = await api(tokens.eval, 'POST', `/evaluations/${evaluationId}/complete`, {
    valuationAmount: 300000,
    reservePriceRecommendation: 250000,
    photoUrls: [photoUrl],
    reportUrl,
    notes: 'Permission test recommendation',
  });
  if (completeRes.ok) {
    pass('1', 'evaluation_officer completeEvaluation → 200');
  } else {
    fail('1', `Expected 200, got ${completeRes.status}: ${completeRes.json.message}`);
  }

  if (adminUserId) {
    const [notifRows] = await sequelize.query(
      `SELECT id, title, message FROM notifications
       WHERE user_id = :userId AND title = 'Evaluation Pending Approval'
       ORDER BY created_at DESC LIMIT 5`,
      { replacements: { userId: adminUserId } },
    );
    const match = notifRows.find((row) => row.message?.includes(title));
    if (match) {
      pass('N1', `Super admin notified: "${match.message}"`);
    } else {
      fail('N1', `No super admin notification found for asset "${title}"`);
    }
  } else {
    fail('N1', 'Super admin user not found for notification check');
  }

  const evalApproveRes = await api(tokens.eval, 'POST', `/evaluations/${evaluationId}/approve`, {
    reviewNotes: 'Should be denied',
  });
  if (evalApproveRes.status === 403) {
    pass('2', 'evaluation_officer approveEvaluation → 403');
  } else {
    fail('2', `Expected 403, got ${evalApproveRes.status}: ${evalApproveRes.json.message}`);
  }

  const evalRejectRes = await api(tokens.eval, 'POST', `/evaluations/${evaluationId}/reject`, {
    rejectionReason: 'Should be denied',
  });
  if (evalRejectRes.status === 403) {
    pass('3', 'evaluation_officer rejectEvaluation → 403');
  } else {
    fail('3', `Expected 403, got ${evalRejectRes.status}: ${evalRejectRes.json.message}`);
  }

  const adminApproveRes = await api(tokens.admin, 'POST', `/evaluations/${evaluationId}/approve`, {
    reviewNotes: 'Permission test super admin approval',
  });
  if (adminApproveRes.ok) {
    pass('6', 'super_admin approveEvaluation → 200');
  } else {
    fail('6', `Expected 200, got ${adminApproveRes.status}: ${adminApproveRes.json.message}`);
  }

  const docUrl = await uploadFile(
    tokens.mgr,
    'perm-auction-doc.pdf',
    '%PDF-1.4 auction',
    'application/pdf',
    'auctions/documents',
  );
  pass('F3', 'auction_manager uploads auction document → 200');

  const createAuctionRes = await api(tokens.mgr, 'POST', '/auctions', {
    title: `Permission Test Auction ${Date.now()}`,
    category: 'vehicles',
    description: 'Permission test standalone auction',
    auctionConditions: 'Test',
    startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    reservePrice: 100000,
    documentFee: 500,
    cpoPercentage: 5,
    imageUrls: [],
    documents: [{ name: 'doc.pdf', url: docUrl, size: 256 }],
    assetId: null,
  });
  const auctionId = createAuctionRes.json.data?.auction?.id;
  if (createAuctionRes.status === 201 && auctionId) {
    pass('4', 'auction_manager createAuction → 201');
  } else {
    fail('4', `Expected 201, got ${createAuctionRes.status}: ${createAuctionRes.json.message}`);
  }

  if (auctionId) {
    const mgrPublishRes = await api(tokens.mgr, 'POST', `/auctions/${auctionId}/publish`);
    if (mgrPublishRes.status === 403) {
      pass('5', 'auction_manager publishAuction → 403');
    } else {
      fail('5', `Expected 403, got ${mgrPublishRes.status}: ${mgrPublishRes.json.message}`);
    }

    const adminPublishRes = await api(tokens.admin, 'POST', `/auctions/${auctionId}/publish`);
    if (adminPublishRes.ok) {
      pass('7', 'super_admin publishAuction → 200');
    } else {
      fail('7', `Expected 200, got ${adminPublishRes.status}: ${adminPublishRes.json.message}`);
    }
  } else {
    fail('5', 'Skipped — no auction created');
    fail('7', 'Skipped — no auction created');
  }

  console.log('\n=== Summary ===');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`PASS: ${passed}  FAIL: ${failed}  TOTAL: ${results.length}`);

  if (failed > 0) {
    console.log('\nFailures:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.test}: ${r.detail}`));
    await sequelize.close();
    process.exit(1);
  }

  await sequelize.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\nFatal:', err.message);
  await sequelize.close();
  process.exit(1);
});
