import { ENV, api } from '../api/index.js';

const FILES_BASE = `${ENV.apiV1Prefix}/files`;

export async function uploadFile(file, folder = 'kyc') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  return api.post(FILES_BASE, formData);
}

export async function uploadMultipleFiles(files, folder = 'kyc') {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('folder', folder);
  return api.post(`${FILES_BASE}/multiple`, formData);
}

export async function deleteFile(filePath) {
  return api.delete(`${FILES_BASE}/${encodeURIComponent(filePath)}`);
}

export const fileUploadService = Object.freeze({
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
});

export default fileUploadService;
