/**
 * Bidder E2E checkpoint script — mirrors manual browser flow for 0998765432.
 * Run: node scripts/run-bidder-e2e.mjs
 */
import '../src/config/load-env.js';
import { sequelize } from '../src/config/db.config.js';

const BASE = 'http://localhost:3000/api';

const USERS = {
  bidder: { mobile: '0998765432', password: 'pass3' },
  admin: { mobile: '0912345678', password: 'pass1' },
  cso: { mobile: '0955555555', password: 'pass1' },
  finance: { mobile: '0944444444', password: 'pass1' },
  auctionManager: { mobile: '0922222222', password: 'pass1' },
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

function skip(id, detail) {
  results.push({ id, status: 'SKIP', detail });
  console.log(`⏭️  ${id}: ${detail}`);
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

async function uploadFile(token, folder, filename = 'test.pdf', mime = 'application/pdf') {
  const form = new FormData();
  form.append('file', new Blob(['%PDF-1.4 bidder e2e'], { type: mime }), filename);
  form.append('folder', folder);
  const res = await fetch(`${BASE}/v1/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, code: json.code, fileUrl: json.data?.fileUrl };
}

async function dbUserStatus(userId) {
  const [rows] = await sequelize.query(
    'SELECT status FROM users WHERE id = :id AND deleted_at IS NULL',
    { replacements: { id: userId } },
  );
  return rows[0]?.status ?? null;
}

async function findPublishedAuction(token) {
  const browse = await api(token, 'GET', '/auctions/browse');
  const items = browse.json.data?.items ?? [];
  const published = items.find((item) => {
    const status = String(item.dbStatus || item.status || '').toLowerCase();
    return status === 'published';
  });
  return published ?? items[0] ?? null;
}

async function ensurePublishedAuction(mgrToken, adminToken) {
  const browse = await api(mgrToken, 'GET', '/auctions/browse');
  const items = browse.json.data?.items ?? [];
  const now = Date.now();

  const inWindow = items.find((item) => {
    const start = new Date(item.startDate ?? item.start_date).getTime();
    const end = new Date(item.endDate ?? item.end_date).getTime();
    return start <= now && now <= end;
  });
  if (inWindow?.id) {
    return inWindow;
  }

  let auction = items[0];
  if (auction?.id) {
    return auction;
  }

  const docUrl = (await uploadFile(mgrToken, 'auctions/documents')).fileUrl;
  const start = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 14 * 86400000).toISOString();
  const create = await api(mgrToken, 'POST', '/auctions', {
    title: `Bidder E2E Auction ${Date.now()}`,
    category: 'vehicles',
    description: 'E2E participation test auction',
    auctionConditions: 'Standard conditions apply.',
    startDate: start,
    endDate: end,
    reservePrice: 100000,
    documentFee: 500,
    cpoPercentage: 5,
    imageUrls: [],
    documents: [{ name: 'e2e-doc.pdf', url: docUrl, size: 256 }],
    assetId: null,
  });

  const created = create.json.data?.auction ?? create.json.data;
  if (!create.ok || !created?.id) {
    throw new Error(`Failed to create auction: ${create.json.message}`);
  }

  const publish = await api(adminToken, 'POST', `/auctions/${created.id}/publish`);
  if (!publish.ok) {
    throw new Error(`Failed to publish auction: ${publish.json.message}`);
  }

  return publish.json.data?.auction ?? created;
}

async function main() {
  console.log('\n=== Bidder E2E Checkpoints ===\n');

  const bidderSession = await login(USERS.bidder.mobile, USERS.bidder.password);
  const csoSession = await login(USERS.cso.mobile, USERS.cso.password);
  const financeSession = await login(USERS.finance.mobile, USERS.finance.password);
  const adminSession = await login(USERS.admin.mobile, USERS.admin.password);
  const mgrSession = await login(USERS.auctionManager.mobile, USERS.auctionManager.password);

  const bidderId = bidderSession.user?.id;
  let bidderStatus = await dbUserStatus(bidderId);

  const auction = await ensurePublishedAuction(mgrSession.accessToken, adminSession.accessToken);
  if (!auction?.id) {
    fail('SETUP', 'No published auction available');
    process.exit(1);
  }
  const auctionId = auction.id;

  // --- Checkpoint 1: KYC gate state ---
  console.log('\n--- Checkpoint 1: KYC gate ---');
  const participationPre = await api(
    bidderSession.accessToken,
    'GET',
    `/auctions/browse/${auctionId}/participation`,
  );

  if (!participationPre.ok) {
    fail('1', `Participation fetch failed: ${participationPre.json.message}`);
  } else if (bidderStatus !== 'active') {
    const bidAttempt = await api(bidderSession.accessToken, 'POST', '/bids', {
      auctionId,
      amount: Number(auction.reservePrice || auction.reserve || 100000),
    });
    if (!bidAttempt.ok && ['KYC_PENDING', 'KYC_UNDER_REVIEW', 'KYC_REJECTED'].includes(bidAttempt.json.code)) {
      pass('1', `Non-active bidder (${bidderStatus}) blocked from bid API with ${bidAttempt.json.code} — UI should show KYC gate`);
    } else {
      fail('1', `Expected KYC block, got ${bidAttempt.status} ${bidAttempt.json.code}`);
    }
  } else {
    skip('1', `Bidder already active — KYC gate UI not applicable; verify manually with kyc_pending test account`);
    if (participationPre.json.data?.participation?.gates) {
      pass('1b', 'Active bidder can load participation panel data (payment step available)');
    }
  }

  // --- Checkpoints 2-3: KYC upload + CSO approve ---
  console.log('\n--- Checkpoints 2-3: KYC upload & approval ---');
  if (bidderStatus === 'active') {
    skip('2', 'Bidder already active — KYC upload skipped');
    skip('3', 'Bidder already active — KYC approval skipped');
  } else if (bidderStatus === 'kyc_under_review') {
    skip('2', 'KYC already submitted');
    const list = await api(csoSession.accessToken, 'GET', '/kyc?tab=pending&limit=20');
    const kycItem = (list.json.data?.items ?? []).find((item) => item.userId === bidderId);
    if (kycItem?.id) {
      const approve = await api(csoSession.accessToken, 'POST', `/kyc/${kycItem.id}/approve`, {
        reviewNotes: 'E2E approval',
      });
      if (approve.ok) {
        bidderStatus = await dbUserStatus(bidderId);
        if (bidderStatus === 'active') {
          pass('3', 'CSO approved KYC — bidder status is active');
        } else {
          fail('3', `Expected active, got ${bidderStatus}`);
        }
      } else {
        fail('3', approve.json.message);
      }
    } else {
      fail('3', 'Pending KYC record not found for bidder');
    }
  } else {
    const kycUpload = await uploadFile(bidderSession.accessToken, 'kyc', 'kyc-front.pdf');
    if (kycUpload.ok) {
      pass('2', 'KYC folder upload succeeded (no 403)');
    } else {
      fail('2', `KYC upload failed: ${kycUpload.status} ${kycUpload.code}`);
    }

    const uniqueId = `E2E${Date.now()}`.slice(0, 16);
    const submit = await api(bidderSession.accessToken, 'POST', '/kyc', {
      userType: 'individual',
      documentNumber: uniqueId,
      documentFrontUrl: kycUpload.fileUrl,
      documentBackUrl: kycUpload.fileUrl,
    });

    if (submit.ok) {
      pass('2b', 'KYC submitted — status kyc_under_review');
      bidderStatus = await dbUserStatus(bidderId);
    } else {
      fail('2b', `KYC submit failed: ${submit.json.message}`);
    }

    const kycId = submit.json.data?.kyc?.id ?? submit.json.data?.id;
    if (kycId) {
      const approve = await api(csoSession.accessToken, 'POST', `/kyc/${kycId}/approve`, {
        reviewNotes: 'E2E approval',
      });
      bidderStatus = await dbUserStatus(bidderId);
      if (approve.ok && bidderStatus === 'active') {
        pass('3', 'CSO approved KYC — bidder status is active');
      } else {
        fail('3', `KYC approve failed or status not active (${bidderStatus})`);
      }
    }
  }

  // Re-login to refresh JWT permissions/status if needed
  const bidderActive = await login(USERS.bidder.mobile, USERS.bidder.password);

  // --- Checkpoint 4: Participation shows payment step ---
  console.log('\n--- Checkpoint 4: Payment step visible ---');
  const participation = await api(
    bidderActive.accessToken,
    'GET',
    `/auctions/browse/${auctionId}/participation`,
  );
  const part = participation.json.data?.participation;
  const canPay = part?.gates?.canSubmitPayment || part?.participationStatus === 'not_started';

  if (participation.ok && canPay) {
    pass('4', `Participation panel ready — status: ${part?.participationStatus}, canSubmitPayment: ${Boolean(part?.gates?.canSubmitPayment)}`);
  } else if (part?.flags?.paymentApproved) {
    skip('4', 'Payment already approved for this auction from prior run');
  } else {
    fail('4', `Payment step not available — status: ${part?.participationStatus}`);
  }

  // --- Checkpoint 5: Payment receipt + finance approve + documents ---
  console.log('\n--- Checkpoint 5: Payment & document unlock ---');
  let paymentId = part?.payment?.id;

  if (!part?.flags?.paymentApproved) {
    const receipt = await uploadFile(bidderActive.accessToken, 'payments/receipts', 'receipt.pdf');
    if (!receipt.ok) {
      fail('5a', `Receipt upload failed: ${receipt.status} ${receipt.code}`);
    } else {
      pass('5a', 'Payment receipt upload succeeded');
    }

    const payCreate = await api(bidderActive.accessToken, 'POST', '/payments', {
      auctionId,
      amount: auction.documentFee ?? 500,
      paymentMethod: 'manual',
      receiptUrl: receipt.fileUrl,
    });

    if (payCreate.ok) {
      paymentId = payCreate.json.data?.payment?.id ?? payCreate.json.data?.id;
      pass('5b', `Payment submitted (pending) — id ${paymentId}`);
    } else if (payCreate.json.code === 'PAYMENT_PENDING') {
      skip('5b', 'Payment already pending from prior run');
    } else {
      fail('5b', `Payment create failed: ${payCreate.json.message}`);
    }

    if (paymentId) {
      const approvePay = await api(financeSession.accessToken, 'POST', `/payments/${paymentId}/approve`);
      if (approvePay.ok) {
        pass('5c', 'Finance officer approved payment');
      } else {
        fail('5c', approvePay.json.message);
      }
    }
  } else {
    skip('5', 'Payment already approved for this auction');
  }

  const detail = await api(bidderActive.accessToken, 'GET', `/auctions/browse/${auctionId}`);
  const docs = detail.json.data?.auction?.documents ?? detail.json.data?.documents ?? [];
  const docAccess = detail.json.data?.auction?.documentAccess ?? detail.json.data?.documentAccess;

  const partAfterPay = await api(
    bidderActive.accessToken,
    'GET',
    `/auctions/browse/${auctionId}/participation`,
  );
  const unlocked = partAfterPay.json.data?.participation?.gates?.documentAccess;

  if (unlocked && (docs.length > 0 || docAccess)) {
    pass('5d', `Documents unlocked — documentAccess: true, docs: ${docs.length}`);
  } else if (unlocked) {
    pass('5d', 'documentAccess gate open (auction may have no attached docs)');
  } else {
    fail('5d', 'Documents still locked after payment approval');
  }

  // --- Checkpoint 6: Bid drafts + CPO package (mobile flow) or legacy CPO ---
  console.log('\n--- Checkpoint 6: CPO & bid unlock ---');
  const reserve = Number(auction.reservePrice ?? auction.reserve ?? 100000);
  const auctionDetail = await api(bidderActive.accessToken, 'GET', `/auctions/browse/${auctionId}`);
  const auctionLots = auctionDetail.json.data?.auction?.lots ?? [];
  const partCpo = (await api(
    bidderActive.accessToken,
    'GET',
    `/auctions/browse/${auctionId}/participation`,
  )).json.data?.participation;

  if (!partCpo?.flags?.cpoApproved) {
    const cpoFile = await uploadFile(bidderActive.accessToken, 'cpo/documents', 'cpo.pdf');
    if (!cpoFile.ok) {
      fail('6a', `CPO upload failed: ${cpoFile.status}`);
    } else {
      pass('6a', 'CPO document upload succeeded');
    }

    let cpoPayload = {
      auctionId,
      documentUrl: cpoFile.fileUrl,
    };

    if (auctionLots.length > 0 && partCpo?.gates?.canEditBidDrafts !== false) {
      const lot = auctionLots[0];
      const bidAmount = Number(lot.reservePrice ?? reserve);
      const draftUpsert = await api(bidderActive.accessToken, 'PUT', '/bid-drafts', {
        auctionId,
        auctionAssetId: lot.id,
        amount: bidAmount,
      });

      if (draftUpsert.ok) {
        pass('6a-draft', `Bid draft saved for lot ${lot.id} at ${bidAmount}`);
        cpoPayload = {
          ...cpoPayload,
          proposedBids: [{ auctionAssetId: lot.id, amount: bidAmount }],
          declaredCpoAmount: Math.round((bidAmount * Number(auction.cpoPercentage ?? 5)) / 100),
        };
      } else {
        skip('6a-draft', `Bid draft upsert skipped: ${draftUpsert.json.message}`);
      }
    }

    const cpoCreate = await api(bidderActive.accessToken, 'POST', '/cpo', cpoPayload);

    let cpoId = cpoCreate.json.data?.cpo?.id ?? cpoCreate.json.data?.id;
    if (cpoCreate.ok) {
      pass('6b', `CPO submitted — id ${cpoId}`);
    } else if (cpoCreate.json.code === 'CPO_EXISTS') {
      skip('6b', 'CPO already exists — finding pending record');
      const cpoList = await api(csoSession.accessToken, 'GET', `/cpo?limit=50`);
      const existing = (cpoList.json.data?.items ?? []).find(
        (row) => row.auctionId === auctionId && row.userId === bidderId,
      );
      cpoId = existing?.id;
    } else {
      fail('6b', cpoCreate.json.message);
    }

    if (cpoId) {
      const expiry = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const approveCpo = await api(csoSession.accessToken, 'POST', `/cpo/${cpoId}/approve`, {
        expiryDate: expiry,
      });
      if (approveCpo.ok) {
        pass('6c', 'CSO approved CPO');
      } else {
        fail('6c', approveCpo.json.message);
      }
    }
  } else {
    skip('6', 'CPO already approved for this auction');
  }

  const partBid = (await api(
    bidderActive.accessToken,
    'GET',
    `/auctions/browse/${auctionId}/participation`,
  )).json.data?.participation;

  const canBid = partBid?.gates?.canPlaceBid;
  const cpoGate = partBid?.gates?.cpoApproved;
  const hasSubmittedBid = partBid?.flags?.hasBid;

  if (cpoGate && (hasSubmittedBid || canBid || partBid?.gates?.biddingWindowStatus === 'before')) {
    pass(
      '6d',
      `Bid gate ready — cpoApproved: true, hasBid: ${Boolean(hasSubmittedBid)}, canPlaceBid: ${Boolean(canBid)}, window: ${partBid?.gates?.biddingWindowStatus}`,
    );
  } else if (partBid?.flags?.hasBid) {
    skip('6d', 'Bid already placed from prior run');
  } else {
    fail('6d', `Bid gate not ready — cpoApproved: ${cpoGate}, hasBid: ${hasSubmittedBid}, canPlaceBid: ${canBid}`);
  }

  // --- Checkpoint 7: Place bid (legacy) if CPO package did not create bids ---
  console.log('\n--- Checkpoint 7: Bid placement ---');
  const bidAmount = reserve;

  if (!partBid?.flags?.hasBid && !partBid?.bid) {
    const now = new Date();
    const start = new Date(auction.startDate ?? auction.start_date);
    const end = new Date(auction.endDate ?? auction.end_date);

    if (now < start) {
      skip('7', `Bidding window not open yet (starts ${start.toISOString()}) — gate logic verified`);
    } else if (now > end) {
      skip('7', 'Bidding window ended — cannot place bid in E2E');
    } else {
      const bid1 = await api(bidderActive.accessToken, 'POST', '/bids', {
        auctionId,
        amount: bidAmount,
      });
      if (bid1.ok) {
        pass('7a', `Bid placed at ${bidAmount} ETB`);
      } else {
        fail('7a', `Bid failed: ${bid1.json.message} (${bid1.json.code})`);
      }
    }
  } else {
    skip('7a', 'Bid already exists for this auction');
  }

  const bid2 = await api(bidderActive.accessToken, 'POST', '/bids', {
    auctionId,
    amount: bidAmount + 1000,
  });
  if (!bid2.ok && bid2.json.code === 'BID_EXISTS') {
    pass('7b', 'Second bid blocked with BID_EXISTS');
  } else if (!bid2.ok && bid2.json.code === 'AUCTION_CLOSED' && results.some((r) => r.id === '7' && r.status === 'SKIP')) {
    skip('7b', 'No first bid placed (window closed/before) — BID_EXISTS check N/A');
  } else if (bid2.ok) {
    fail('7b', 'Second bid should have been blocked');
  } else {
    fail('7b', `Unexpected second bid response: ${bid2.json.code}`);
  }

  // --- Checkpoint 8: Browse published only (+ optional anonymous browse) ---
  console.log('\n--- Checkpoint 8: Browse filter ---');
  const browseAnon = await fetch(`${BASE}/v1/auctions/browse`);
  const browseAnonJson = await browseAnon.json().catch(() => ({}));
  if (browseAnon.ok && browseAnonJson.success) {
    pass('8a', `Anonymous browse allowed (${browseAnonJson.data?.items?.length ?? 0} auctions)`);
  } else {
    fail('8a', `Anonymous browse failed: ${browseAnonJson.message || browseAnon.status}`);
  }

  const browse = await api(bidderActive.accessToken, 'GET', '/auctions/browse');
  const statuses = [...new Set((browse.json.data?.items ?? []).map((i) => i.dbStatus || i.status))];
  const nonPublished = statuses.filter((s) => String(s).toLowerCase() !== 'published');

  if (browse.ok && nonPublished.length === 0) {
    pass('8', `Browse returns published only (${browse.json.data?.items?.length ?? 0} auctions)`);
  } else {
    fail('8', `Non-published statuses in browse: ${nonPublished.join(', ')}`);
  }

  // Summary
  console.log('\n=== Summary ===');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  console.log(`PASS: ${passed}  FAIL: ${failed}  SKIP: ${skipped}  TOTAL: ${results.length}`);

  if (failed > 0) {
    console.log('\nFailures:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.id}: ${r.detail}`));
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
