/**
 * Full auction participation flow test (mobile bid-draft + CPO package path).
 * Uses admin staff token for finance/CSO approvals when dedicated staff are absent.
 *
 * Run: node --env-file=.env scripts/run-auction-flow-test.mjs
 */
import '../src/config/load-env.js';
import { sequelize } from '../src/config/db.config.js';

const BASE = `http://localhost:${process.env.PORT || 3000}/api`;

const USERS = {
  bidder: { mobile: '0987654321', password: 'pass2' },
  admin: { mobile: '0912345678', password: 'pass1' },
};

const results = [];

function pass(id, detail) {
  results.push({ id, status: 'PASS', detail });
  console.log(`✅ ${id}: ${detail}`);
}

function fail(id, detail) {
  results.push({ id, status: 'FAIL', detail });
  console.log(`❌ ${id}: ${detail}`);
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

async function uploadFile(token, folder, filename = 'test.pdf') {
  const form = new FormData();
  form.append('file', new Blob(['%PDF-1.4 auction flow test'], { type: 'application/pdf' }), filename);
  form.append('folder', folder);
  const res = await fetch(`${BASE}/v1/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Upload to ${folder} failed: ${json.message || res.status}`);
  }
  return json.data.fileUrl;
}

async function main() {
  console.log('\n=== Full Auction Flow Test ===\n');

  const bidder = await login(USERS.bidder.mobile, USERS.bidder.password);
  const admin = await login(USERS.admin.mobile, USERS.admin.password);
  pass('login', 'Bidder and admin authenticated');

  const anonBrowse = await fetch(`${BASE}/v1/auctions/browse`);
  const anonJson = await anonBrowse.json();
  if (anonBrowse.ok && anonJson.success) {
    pass('browse-anon', `Anonymous browse returned ${anonJson.data?.items?.length ?? 0} auction(s)`);
  } else {
    fail('browse-anon', anonJson.message || String(anonBrowse.status));
  }

  const docUrl = await uploadFile(admin.accessToken, 'auctions/documents', 'auction-doc.pdf');
  const start = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 14 * 86400000).toISOString();

  const createRes = await api(admin.accessToken, 'POST', '/auctions', {
    title: `Flow Test Auction ${Date.now()}`,
    category: 'vehicles',
    description: 'Automated full auction flow test',
    auctionConditions: 'Standard conditions',
    startDate: start,
    endDate: end,
    reservePrice: 120000,
    documentFee: 750,
    cpoPercentage: 10,
    imageUrls: [],
    documents: [{ name: 'auction-doc.pdf', url: docUrl, size: 128 }],
    assetId: null,
  });

  const auctionId = createRes.json.data?.auction?.id;
  if (!createRes.ok || !auctionId) {
    fail('create-auction', createRes.json.message || 'Create failed');
    process.exit(1);
  }
  pass('create-auction', `Created auction ${auctionId}`);

  const publishRes = await api(admin.accessToken, 'POST', `/auctions/${auctionId}/publish`, {});
  if (!publishRes.ok) {
    fail('publish-auction', publishRes.json.message || 'Publish failed');
    process.exit(1);
  }
  pass('publish-auction', 'Auction published');

  const browseRes = await api(bidder.accessToken, 'GET', `/auctions/browse/${auctionId}`);
  const auction = browseRes.json.data?.auction ?? browseRes.json.data;
  if (!browseRes.ok || !auction?.id) {
    fail('browse-detail', 'Bidder could not load auction detail');
    process.exit(1);
  }
  pass('browse-detail', `Loaded detail — documentFee: ${auction.documentFee}`);

  const receiptUrl = await uploadFile(bidder.accessToken, 'payments/receipts', 'payment-receipt.pdf');
  const payRes = await api(bidder.accessToken, 'POST', '/payments', {
    auctionId,
    amount: auction.documentFee ?? 750,
    paymentMethod: 'manual',
    receiptUrl,
  });

  const paymentId = payRes.json.data?.payment?.id ?? payRes.json.data?.id;
  if (!payRes.ok || !paymentId) {
    fail('submit-payment', payRes.json.message || 'Payment submit failed');
    process.exit(1);
  }
  pass('submit-payment', `Document payment submitted — ${paymentId}`);

  const approvePayRes = await api(admin.accessToken, 'POST', `/payments/${paymentId}/approve`, {});
  if (!approvePayRes.ok) {
    fail('approve-payment', approvePayRes.json.message || 'Payment approval failed');
    process.exit(1);
  }
  pass('approve-payment', 'Finance step — payment approved');

  const detailAfterPay = await api(bidder.accessToken, 'GET', `/auctions/browse/${auctionId}`);
  const docs = detailAfterPay.json.data?.auction?.documents ?? [];
  const docAccess = detailAfterPay.json.data?.auction?.documentAccess;
  if (docAccess && docs.length > 0) {
    pass('document-access', `Documents unlocked (${docs.length} file(s))`);
  } else {
    fail('document-access', `documentAccess=${docAccess}, docs=${docs.length}`);
  }

  const streamRes = await fetch(`${BASE}/v1/auctions/browse/${auctionId}/documents/0/stream`, {
    headers: { Authorization: `Bearer ${bidder.accessToken}` },
  });
  if (streamRes.ok) {
    pass('document-stream', `Inline stream OK (${streamRes.headers.get('content-type')})`);
  } else {
    const err = await streamRes.json().catch(() => ({}));
    fail('document-stream', err.message || String(streamRes.status));
  }

  const bidAmount = Number(auction.reservePrice ?? 120000);
  const draftRes = await api(bidder.accessToken, 'PUT', '/bid-drafts', {
    auctionId,
    auctionAssetId: null,
    amount: bidAmount,
  });

  if (!draftRes.ok) {
    const lots = auction.lots ?? [];
    if (lots.length > 0) {
      const lotDraft = await api(bidder.accessToken, 'PUT', '/bid-drafts', {
        auctionId,
        auctionAssetId: lots[0].id,
        amount: bidAmount,
      });
      if (!lotDraft.ok) {
        fail('bid-draft', lotDraft.json.message || 'Bid draft failed');
        process.exit(1);
      }
      pass('bid-draft', `Draft saved for lot ${lots[0].id} at ${bidAmount}`);
    } else {
      fail('bid-draft', draftRes.json.message || 'Bid draft failed');
      process.exit(1);
    }
  } else {
    pass('bid-draft', `Legacy draft saved at ${bidAmount}`);
  }

  const partBeforeCpo = await api(bidder.accessToken, 'GET', `/auctions/browse/${auctionId}/participation`);
  const preview = partBeforeCpo.json.data?.participation?.requiredCpoAmountPreview;
  if (partBeforeCpo.ok && preview != null) {
    pass('cpo-preview', `Server CPO preview: ${preview}`);
  } else {
    fail('cpo-preview', 'Missing requiredCpoAmountPreview');
  }

  const cpoUrl = await uploadFile(bidder.accessToken, 'cpo/documents', 'cpo-receipt.pdf');
  const lots = auction.lots ?? [];
  const proposedBids = lots.length > 0
    ? [{ auctionAssetId: lots[0].id, amount: bidAmount }]
    : [{ auctionAssetId: null, amount: bidAmount }];

  const cpoRes = await api(bidder.accessToken, 'POST', '/cpo', {
    auctionId,
    documentUrl: cpoUrl,
    proposedBids,
    declaredCpoAmount: preview ?? Math.round((bidAmount * Number(auction.cpoPercentage ?? 10)) / 100),
  });

  const cpoId = cpoRes.json.data?.cpo?.id ?? cpoRes.json.data?.id;
  if (!cpoRes.ok || !cpoId) {
    fail('submit-cpo', cpoRes.json.message || 'CPO submit failed');
    process.exit(1);
  }
  pass('submit-cpo', `CPO package submitted — ${cpoId}`);

  const partPending = await api(bidder.accessToken, 'GET', `/auctions/browse/${auctionId}/participation`);
  const locked = partPending.json.data?.participation?.gates?.bidsLocked;
  if (partPending.ok && locked) {
    pass('cpo-pending-lock', 'Bid drafts locked while CPO is pending');
  } else {
    fail('cpo-pending-lock', `bidsLocked=${locked}`);
  }

  const approveCpoRes = await api(admin.accessToken, 'POST', `/cpo/${cpoId}/approve`, {
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });
  if (!approveCpoRes.ok) {
    fail('approve-cpo', approveCpoRes.json.message || 'CPO approval failed');
    process.exit(1);
  }
  pass('approve-cpo', 'CSO step — CPO approved');

  const partFinal = await api(bidder.accessToken, 'GET', `/auctions/browse/${auctionId}/participation`);
  const participation = partFinal.json.data?.participation;
  const hasBid = participation?.flags?.hasBid;
  const status = participation?.participationStatus;

  if (partFinal.ok && hasBid) {
    pass('bids-promoted', `Bids created from drafts — status: ${status}`);
  } else {
    fail('bids-promoted', `hasBid=${hasBid}, status=${status}`);
  }

  const myBids = await api(bidder.accessToken, 'GET', '/bids/my');
  const bidItems = myBids.json.data?.items ?? [];
  const auctionBids = bidItems.filter((b) => b.auctionId === auctionId);
  if (myBids.ok && auctionBids.length > 0) {
    pass('my-bids', `My Bids lists ${auctionBids.length} bid(s) for this auction`);
  } else {
    fail('my-bids', `Expected bids in /bids/my, found ${auctionBids.length}`);
  }

  const duplicateBid = await api(bidder.accessToken, 'POST', '/bids', {
    auctionId,
    amount: bidAmount + 5000,
    auctionAssetId: lots[0]?.id ?? undefined,
  });
  if (!duplicateBid.ok && duplicateBid.json.code === 'BID_EXISTS') {
    pass('bid-immutable', 'Duplicate bid correctly blocked (BID_EXISTS)');
  } else if (duplicateBid.ok) {
    fail('bid-immutable', 'Duplicate bid should have been rejected');
  } else {
    pass('bid-immutable', `Bid change blocked: ${duplicateBid.json.code}`);
  }

  console.log('\n=== Summary ===');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`PASS: ${passed}  FAIL: ${failed}  TOTAL: ${results.length}`);

  if (failed > 0) {
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.id}: ${r.detail}`));
    process.exit(1);
  }

  await sequelize.close();
  console.log('\nFull auction flow test completed successfully.\n');
}

main().catch(async (err) => {
  console.error('\nFatal:', err.message);
  try {
    await sequelize.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
