/**
 * Environment contract for the Enderas Auction backend.
 *
 * IMPORTANT: Do not import this module before `load-env.js` has executed.
 * `server.js` preloads environment variables at the top of the execution tree.
 */

function requireEnv(name) {
  if (!(name in process.env)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  const value = process.env[name];

  // Local MySQL installations commonly use an empty root password.
  if (name === 'DB_PASSWORD') {
    return value;
  }

  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export const env = Object.freeze({
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  port: Number(optionalEnv('PORT', '3000')),
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',

  db: Object.freeze({
    host: requireEnv('DB_HOST'),
    port: Number(optionalEnv('DB_PORT', '3306')),
    name: requireEnv('DB_NAME'),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
  }),

  redis: Object.freeze({
    url: requireEnv('REDIS_URL'),
    rbacInvalidateChannel: optionalEnv('RBAC_INVALIDATE_CHANNEL', 'rbac:invalidate'),
    roleCacheTtlSeconds: Number(optionalEnv('RBAC_ROLE_CACHE_TTL_SECONDS', '86400')),
  }),

  jwt: Object.freeze({
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    accessExpiresIn: optionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
  }),

  clientUrl: optionalEnv('CLIENT_URL', 'http://localhost:5173'),
  apiBaseUrl: optionalEnv('API_BASE_URL', 'http://localhost:3000/api'),

  storage: Object.freeze({
    provider: optionalEnv('STORAGE_PROVIDER', 'local'),
    uploadDir: optionalEnv('STORAGE_UPLOAD_DIR', 'uploads'),
    maxFileSize: Number(optionalEnv('STORAGE_MAX_FILE_SIZE', '5242880')), // 5MB
    allowedTypes: optionalEnv('STORAGE_ALLOWED_TYPES', 'image/jpeg,image/png,image/gif,application/pdf').split(','),
  }),

  rbac: Object.freeze({
    l1TtlMs: Number(optionalEnv('RBAC_L1_TTL_MS', '60000')),
    userCacheTtlSeconds: Number(optionalEnv('RBAC_USER_CACHE_TTL_SECONDS', '300')),
  }),

  auctionAutoClose: Object.freeze({
    enabled: optionalEnv('AUCTION_AUTO_CLOSE_ENABLED', 'true') === 'true',
    intervalMs: Number(optionalEnv('AUCTION_AUTO_CLOSE_INTERVAL_MS', '60000')),
  }),

  pendingUserCleanup: Object.freeze({
    enabled: optionalEnv('PENDING_USER_CLEANUP_ENABLED', 'true') === 'true',
    intervalMs: Number(optionalEnv('PENDING_USER_CLEANUP_INTERVAL_MS', '3600000')),
    ttlHours: Number(optionalEnv('PENDING_USER_CLEANUP_TTL_HOURS', '12')),
  }),

  unsplash: Object.freeze({
    accessKey: optionalEnv('UNSPLASH_ACCESS_KEY', ''),
  }),
});

export default env;
