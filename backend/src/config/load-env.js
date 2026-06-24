import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the backend root `.env` file regardless of the caller's cwd.
 * This module must be imported before any config validation runs.
 */
const envFilePath = path.resolve(__dirname, '../../.env');

const { error } = dotenv.config({ path: envFilePath });

if (error && error.code !== 'ENOENT') {
  console.warn(`[env] failed to load ${envFilePath}:`, error.message);
}

export { envFilePath };
