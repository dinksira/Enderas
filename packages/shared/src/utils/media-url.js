import { ENV } from '../api/env.js';

/**
 * Normalize upload URLs returned by the API to match the static mount at /api/uploads.
 */
export function normalizeUploadUrl(url) {
  return url
    .replace(/\/api\/v1\/uploads\//g, '/api/uploads/')
    .replace(/\/v1\/uploads\//g, '/uploads/');
}

/**
 * Resolve a server file URL so it is reachable from the browser.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const normalized = normalizeUploadUrl(trimmed);
  const apiBase = ENV.apiBaseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '');

  if (normalized.startsWith('/uploads/')) {
    return `${apiBase}${normalized}`;
  }

  if (normalized.startsWith('/api/uploads/')) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${normalized}`;
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  return normalized;
}

export default {
  normalizeUploadUrl,
  resolveMediaUrl,
};
