import '../src/config/load-env.js';

const BASE = 'http://localhost:3000/api';

async function login(mobile, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number: mobile, password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

async function api(token, method, path, body) {
  const res = await fetch(`${BASE}/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, json: await res.json() };
}

async function upload(token, folder) {
  const form = new FormData();
  form.append('file', new Blob(['%PDF'], { type: 'application/pdf' }), 't.pdf');
  form.append('folder', folder);
  const res = await fetch(`${BASE}/v1/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!json.success) throw new Error(`upload ${folder}: ${json.message}`);
  return json.data.fileUrl;
}

const bidder = await login('0987654321', 'pass2');
const fin = await login('0944444444', 'pass1');
const cso = await login('0955555555', 'pass1');
const mgr = await login('0922222222', 'pass1');
const admin = await login('0912345678', 'pass1');

const doc = await upload(admin.accessToken, 'auctions/documents');
const created = await api(mgr.accessToken, 'POST', '/auctions', {
  title: `Bid Window E2E ${Date.now()}`,
  category: 'vehicles',
  description: 'Bid test',
  auctionConditions: 'Test',
  startDate: new Date(Date.now() - 3600000).toISOString(),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  reservePrice: 50000,
  documentFee: 500,
  cpoPercentage: 5,
  imageUrls: [],
  documents: [{ name: 'd.pdf', url: doc, size: 1 }],
  assetId: null,
});

const auctionId = created.json.data?.auction?.id;
await api(admin.accessToken, 'POST', `/auctions/${auctionId}/publish`);

const receipt = await upload(bidder.accessToken, 'payments/receipts');
const pay = await api(bidder.accessToken, 'POST', '/payments', {
  auctionId,
  amount: 500,
  paymentMethod: 'manual',
  receiptUrl: receipt,
});
const paymentId = pay.json.data?.payment?.id;
await api(fin.accessToken, 'POST', `/payments/${paymentId}/approve`);

const cpoUrl = await upload(bidder.accessToken, 'cpo/documents');
const cpo = await api(bidder.accessToken, 'POST', '/cpo', {
  auctionId,
  documentUrl: cpoUrl,
});
const cpoId = cpo.json.data?.cpo?.id;
await api(cso.accessToken, 'POST', `/cpo/${cpoId}/approve`, {
  expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
});

const part = await api(bidder.accessToken, 'GET', `/auctions/browse/${auctionId}/participation`);
console.log('canPlaceBid:', part.json.data?.participation?.gates?.canPlaceBid);

const bid1 = await api(bidder.accessToken, 'POST', '/bids', { auctionId, amount: 50000 });
console.log('bid1:', bid1.ok ? 'PASS' : `${bid1.json.message} (${bid1.json.code})`);

const bid2 = await api(bidder.accessToken, 'POST', '/bids', { auctionId, amount: 55000 });
console.log('bid2:', !bid2.ok && bid2.json.code === 'BID_EXISTS' ? 'PASS BID_EXISTS' : bid2.json.code);
