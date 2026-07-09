import { ENV } from '@/lib/env';

/**
 * Normalize upload URLs returned by the API so they match the static mount at /api/uploads.
 * Handles legacy values that incorrectly include /api/v1/uploads.
 */
export function normalizeUploadUrl(url: string): string {
  return url
    .replace(/\/api\/v1\/uploads\//g, '/api/uploads/')
    .replace(/\/v1\/uploads\//g, '/uploads/');
}

/**
 * Rewrites server file URLs so they are reachable from the device.
 * The backend may return localhost URLs even when the app talks to a LAN/WSL host.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  if (url.startsWith('file://') || url.startsWith('content://') || url.startsWith('data:')) {
    return url;
  }

  let normalized = normalizeUploadUrl(url);
  const apiBase = ENV.apiBaseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '');

  if (normalized.startsWith('uploads/')) {
    return `${apiBase}/${normalized}`;
  }

  if (normalized.startsWith('/uploads/')) {
    return `${apiBase}${normalized}`;
  }

  if (normalized.startsWith('/api/uploads/')) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${normalized}`;
  }

  try {
    const apiBaseUrl = new URL(apiBase.includes('://') ? apiBase : `http://${apiBase}`);
    const parsed = new URL(normalized, apiBaseUrl.origin);

    parsed.pathname = normalizeUploadUrl(parsed.pathname);

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = apiBaseUrl.hostname;
      parsed.protocol = apiBaseUrl.protocol;
      if (apiBaseUrl.port) {
        parsed.port = apiBaseUrl.port;
      } else {
        parsed.port = '';
      }
    }

    return parsed.toString();
  } catch {
    return normalized;
  }
}

export function isImageMimeType(mimeType?: string | null): boolean {
  return Boolean(mimeType?.startsWith('image/'));
}

export function isImageSource(url?: string | null, mimeType?: string | null): boolean {
  if (isImageMimeType(mimeType)) return true;
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('file://') || url.startsWith('content://')) return true;
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
}

export function isPdfSource(url?: string | null, mimeType?: string | null): boolean {
  if (mimeType === 'application/pdf') return true;
  if (!url) return false;
  return /\.pdf(\?|$)/i.test(url);
}
