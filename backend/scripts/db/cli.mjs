import '../../src/config/load-env.js';

import { sequelize } from '../../src/config/db.config.js';
import { runMigrations, resetDatabase } from './lib/migrate.mjs';
import { purgeTestData } from './lib/purge.mjs';
import { runSeed, printSeedCredentials } from './seeds/index.mjs';

const HELP = `
Enderass database CLI

Usage:
  node scripts/db/cli.mjs <command> [mode] [options]

Commands:
  migrate                 Run pending Sequelize migrations
  seed [normal|test]      Seed baseline (normal) or full test data (test, default)
  setup [normal|test]     migrate + seed
  reseed [normal|test]    purge seeded data, then seed again
  reset [normal|test]     undo all migrations, migrate, then seed (destructive)
  help                    Show this help

Options:
  --only=users,staff,auctions   Run specific test seed steps (test mode only)
  --force                       Required for reset on non-development NODE_ENV

Examples:
  npm run db -- setup test
  npm run db -- seed test
  npm run db -- reseed test
  npm run db -- seed test --only=auctions
`.trim();

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift() ?? 'help';
  let mode = 'test';
  const only = [];
  let force = false;

  if (args[0] === 'normal' || args[0] === 'test') {
    mode = args.shift();
  }

  for (const arg of args) {
    if (arg === '--force') {
      force = true;
      continue;
    }

    if (arg.startsWith('--only=')) {
      only.push(...arg.slice('--only='.length).split(',').map((part) => part.trim()).filter(Boolean));
    }
  }

  return { command, mode, only, force };
}

function assertSafeReset(force) {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  if (nodeEnv !== 'development' && !force) {
    throw new Error(
      `reset is destructive. Set NODE_ENV=development or pass --force (current NODE_ENV=${nodeEnv}).`,
    );
  }
}

export async function runCli(argv) {
  const { command, mode, only, force } = parseArgs(argv);

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(HELP);
    return;
  }

  if (!['normal', 'test'].includes(mode)) {
    throw new Error(`Invalid mode '${mode}'. Use 'normal' or 'test'.`);
  }

  await sequelize.authenticate();
  console.log('[db] connected');

  switch (command) {
    case 'migrate':
      runMigrations();
      break;

    case 'seed':
      await runSeed({ mode, only, logger: console });
      printSeedCredentials(mode, console);
      break;

    case 'setup':
      runMigrations();
      await runSeed({ mode, only, logger: console });
      printSeedCredentials(mode, console);
      break;

    case 'reseed': {
      const transaction = await sequelize.transaction();
      try {
        await purgeTestData({ transaction, logger: console });
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      await runSeed({ mode, only, logger: console });
      printSeedCredentials(mode, console);
      break;
    }

    case 'reset':
      assertSafeReset(force);
      resetDatabase();
      await runSeed({ mode, only, logger: console });
      printSeedCredentials(mode, console);
      break;

    default:
      throw new Error(`Unknown command '${command}'. Run with 'help' for usage.`);
  }
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('scripts/db/cli.mjs');

if (isDirectRun) {
  try {
    await runCli(process.argv.slice(2));
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('[db] failed:', error.message ?? error);
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
}
