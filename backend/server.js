/**
 * Application entry point.
 * Environment variables MUST be hydrated before any config validation executes.
 */
import './src/config/load-env.js';

import app from './app.js';
import { env } from './src/config/env.config.js';
import { sequelize } from './src/config/db.config.js';
import {
  startAuctionAutoCloseJob,
  stopAuctionAutoCloseJob,
} from './src/jobs/auction-auto-close.job.js';
import {
  startPendingUserCleanupJob,
  stopPendingUserCleanupJob,
} from './src/jobs/pending-user-cleanup.job.js';

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[db] connection established');

    startAuctionAutoCloseJob();
    startPendingUserCleanupJob();

    app.listen(env.port, () => {
      console.log(`[server] listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('[server] failed to start', error);
    process.exit(1);
  }
}

function shutdown() {
  stopAuctionAutoCloseJob();
  stopPendingUserCleanupJob();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
