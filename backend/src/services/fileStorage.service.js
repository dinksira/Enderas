import storageProvider from '../integrations/fileStorage.integration.js';
import { AppError } from '../utils/error.util.js';
import { env } from '../config/env.config.js';

async function uploadFile(file, folder = 'default') {
  if (!file) {
    throw new AppError('No file provided', 400);
  }

  if (!env.storage.allowedTypes.includes(file.mimetype)) {
    throw new AppError('Invalid file type', 400);
  }

  if (file.size > env.storage.maxFileSize) {
    throw new AppError('File too large', 400);
  }

  return await storageProvider.upload(file, folder);
}

async function deleteFile(filePath) {
  return await storageProvider.delete(filePath);
}

async function getFileUrl(filePath) {
  return await storageProvider.getUrl(filePath);
}

export const fileStorageService = Object.freeze({
  uploadFile,
  deleteFile,
  getFileUrl,
});

export default fileStorageService;
