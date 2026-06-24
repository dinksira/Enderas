/**
 * Application entry point.
 * Environment variables MUST be hydrated before any config validation executes.
 */
import './src/config/load-env.js';

import app from './app.js';
import { env } from './src/config/env.config.js';
import { sequelize } from './src/config/db.config.js';

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[db] connection established');

    app.listen(env.port, () => {
      console.log(`[server] listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('[server] failed to start', error);
    process.exit(1);
  }
}

startServer();
