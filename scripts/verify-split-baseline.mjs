/**
 * Baseline verification for frontend/admin split (Step 3).
 * Run with all three dev servers up: backend :3000, frontend :5173, admin :5174
 */
import { chromium } from 'playwright';

const API = 'http://localhost:3000/api';
const FRONTEND = 'http://localhost:5173';
const ADMIN = 'http://localhost:5174';

const ACCOUNTS = {
  superAdmin: { mobile: '0912345678', password: 'pass1', role: 'super_admin' },
  bidder: { mobile: '0987654321', password: 'pass2', role: 'bidder' },
};

const STAFF_NAV_IDS = new Set([
  'auctions', 'kyc', 'evaluations', 'users', 'staff', 'roles', 'settings',
  'assets', 'bids', 'winners', 'payments', 'cpo', 'reports', 'documents', 'notifications',
]);
const BIDDER_NAV_IDS = new Set([
  'browse-auctions', 'my-bids', 'my-payments', 'my-cpo', 'my-assets',
]);

const results = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function apiLogin(mobile, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number: mobile, password }),
  });
  const body = await res.json();
  if (!res.ok || !body?.data?.accessToken) {
    throw new Error(body?.message || `Login failed (${res.status})`);
  }
  return body.data;
}

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.message || `GET ${path} failed (${res.status})`);
  return body.data;
}

async function checkCors(origin) {
  const res = await fetch(`${API}/v1/auth/me`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });
  const allowOrigin = res.headers.get('access-control-allow-origin');
  return { ok: allowOrigin === origin, allowOrigin, status: res.status };
}

async function spaNavigate(page, path) {
  await page.evaluate((targetPath) => {
    window.history.pushState(null, '', targetPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await page.waitForTimeout(500);
}

async function fillLoginForm(page, mobile, password) {
  const phone = page.locator('input[name="phoneNumber"], input#auth-phone, input[type="tel"]').first();
  const pass = page.locator('input[name="password"], input#auth-password, input[type="password"]').first();
  await phone.fill(mobile);
  await pass.fill(password);
}

async function submitLogin(page, mobile, password) {
  await fillLoginForm(page, mobile, password);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.status() === 200, { timeout: 20000 }),
    page.locator('button[type="submit"]').click(),
  ]);
}

async function loginInApp(page, baseUrl, mobile, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await submitLogin(page, mobile, password);
  await page.waitForURL((url) => url.pathname.includes('/app/'), { timeout: 20000 });
  await page.waitForSelector('.dashboard-shell', { timeout: 20000 });
}

/** @deprecated use loginInApp */
async function loginInBrowser(page, baseUrl, mobile, password) {
  return loginInApp(page, baseUrl, mobile, password);
}

async function getNavIds(page) {
  return page.locator('.dashboard-shell__nav-link').evaluateAll((links) =>
    links.map((a) => {
      const href = a.getAttribute('href') || '';
      const match = href.match(/\/app\/([^/?#]+)/);
      return match ? match[1] : href;
    }),
  );
}

async function runApiChecks() {
  for (const [label, account] of Object.entries(ACCOUNTS)) {
    try {
      const session = await apiLogin(account.mobile, account.password);
      const roleCode = session.authz?.roleCode || session.identity?.roleCode;
      record(`API login ${label}`, roleCode === account.role, `role=${roleCode}`);

      const nav = await apiGet('/v1/auth/navigation', session.accessToken);
      const ids = (nav.items || []).map((i) => i.id);
      const isStaff = account.role !== 'bidder';
      const expectedSet = isStaff ? STAFF_NAV_IDS : BIDDER_NAV_IDS;
      const hasStaffItems = ids.some((id) => STAFF_NAV_IDS.has(id));
      const hasBidderItems = ids.some((id) => BIDDER_NAV_IDS.has(id));

      if (isStaff) {
        record(`API nav ${label} has staff items`, hasStaffItems, ids.join(', '));
      } else {
        record(`API nav ${label} has bidder items`, hasBidderItems, ids.join(', '));
        record(`API nav ${label} no staff auctions nav`, !ids.includes('auctions'), ids.join(', '));
      }

      const me = await apiGet('/v1/auth/me', session.accessToken);
      record(`API /auth/me ${label}`, me.roleCode === account.role, `role=${me.roleCode}`);
    } catch (err) {
      record(`API login ${label}`, false, err.message);
    }
  }

  for (const origin of [FRONTEND, ADMIN]) {
    const cors = await checkCors(origin);
    record(`CORS preflight ${origin}`, cors.ok, `allow-origin=${cors.allowOrigin}`);
  }
}

async function runBrowserChecks(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  // Admin checks
  try {
    await page.goto(`${ADMIN}/login`, { waitUntil: 'networkidle' });
    const hasForm = await page.locator('input[name="phoneNumber"], input#auth-phone, input[type="tel"]').first().isVisible();
    record('Admin /login renders form', hasForm);

    const bidderHint = await page.locator('.bidder-redirect-hint').isVisible();
    record('Admin bidder link visible', bidderHint);

    await page.goto(`${ADMIN}/login?redirect=staff`, { waitUntil: 'networkidle' });
    const staffNotice = await page.locator('.redirect-notice').isVisible();
    record('Admin redirect=staff notice', staffNotice);

    await loginInApp(page, ADMIN, ACCOUNTS.superAdmin.mobile, ACCOUNTS.superAdmin.password);
    record('Admin staff login lands on auctions', page.url().includes('/app/auctions'), page.url());

    const adminNav = await getNavIds(page);
    const adminHasStaff = adminNav.some((id) => STAFF_NAV_IDS.has(id));
    const adminNoBidder = !adminNav.some((id) => BIDDER_NAV_IDS.has(id));
    record('Admin staff sidebar', adminHasStaff && adminNoBidder, adminNav.join(', '));

    await spaNavigate(page, '/app/kyc');
    record('Admin /app/kyc loads', page.url().includes('/app/kyc'), page.url());

    await spaNavigate(page, '/app/evaluations');
    record('Admin /app/evaluations loads', page.url().includes('/app/evaluations'), page.url());

    await spaNavigate(page, '/app/browse-auctions');
    await page.waitForURL('**/access-denied', { timeout: 10000 });
    record('Admin /app/browse-auctions denied', page.url().includes('/app/access-denied'), page.url());

    await page.goto(`${ADMIN}/login`, { waitUntil: 'networkidle' });
    await submitLogin(page, ACCOUNTS.bidder.mobile, ACCOUNTS.bidder.password);
    await page.waitForURL((url) => url.port === '5173' && url.search.includes('redirect=bidder'), { timeout: 20000 });
    record('Admin bidder login redirects to public', page.url().includes('redirect=bidder'), page.url());
  } catch (err) {
    record('Admin browser flow', false, err.message);
  }

  consoleErrors.length = 0;

  // Frontend checks
  try {
    await page.goto(`${FRONTEND}/`, { waitUntil: 'networkidle' });
    record('Frontend landing page', page.url().includes('5173'), page.url());

    await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle' });
    const staffHint = await page.locator('.staff-redirect-hint').isVisible();
    record('Frontend staff link visible', staffHint);

    await loginInApp(page, FRONTEND, ACCOUNTS.bidder.mobile, ACCOUNTS.bidder.password);
    record('Frontend bidder lands on browse-auctions', page.url().includes('/app/browse-auctions'), page.url());

    const bidderNav = await getNavIds(page);
    const bidderHasBidder = bidderNav.some((id) => BIDDER_NAV_IDS.has(id));
    const bidderNoStaff = !bidderNav.some((id) => STAFF_NAV_IDS.has(id));
    record('Frontend bidder sidebar', bidderHasBidder && bidderNoStaff, bidderNav.join(', '));

    await spaNavigate(page, '/app/auctions');
    record('Frontend bidder /app/auctions denied', page.url().includes('/app/access-denied'), page.url());

    await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle' });
    await submitLogin(page, ACCOUNTS.superAdmin.mobile, ACCOUNTS.superAdmin.password);
    await page.waitForURL((url) => url.port === '5174' && url.search.includes('redirect=staff'), { timeout: 20000 });
    record('Frontend staff login redirects to admin', page.url().includes('redirect=staff'), page.url());
  } catch (err) {
    record('Frontend browser flow', false, err.message);
  }

  const corsConsoleErrors = consoleErrors.filter((e) => /cors/i.test(e));
  record('No CORS console errors (browser)', corsConsoleErrors.length === 0, corsConsoleErrors.join(' | ') || 'none');

  await context.close();
}

async function main() {
  console.log('=== Split baseline verification ===\n');

  for (const [name, url] of [['backend', `${API.replace('/api', '')}/health`], ['frontend', FRONTEND], ['admin', ADMIN]]) {
    try {
      const res = await fetch(url);
      record(`${name} server up`, res.ok, `${url} → ${res.status}`);
    } catch (err) {
      record(`${name} server up`, false, err.message);
    }
  }

  console.log('\n--- API checks ---');
  await runApiChecks();

  console.log('\n--- Browser checks ---');
  const browser = await chromium.launch({ headless: true });
  try {
    await runBrowserChecks(browser);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    console.log('\nFailed:');
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
