/**
 * Runtime environment for the mobile app.
 * Mirrors Frontend `config/env.js` (VITE_* → EXPO_PUBLIC_*).
 */
export const ENV = Object.freeze({
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api',
  apiV1Prefix: process.env.EXPO_PUBLIC_API_V1_PREFIX ?? '/v1',
});

/** Full URL for versioned API routes, e.g. `/auctions/browse`. */
export function apiV1Url(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${ENV.apiBaseUrl}${ENV.apiV1Prefix}${normalized}`;
}

export default ENV;
