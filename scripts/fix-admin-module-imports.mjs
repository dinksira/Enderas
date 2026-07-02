/**
 * Normalize imports after moving a module from frontend to admin.
 * Usage: node scripts/fix-admin-module-imports.mjs admin/src/modules/<name>
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const targetDir = resolve(process.argv[2]);
if (!targetDir) {
  console.error('Usage: node scripts/fix-admin-module-imports.mjs <module-dir>');
  process.exit(1);
}

const UI_ADMIN_COMPONENTS = [
  'AdminDataTable',
  'StatusPill',
  'PaginationBar',
  'DateRangeFilter',
  'AdminDetailDrawer',
  'ApproveConfirmModal',
  'RejectReasonModal',
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(js|jsx)$/.test(entry)) files.push(path);
  }
  return files;
}

function fixContent(content) {
  let next = content;

  for (const name of UI_ADMIN_COMPONENTS) {
    next = next.replace(
      new RegExp(`import\\s*\\{\\s*${name}\\s*\\}\\s*from\\s*['"]\\.\\./\\.\\./\\.\\./components/admin/${name}\\.jsx['"];?\\s*\\n`, 'g'),
      '',
    );
  }

  if (next.includes('@enderass/shared/ui-admin') === false) {
    const usedAdmin = UI_ADMIN_COMPONENTS.filter((name) =>
      new RegExp(`\\b${name}\\b`).test(next),
    );
    if (usedAdmin.length) {
      next = `import { ${usedAdmin.join(', ')} } from '@enderass/shared/ui-admin';\n${next}`;
    }
  }

  const uiImports = new Set();
  const uiPatterns = [
    ['Button', /import\s*\{\s*Button\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/Button\.jsx['"];?\s*\n/g],
    ['Input', /import\s*\{\s*Input\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/Input\.jsx['"];?\s*\n/g],
    ['Card', /import\s*\{\s*Card\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/Card\.jsx['"];?\s*\n/g],
    ['Can', /import\s*\{\s*Can\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/Can\.jsx['"];?\s*\n/g],
    ['DashboardToast', /import\s*\{\s*DashboardToast\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/DashboardToast\.jsx['"];?\s*\n/g],
    ['FileUpload', /import\s*\{\s*FileUpload\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/FileUpload\.jsx['"];?\s*\n/g],
    ['ImageViewer', /import\s*\{\s*ImageViewer\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/ImageViewer\.jsx['"];?\s*\n/g],
  ];

  for (const [name, pattern] of uiPatterns) {
    if (pattern.test(next)) {
      uiImports.add(name);
      next = next.replace(pattern, '');
    }
  }

  if (uiImports.size && !next.includes("from '@enderass/shared/ui'")) {
    next = `import { ${[...uiImports].join(', ')} } from '@enderass/shared/ui';\n${next}`;
  } else if (uiImports.size) {
    // merge into existing ui import if present
    const match = next.match(/import\s*\{([^}]+)\}\s*from\s*'@enderass\/shared\/ui';/);
    if (match) {
      const existing = match[1].split(',').map((s) => s.trim()).filter(Boolean);
      const merged = [...new Set([...existing, ...uiImports])].join(', ');
      next = next.replace(match[0], `import { ${merged} } from '@enderass/shared/ui';`);
    }
  }

  next = next.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/hooks\/use-paginated-resource\.js['"];?\s*\n/g,
    "import { usePaginatedResource } from '@enderass/shared/hooks';\n",
  );

  next = next.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/hooks\/use-auth\.js['"];?\s*\n/g,
    "import { useAuth } from '../../../hooks/use-auth.js';\n",
  );

  // Collapse duplicate ui-admin imports
  const adminImportMatches = [...next.matchAll(/import\s*\{([^}]+)\}\s*from\s*'@enderass\/shared\/ui-admin';/g)];
  if (adminImportMatches.length > 1) {
    const merged = [...new Set(adminImportMatches.flatMap((m) => m[1].split(',').map((s) => s.trim())))];
    next = next.replace(/import\s*\{[^}]+\}\s*from\s*'@enderass\/shared\/ui-admin';\s*\n/g, '');
    next = `import { ${merged.join(', ')} } from '@enderass/shared/ui-admin';\n${next}`;
  }

  return next;
}

let changed = 0;
for (const file of walk(targetDir)) {
  const original = readFileSync(file, 'utf8');
  const updated = fixContent(original);
  if (updated !== original) {
    writeFileSync(file, updated);
    changed += 1;
    console.log('fixed', file);
  }
}

console.log(`Done. Updated ${changed} files in ${targetDir}`);
