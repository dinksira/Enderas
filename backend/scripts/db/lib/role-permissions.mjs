import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const rolePermissionsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../migrations/data/role-permissions.cjs',
);

export const rolePermissions = require(rolePermissionsPath);
