import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { resolveMediaUrl } from '@/lib/media-utils';
import { auctionApi } from '@/services/auctionApi';
import type { AuctionDocumentApi } from '@/types/auctionApi';

export function resolveAuctionDocumentUrl(
  auctionId: string,
  documents?: AuctionDocumentApi[] | null,
  docIndex = 0,
  accessToken?: string | null,
): string | undefined {
  const docUrl = documents?.[docIndex]?.url;
  if (docUrl) {
    const resolved = resolveMediaUrl(docUrl);
    if (resolved) {
      return resolved;
    }
  }

  if (auctionId && accessToken) {
    const streamUrl = auctionApi.getDocumentStreamUrl(auctionId, docIndex);
    const separator = streamUrl.includes('?') ? '&' : '?';
    return `${streamUrl}${separator}access_token=${encodeURIComponent(accessToken)}`;
  }

  if (!auctionId) {
    return undefined;
  }

  return auctionApi.getDocumentStreamUrl(auctionId, docIndex);
}

export async function openAuctionDocumentInBrowser(
  auctionId: string,
  documents?: AuctionDocumentApi[] | null,
  docIndex = 0,
  accessToken?: string | null,
): Promise<boolean> {
  const url = resolveAuctionDocumentUrl(auctionId, documents, docIndex, accessToken);
  if (!url) {
    return false;
  }

  try {
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }
}
