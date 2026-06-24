import { sendSuccess } from '../utils/response.util.js';
import { fileStorageService } from '../services/fileStorage.service.js';

export async function uploadFile(req, res, next) {
  try {
    const { folder } = req.body;
    const file = req.file;
    const result = await fileStorageService.uploadFile(file, folder || 'default');

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function uploadMultipleFiles(req, res, next) {
  try {
    const { folder } = req.body;
    const files = req.files;
    const results = await Promise.all(
      files.map((file) => fileStorageService.uploadFile(file, folder || 'default'))
    );

    return sendSuccess(res, { files: results });
  } catch (error) {
    return next(error);
  }
}

export async function deleteFile(req, res, next) {
  try {
    const { filePath } = req.params;
    const deleted = await fileStorageService.deleteFile(filePath);

    return sendSuccess(res, { deleted });
  } catch (error) {
    return next(error);
  }
}

export const fileUploadController = Object.freeze({
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
});

export default fileUploadController;
