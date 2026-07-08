import { api } from '../api/api.js';

export async function uploadFile(file, folder = 'kyc') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  return api.post('/v1/files', formData);
}

export async function uploadMultipleFiles(files, folder = 'kyc') {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('folder', folder);
  return api.post('/v1/files/multiple', formData);
}

export async function deleteFile(filePath) {
  return api.delete(`/v1/files/${encodeURIComponent(filePath)}`);
}

export const fileUploadService = Object.freeze({
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
});

export default fileUploadService;
