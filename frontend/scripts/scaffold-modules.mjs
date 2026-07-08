import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const modulesRoot = join(__dirname, '..', 'src', 'modules');

const modules = [
  {
    dir: 'auctions',
    serviceName: 'auctionService',
    serviceFile: 'auction-service.js',
    hookFile: 'use-auctions.js',
    hookName: 'useAuctions',
    componentFile: 'auction-list.jsx',
    componentName: 'AuctionList',
    componentCss: 'auction-list.css',
    componentClass: 'auction-list',
    viewFile: 'auction-catalog-view.jsx',
    viewName: 'AuctionCatalogView',
    viewCss: 'auction-catalog-view.css',
    viewClass: 'auctions-view',
    title: 'Auction Catalog',
    description: 'Core auction catalogs, scheduling, and live listings.',
    apiBase: '/auctions',
  },
  {
    dir: 'asset-request',
    serviceName: 'assetRequestService',
    serviceFile: 'asset-request-service.js',
    hookFile: 'use-asset-requests.js',
    hookName: 'useAssetRequests',
    componentFile: 'asset-request-form.jsx',
    componentName: 'AssetRequestForm',
    componentCss: 'asset-request-form.css',
    componentClass: 'asset-request-form',
    viewFile: 'asset-request-view.jsx',
    viewName: 'AssetRequestView',
    viewCss: 'asset-request-view.css',
    viewClass: 'asset-request-view',
    title: 'Asset Request Intake',
    description: 'Asset submissions, intake evaluations, and approval tracking.',
    apiBase: '/asset-requests',
  },
  {
    dir: 'users',
    serviceName: 'userService',
    serviceFile: 'user-service.js',
    hookFile: 'use-user-profile.js',
    hookName: 'useUserProfile',
    componentFile: 'user-profile-card.jsx',
    componentName: 'UserProfileCard',
    componentCss: 'user-profile-card.css',
    componentClass: 'user-profile-card',
    viewFile: 'user-profile-view.jsx',
    viewName: 'UserProfileView',
    viewCss: 'user-profile-view.css',
    viewClass: 'users-view',
    title: 'User Profiles & KYC',
    description: 'Bidder onboarding, identity profiles, and KYC compliance records.',
    apiBase: '/users',
  },
  {
    dir: 'staff-roles',
    serviceName: 'staffRoleService',
    serviceFile: 'staff-role-service.js',
    hookFile: 'use-staff-roles.js',
    hookName: 'useStaffRoles',
    componentFile: 'role-permission-table.jsx',
    componentName: 'RolePermissionTable',
    componentCss: 'role-permission-table.css',
    componentClass: 'role-permission-table',
    viewFile: 'staff-roles-view.jsx',
    viewName: 'StaffRolesView',
    viewCss: 'staff-roles-view.css',
    viewClass: 'staff-roles-view',
    title: 'Staff Roles & Access',
    description: 'Internal administrator accounts, role permissions, and access controls.',
    apiBase: '/staff-roles',
  },
  {
    dir: 'payments',
    serviceName: 'paymentService',
    serviceFile: 'payment-service.js',
    hookFile: 'use-payments.js',
    hookName: 'usePayments',
    componentFile: 'payment-receipt-card.jsx',
    componentName: 'PaymentReceiptCard',
    componentCss: 'payment-receipt-card.css',
    componentClass: 'payment-receipt-card',
    viewFile: 'payments-view.jsx',
    viewName: 'PaymentsView',
    viewCss: 'payments-view.css',
    viewClass: 'payments-view',
    title: 'Payments & Receipts',
    description: 'Auction entry fees, document purchases, and receipt verification.',
    apiBase: '/payments',
  },
  {
    dir: 'cpo-management',
    serviceName: 'cpoService',
    serviceFile: 'cpo-service.js',
    hookFile: 'use-cpo-records.js',
    hookName: 'useCpoRecords',
    componentFile: 'cpo-upload-form.jsx',
    componentName: 'CpoUploadForm',
    componentCss: 'cpo-upload-form.css',
    componentClass: 'cpo-upload-form',
    viewFile: 'cpo-management-view.jsx',
    viewName: 'CpoManagementView',
    viewCss: 'cpo-management-view.css',
    viewClass: 'cpo-management-view',
    title: 'CPO Management',
    description: 'Certified Payment Orders, bank slip uploads, and financial flags.',
    apiBase: '/cpo',
  },
  {
    dir: 'bid-management',
    serviceName: 'bidService',
    serviceFile: 'bid-service.js',
    hookFile: 'use-bid-session.js',
    hookName: 'useBidSession',
    componentFile: 'bid-history-chart.jsx',
    componentName: 'BidHistoryChart',
    componentCss: 'bid-history-chart.css',
    componentClass: 'bid-history-chart',
    viewFile: 'bid-management-view.jsx',
    viewName: 'BidManagementView',
    viewCss: 'bid-management-view.css',
    viewClass: 'bid-management-view',
    title: 'Bid Management',
    description: 'Live bidding loops, automatic increments, and bid history charts.',
    apiBase: '/bids',
  },
  {
    dir: 'analytics-report',
    serviceName: 'analyticsService',
    serviceFile: 'analytics-service.js',
    hookFile: 'use-analytics-metrics.js',
    hookName: 'useAnalyticsMetrics',
    componentFile: 'metrics-dashboard-panel.jsx',
    componentName: 'MetricsDashboardPanel',
    componentCss: 'metrics-dashboard-panel.css',
    componentClass: 'metrics-dashboard-panel',
    viewFile: 'analytics-report-view.jsx',
    viewName: 'AnalyticsReportView',
    viewCss: 'analytics-report-view.css',
    viewClass: 'analytics-report-view',
    title: 'Analytics & Reports',
    description: 'System metrics dashboard, operational graphs, and file exports.',
    apiBase: '/analytics',
  },
  {
    dir: 'setting',
    serviceName: 'settingService',
    serviceFile: 'setting-service.js',
    hookFile: 'use-settings.js',
    hookName: 'useSettings',
    componentFile: 'localization-config-form.jsx',
    componentName: 'LocalizationConfigForm',
    componentCss: 'localization-config-form.css',
    componentClass: 'localization-config-form',
    viewFile: 'setting-view.jsx',
    viewName: 'SettingView',
    viewCss: 'setting-view.css',
    viewClass: 'setting-view',
    title: 'System Settings',
    description: 'Localization configs, currency options, and global system variables.',
    apiBase: '/settings',
  },
];

function write(relPath, content) {
  const fullPath = join(modulesRoot, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

for (const mod of modules) {
  const base = mod.dir;

  write(
    `${base}/services/${mod.serviceFile}`,
    `import { api } from '../../../services/api.js';

export const ${mod.serviceName} = Object.freeze({
  getAll: () => api.get('${mod.apiBase}'),
  getById: (id) => api.get(\`${mod.apiBase}/\${id}\`),
  create: (payload) => api.post('${mod.apiBase}', payload),
  update: (id, payload) => api.put(\`${mod.apiBase}/\${id}\`, payload),
  remove: (id) => api.delete(\`${mod.apiBase}/\${id}\`),
});

export default ${mod.serviceName};
`,
  );

  write(
    `${base}/services/index.js`,
    `export { ${mod.serviceName} } from './${mod.serviceFile}';
export { default } from './${mod.serviceFile}';
`,
  );

  write(
    `${base}/hooks/${mod.hookFile}`,
    `import { useCallback, useEffect, useState } from 'react';
import { ${mod.serviceName} } from '../services/${mod.serviceFile}';

export function ${mod.hookName}() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ${mod.serviceName}.getAll();
      setRecords(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}

export default ${mod.hookName};
`,
  );

  write(
    `${base}/hooks/index.js`,
    `export { ${mod.hookName} } from './${mod.hookFile}';
export { default } from './${mod.hookFile}';
`,
  );

  write(
    `${base}/components/${mod.componentCss}`,
    `.${mod.componentClass} {
  background-color: var(--component-card-bg);
  border: 1px solid var(--component-card-border);
  border-radius: var(--component-card-radius);
  padding: var(--component-card-padding);
  box-shadow: var(--component-card-shadow);
}

.${mod.componentClass}__title {
  font-family: var(--component-card-title-font-family);
  font-size: var(--component-card-title-font-size);
  font-weight: var(--component-card-title-font-weight);
  color: var(--component-card-title-color);
  margin-bottom: var(--core-space-2);
}

.${mod.componentClass}__body {
  font-family: var(--component-card-body-font-family);
  font-size: var(--component-card-body-font-size);
  color: var(--component-card-body-color);
}

.${mod.componentClass}__status {
  margin-top: var(--core-space-3);
  font-family: var(--semantic-font-ui);
  font-size: var(--core-font-size-caption);
  font-weight: var(--core-font-weight-semibold);
  letter-spacing: var(--core-letter-spacing-label);
  text-transform: uppercase;
  color: var(--semantic-color-text-secondary);
}
`,
  );

  write(
    `${base}/components/${mod.componentFile}`,
    `import { ${mod.hookName} } from '../hooks/${mod.hookFile}';
import './${mod.componentCss}';

export function ${mod.componentName}() {
  const { records, loading, error } = ${mod.hookName}();

  return (
    <section className="${mod.componentClass}" aria-live="polite">
      <h3 className="${mod.componentClass}__title">${mod.title}</h3>
      <p className="${mod.componentClass}__body">
        Module-specific UI fragment scoped to the ${mod.dir} domain.
      </p>
      <p className="${mod.componentClass}__status">
        {loading && 'Loading records...'}
        {!loading && error && \`Error: \${error}\`}
        {!loading && !error && \`\${records.length} record(s) loaded\`}
      </p>
    </section>
  );
}

export default ${mod.componentName};
`,
  );

  write(
    `${base}/components/index.js`,
    `export { ${mod.componentName} } from './${mod.componentFile}';
export { default } from './${mod.componentFile}';
`,
  );

  write(
    `${base}/views/${mod.viewCss}`,
    `.${mod.viewClass} {
  display: flex;
  flex-direction: column;
  gap: var(--core-space-5);
}

.${mod.viewClass}__title {
  font-family: var(--semantic-font-display);
  font-size: var(--core-font-size-page-title);
  font-weight: var(--core-font-weight-regular);
  line-height: var(--core-line-height-snug);
  color: var(--semantic-color-text-primary);
}

.${mod.viewClass}__lead {
  font-family: var(--semantic-font-ui);
  font-size: var(--core-font-size-body);
  line-height: var(--core-line-height-relaxed);
  color: var(--semantic-color-text-secondary);
  max-width: var(--core-layout-max-width);
}
`,
  );

  write(
    `${base}/views/${mod.viewFile}`,
    `import { ${mod.componentName} } from '../components/${mod.componentFile}';
import './${mod.viewCss}';

export function ${mod.viewName}() {
  return (
    <section className="${mod.viewClass}">
      <header>
        <h1 className="${mod.viewClass}__title">${mod.title}</h1>
        <p className="${mod.viewClass}__lead">${mod.description}</p>
      </header>
      <${mod.componentName} />
    </section>
  );
}

export default ${mod.viewName};
`,
  );

  write(
    `${base}/views/index.js`,
    `export { ${mod.viewName} } from './${mod.viewFile}';
export { default } from './${mod.viewFile}';
`,
  );

  write(
    `${base}/index.js`,
    `export * from './components/index.js';
export * from './hooks/index.js';
export * from './services/index.js';
export * from './views/index.js';
`,
  );
}

const rootExports = modules
  .map((mod) => `export * as ${mod.dir.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^([a-z])/, (m) => m)} from './${mod.dir}/index.js';`)
  .join('\n');

// Fix export names for kebab-case modules
const exportLines = modules.map((mod) => {
  const exportName = mod.dir
    .split('-')
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
  return `export * as ${exportName} from './${mod.dir}/index.js';`;
});

write('index.js', `${exportLines.join('\n')}\n`);

console.log(`Scaffolded ${modules.length} domain modules.`);
