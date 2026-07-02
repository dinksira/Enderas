/**
 * Group C dual-view module separation: copy staff files to admin, fix imports.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, statSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const frontend = join(root, 'frontend/src/modules');
const admin = join(root, 'admin/src/modules');

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function copyFile(src, dst) {
  ensureDir(dirname(dst));
  copyFileSync(src, dst);
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

function fixAdminModuleImports(content, moduleDepth = 3) {
  let next = content;

  const UI_ADMIN = ['AdminDataTable', 'StatusPill', 'PaginationBar', 'DateRangeFilter', 'AdminDetailDrawer', 'ApproveConfirmModal', 'RejectReasonModal'];
  for (const name of UI_ADMIN) {
    next = next.replace(new RegExp(`import\\s*\\{\\s*${name}\\s*\\}\\s*from\\s*['"]\\.\\./\\.\\./\\.\\./components/admin/${name}\\.jsx['"];?\\s*\\n`, 'g'), '');
  }

  const uiPatterns = [
    ['Button', /import\s*\{\s*Button\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/Button\.jsx['"];?\s*\n/g],
    ['Input', /import\s*\{\s*Input\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/Input\.jsx['"];?\s*\n/g],
    ['Card', /import\s*\{\s*Card\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/Card\.jsx['"];?\s*\n/g],
    ['Can', /import\s*\{\s*Can\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/Can\.jsx['"];?\s*\n/g],
    ['DashboardToast', /import\s*\{\s*DashboardToast\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/DashboardToast\.jsx['"];?\s*\n/g],
    ['FileUpload', /import\s*\{\s*FileUpload\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/FileUpload\.jsx['"];?\s*\n/g],
    ['ImageViewer', /import\s*\{\s*ImageViewer\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/ImageViewer\.jsx['"];?\s*\n/g],
  ];
  const uiImports = new Set();
  for (const [name, pattern] of uiPatterns) {
    if (pattern.test(next)) {
      uiImports.add(name);
      next = next.replace(pattern, '');
    }
  }
  next = next.replace(/import\s*\{\s*DashboardToast\s*\}\s*from\s*['"]\.\.\/components\/DashboardToast\.jsx['"];?\s*\n/g, '');
  if (/\bDashboardToast\b/.test(next) && !next.includes('@enderass/shared/ui')) {
    uiImports.add('DashboardToast');
  }

  if (uiImports.size && !next.includes("from '@enderass/shared/ui'")) {
    next = `import { ${[...uiImports].join(', ')} } from '@enderass/shared/ui';\n${next}`;
  }

  const usedAdmin = UI_ADMIN.filter((name) => new RegExp(`\\b${name}\\b`).test(next));
  if (usedAdmin.length && !next.includes('@enderass/shared/ui-admin')) {
    next = `import { ${usedAdmin.join(', ')} } from '@enderass/shared/ui-admin';\n${next}`;
  }

  next = next.replace(
    /import\s*\{[^}]*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/hooks\/use-paginated-resource\.js['"];?\s*\n/g,
    "import { usePaginatedResource } from '@enderass/shared/hooks';\n",
  );

  next = next.replace(
    /import\s*\{[^}]*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/hooks\/use-auth\.js['"];?\s*\n/g,
    "import { useAuth } from '@enderass/shared/hooks';\n",
  );

  next = next.replace(
    /import\s*\{[^}]*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/config\/navigation\.config\.js['"];?\s*\n/g,
    "import { MODULES, ACTIONS } from '../../../config/navigation.config.js';\n",
  );

  // Services -> shared
  const serviceNames = ['auctionService', 'paymentService', 'cpoService', 'bidService', 'kycService', 'assetService', 'notificationService', 'dashboardService', 'userService'];
  for (const svc of serviceNames) {
    next = next.replace(
      new RegExp(`import\\s*\\{[^}]*\\b${svc}\\b[^}]*\\}\\s*from\\s*['"][^'"]+['"];?\\s*\\n`, 'g'),
      `import { ${svc} } from '@enderass/shared/services';\n`,
    );
  }
  next = next.replace(
    /import\s*\{[^}]*\}\s*from\s*['"][^'"]*\/services\/[^'"]+['"];?\s*\n/g,
    '',
  );
  // kyc named imports
  next = next.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"][^'"]*kyc\.service[^'"]*['"];?\s*\n/g,
    "import { $1 } from '@enderass/shared/services';\n",
  );

  // Utils -> shared
  next = next.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*user-management-utils[^'"]*['"];?\s*\n/g,
    (match, imports) => {
      const names = imports.split(',').map((s) => s.trim()).filter(Boolean);
      const shared = names.filter((n) => ['formatDisplayValue', 'formatDate'].includes(n));
      const local = names.filter((n) => !['formatDisplayValue', 'formatDate'].includes(n));
      let result = '';
      if (shared.length) result += `import { ${shared.join(', ')} } from '@enderass/shared/utils';\n`;
      if (local.length) result += `import { ${local.join(', ')} } from '../utils/user-management-utils.js';\n`;
      return result || match;
    },
  );
  next = next.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*auction-drawer-utils[^'"]*['"];?\s*\n/g,
    (match, imports) => {
      const names = imports.split(',').map((s) => s.trim()).filter(Boolean);
      const sharedNames = ['formatEtbAmount', 'normalizeAuctionStatus', 'statusPillClass'];
      const shared = names.filter((n) => sharedNames.includes(n));
      const local = names.filter((n) => !sharedNames.includes(n));
      let result = '';
      if (shared.length) result += `import { ${shared.join(', ')} } from '@enderass/shared/utils';\n`;
      if (local.length) result += `import { ${local.join(', ')} } from '../utils/auction-drawer-utils.js';\n`;
      return result || match;
    },
  );

  // Cross-module auction imports within admin
  next = next.replace(
    /from\s*['"]\.\.\/\.\.\/auctions\/[^'"]+['"]/g,
    (m) => m.replace('../../auctions/', '../../auctions/'),
  );

  // PageSearchContext - admin path
  next = next.replace(
    /from\s*['"]\.\.\/\.\.\/\.\.\/contexts\/PageSearchContext\.jsx['"]/g,
    "from '../../../contexts/PageSearchContext.jsx'",
  );

  // Permission / auth from shared
  next = next.replace(/from\s*['"]\.\.\/\.\.\/\.\.\/core\/auth[^'"]*['"]/g, "from '@enderass/shared/auth'");

  // Deduplicate consecutive identical imports
  const lines = next.split('\n');
  const seen = new Set();
  const deduped = lines.filter((line) => {
    if (line.startsWith('import ')) {
      if (seen.has(line)) return false;
      seen.add(line);
    }
    return true;
  });
  return deduped.join('\n');
}

function copyAndFix(files, srcBase, dstBase) {
  for (const rel of files) {
    const src = join(srcBase, rel);
    const dst = join(dstBase, rel);
    if (!existsSync(src)) {
      console.warn('skip missing', src);
      continue;
    }
    copyFile(src, dst);
    if (/\.(js|jsx)$/.test(rel)) {
      const content = readFileSync(dst, 'utf8');
      writeFileSync(dst, fixAdminModuleImports(content));
    }
    console.log('copied', rel);
  }
}

// --- auctions ---
copyAndFix(
  [
    'components/CreateAuctionModal.jsx',
    'components/AuctionDetailDrawer.jsx',
    'components/AuctionDeleteConfirmModal.jsx',
    'components/AuctionSuspendConfirmModal.jsx',
    'components/auction-list.jsx',
    'components/auction-admin-tokens.js',
    'hooks/use-auctions.js',
    'utils/auction-form-utils.js',
    'utils/auction-drawer-utils.js',
  ],
  join(frontend, 'auctions'),
  join(admin, 'auctions'),
);

// --- payments ---
copyAndFix(
  [
    'views/PaymentManagementView.jsx',
    'components/PaymentDetailDrawer.jsx',
    'components/PaymentRejectModal.jsx',
    'hooks/use-payments.js',
    'utils/payment-management-utils.js',
  ],
  join(frontend, 'payments'),
  join(admin, 'payments'),
);

// --- cpo-management ---
copyAndFix(
  [
    'views/CpoManagementView.jsx',
    'components/CpoDetailDrawer.jsx',
    'components/CpoRejectModal.jsx',
    'components/CpoApproveModal.jsx',
    'hooks/use-cpo-records.js',
    'utils/cpo-management-utils.js',
  ],
  join(frontend, 'cpo-management'),
  join(admin, 'cpo-management'),
);

// --- bid-management ---
copyAndFix(
  [
    'views/BidManagementView.jsx',
    'components/BidDetailDrawer.jsx',
    'hooks/use-bids.js',
    'utils/bid-management-utils.js',
  ],
  join(frontend, 'bid-management'),
  join(admin, 'bid-management'),
);

// --- kyc ---
copyAndFix(
  [
    'views/KYCManagementView.jsx',
    'components/KYCManagementDetailDrawer.jsx',
    'components/KYCRejectModal.jsx',
    'components/KYCApproveConfirmModal.jsx',
    'components/kyc-document-field.jsx',
    'utils/kyc-management-utils.js',
  ],
  join(frontend, 'kyc'),
  join(admin, 'kyc'),
);

// --- assets ---
copyAndFix(
  [
    'views/AssetRequestsView.jsx',
    'components/AssetRequestDetailDrawer.jsx',
    'components/AssetRejectModal.jsx',
    'components/AssetApproveConfirmModal.jsx',
    'hooks/use-assets.js',
    'utils/asset-form-utils.js',
  ],
  join(frontend, 'assets'),
  join(admin, 'assets'),
);

// --- users ---
copyAndFix(
  [
    'views/UserManagementView.jsx',
    'views/LoginView.jsx',
    'views/user-profile-view.jsx',
    'components/UserDetailDrawer.jsx',
    'components/UserCreateModal.jsx',
    'components/UserEditModal.jsx',
    'components/UserDeleteConfirmModal.jsx',
    'components/UserStatusModal.jsx',
    'components/auth-login-card.jsx',
    'components/otp-verification-step.jsx',
    'components/credentials-step.jsx',
    'components/login-locale-switcher.jsx',
    'components/login-brand-header.jsx',
    'components/auth-brand-panel.jsx',
    'components/user-profile-card.jsx',
    'components/otp-input-grid.jsx',
    'hooks/use-users.js',
    'hooks/use-user-profile.js',
    'utils/user-management-utils.js',
    'utils/resolve-auth-error.js',
  ],
  join(frontend, 'users'),
  join(admin, 'users'),
);

// --- notifications ---
copyAndFix(
  ['views/NotificationCenterView.jsx'],
  join(frontend, 'notifications'),
  join(admin, 'notifications'),
);

// --- dashboard ---
copyAndFix(
  ['views/ModulePageView.jsx'],
  join(frontend, 'dashboard'),
  join(admin, 'dashboard'),
);

// Service re-export stubs in frontend
const stub = (name, exportName) => `export { ${exportName} } from '@enderass/shared/services';\nexport { default } from '@enderass/shared/services/${name}';\n`;

const stubs = {
  'frontend/src/modules/auctions/services/auction-service.js': stub('auction-service', 'auctionService'),
  'frontend/src/modules/payments/services/payment-service.js': stub('payment-service', 'paymentService'),
  'frontend/src/modules/cpo-management/services/cpo-service.js': stub('cpo-service', 'cpoService'),
  'frontend/src/modules/bid-management/services/bid-service.js': stub('bid-service', 'bidService'),
  'frontend/src/modules/kyc/services/kyc.service.js': `export * from '@enderass/shared/services/kyc.service.js';\nexport { default } from '@enderass/shared/services/kyc.service.js';\n`,
  'frontend/src/modules/assets/services/asset-service.js': stub('asset-service', 'assetService'),
  'frontend/src/modules/notifications/services/notification-service.js': stub('notification-service', 'notificationService'),
  'frontend/src/modules/dashboard/services/dashboard-service.js': stub('dashboard-service', 'dashboardService'),
  'frontend/src/modules/users/services/user-service.js': stub('user-service', 'userService'),
};

for (const [rel, content] of Object.entries(stubs)) {
  writeFileSync(join(root, rel), content);
  console.log('stub', rel);
}

console.log('\nGroup C migration copy complete.');
