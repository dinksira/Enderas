import { File, Paths, UploadType } from 'expo-file-system';

import { ENV } from '@/lib/env';
import { useAuthStore } from '@/lib/authStore';
import { ApiError, refreshStoredSession } from '@/services/api';

export interface UploadedFile {
  fileName: string;
  originalName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

function normalizeMimeType(mimeType: string, fileName: string): string {
  if (mimeType && mimeType !== 'application/octet-stream' && mimeType !== 'image') {
    return mimeType;
  }

  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension && MIME_BY_EXTENSION[extension]) {
    return MIME_BY_EXTENSION[extension];
  }

  return 'application/octet-stream';
}

function uploadCacheFileName(file: PickedFile): string {
  const extension = file.name.includes('.')
    ? file.name.split('.').pop()?.toLowerCase() || 'bin'
    : 'bin';
  return `upload-${Date.now()}.${extension}`;
}

function needsCacheCopy(uri: string): boolean {
  return uri.includes('/DocumentPicker/');
}

/**
 * Prepare a readable File for upload. Uses expo-file-system's native File API which
 * supports content:// URIs and can copy unreadable DocumentPicker cache files.
 */
async function resolveUploadFile(picked: PickedFile): Promise<File> {
  const source = new File(picked.uri);

  if (source.exists && source.size > 0 && !needsCacheCopy(picked.uri)) {
    return source;
  }

  const destination = new File(Paths.cache, uploadCacheFileName(picked));
  if (destination.exists) {
    destination.delete();
  }
  destination.create({ overwrite: true });

  try {
    await source.copy(destination, { overwrite: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not prepare the selected file for upload.';
    throw new ApiError(message, 'UPLOAD_PREP_ERROR');
  }

  if (!destination.exists || destination.size <= 0) {
    throw new ApiError('The selected file could not be read. Please try again.', 'UPLOAD_PREP_ERROR');
  }

  return destination;
}

function parseUploadResponse(body: string): UploadedFile {
  const payload = JSON.parse(body) as { data?: UploadedFile } | UploadedFile;
  const data = (payload as { data?: UploadedFile }).data ?? (payload as UploadedFile);

  if (!data?.fileUrl) {
    throw new ApiError('Upload succeeded but the server returned an invalid response.', 'UPLOAD_ERROR');
  }

  return data;
}

function parseUploadError(status: number, body: string): ApiError {
  try {
    const errorBody = JSON.parse(body) as { message?: string; code?: string };
    return new ApiError(
      errorBody.message || `Request failed with status ${status}`,
      errorBody.code,
      status,
    );
  } catch {
    return new ApiError(`Request failed with status ${status}`, 'UPLOAD_ERROR', status);
  }
}

async function performUpload(
  uploadSource: File,
  url: string,
  mimeType: string,
  folder: string,
  token: string | null,
) {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return uploadSource.upload(url, {
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    parameters: { folder },
    headers,
  });
}

export async function uploadFile(file: PickedFile, folder = 'kyc'): Promise<UploadedFile> {
  const mimeType = normalizeMimeType(file.mimeType, file.name);
  const token = useAuthStore.getState().accessToken;
  const url = `${ENV.apiBaseUrl}/v1/files`;

  const uploadSource = await resolveUploadFile(file);

  let result;

  try {
    result = await performUpload(uploadSource, url, mimeType, folder, token);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'File upload failed. Please try again.';
    throw new ApiError(message, 'NETWORK_ERROR');
  }

  if (result.status === 401) {
    const nextToken = await refreshStoredSession();
    if (nextToken) {
      try {
        result = await performUpload(uploadSource, url, mimeType, folder, nextToken);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'File upload failed. Please try again.';
        throw new ApiError(message, 'NETWORK_ERROR');
      }
    } else {
      useAuthStore.getState().expireSession();
      throw new ApiError('Session expired. Please log in again.', 'ACCESS_TOKEN_INVALID', 401);
    }
  }

  if (result.status === 401) {
    useAuthStore.getState().expireSession();
    throw new ApiError('Session expired. Please log in again.', 'ACCESS_TOKEN_INVALID', 401);
  }

  if (result.status < 200 || result.status >= 300) {
    throw parseUploadError(result.status, result.body);
  }

  return parseUploadResponse(result.body);
}

export const fileUploadApi = Object.freeze({
  uploadFile,
});

export default fileUploadApi;
