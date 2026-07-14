import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function runSequelizeCli(args) {
  const isWin = process.platform === 'win32';
  const result = spawnSync('npx', ['sequelize-cli', ...args], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
    shell: isWin,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`sequelize-cli ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

export function runMigrations() {
  runSequelizeCli(['db:migrate']);
}

export function undoLastMigration() {
  runSequelizeCli(['db:migrate:undo']);
}

export function undoAllMigrations() {
  runSequelizeCli(['db:migrate:undo:all']);
}

export function resetDatabase() {
  undoAllMigrations();
  runMigrations();
}
