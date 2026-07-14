import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sequelize } from '../../../src/config/db.config.js';

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

async function dropAllTables() {
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    const tableNames = await queryInterface.showAllTables();
    for (const tableName of tableNames) {
      const normalized = typeof tableName === 'string'
        ? tableName
        : tableName?.tableName ?? tableName?.table_name ?? null;
      if (!normalized) {
        continue;
      }
      await queryInterface.dropTable(normalized);
    }
  } finally {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

export async function resetDatabase() {
  await dropAllTables();
  runMigrations();
}
