/**
 * @deprecated Use `npm run db:seed:auctions` or `npm run db -- seed test --only=auctions`
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

console.warn('[deprecated] seed-auctions.js — use: npm run db:seed:auctions');

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const result = spawnSync(
  process.execPath,
  ['--env-file=.env', 'scripts/db/cli.mjs', 'seed', 'test', '--only=auctions'],
  { stdio: 'inherit', cwd: backendRoot },
);

process.exit(result.status ?? 1);
