import { ENV } from '@/lib/env';

/**
 * Rewrites server file URLs so they are reachable from the device.
 * The backend may return localhost URLs even when the app talks to a LAN/WSL host.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  if (url.startsWith('file://') || url.startsWith('content://') || url.startsWith('data:')) {
    return url;
  }

  try {
    const apiBase = new URL(ENV.apiBaseUrl);
    const parsed = new URL(url);

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = apiBase.hostname;
      parsed.protocol = apiBase.protocol;
      if (apiBase.port) {
        parsed.port = apiBase.port;
      } else {
        parsed.port = '';
      }
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
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
