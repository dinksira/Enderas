import { env } from '../config/env.config.js';

/**
 * API origin used for public upload URLs (strips trailing /v1 from API_BASE_URL).
 */
export function getPublicApiBaseUrl() {
  return String(env.apiBaseUrl || '').replace(/\/v1\/?$/, '').replace(/\/$/, '');
}

/**
 * Normalize stored upload paths to the public static mount at /api/uploads.
 */
export function resolvePublicUploadUrl(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (
    trimmed.startsWith('http://')
    || trimmed.startsWith('https://')
    || trimmed.startsWith('data:')
    || trimmed.startsWith('blob:')
  ) {
    return trimmed
      .replace(/\/api\/v1\/uploads\//g, '/api/uploads/')
      .replace(/([^:])\/\/+/g, '$1/');
  }

  const apiBase = getPublicApiBaseUrl();

  if (trimmed.startsWith('/api/uploads/')) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${trimmed}`;
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${apiBase}${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `${apiBase}/${trimmed}`;
  }

  return trimmed;
}

export default {
  getPublicApiBaseUrl,
  resolvePublicUploadUrl,
};
