import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import type { PickedFile } from '@/services/fileUploadApi';

/**
 * On Android, avoid DocumentPicker's cache/DocumentPicker file:// URIs when possible.
 * content:// URIs are handled by expo-file-system's File.upload API.
 */
export function documentPickerCopyToCache(): boolean {
  return Platform.OS !== 'android';
}

export async function pickDocumentFile(
  types: string[] = ['image/*', 'application/pdf'],
): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: types,
    copyToCacheDirectory: documentPickerCopyToCache(),
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name || `document-${Date.now()}`,
    mimeType: asset.mimeType || 'application/octet-stream',
  };
}
