import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const roots = [
  'src/layouts',
  'src/modules',
  'src/components',
].map((p) => join(process.cwd(), p));

const cssImportPattern = /^import ['"]\.\/[^'"]+\.css['"];\r?\n/gm;

function walk(dir, callback) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

for (const root of roots) {
  walk(root, (filePath) => {
    if (filePath.endsWith('.jsx')) {
      const before = readFileSync(filePath, 'utf8');
      const after = before.replace(cssImportPattern, '');
      if (after !== before) {
        writeFileSync(filePath, after);
        console.log(`Updated: ${filePath}`);
      }
    }

    if (filePath.endsWith('.css')) {
      unlinkSync(filePath);
      console.log(`Deleted: ${filePath}`);
    }
  });
}

console.log('Local CSS purge complete.');
