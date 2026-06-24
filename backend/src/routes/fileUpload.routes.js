import { Router } from 'express';
import { fileUploadController } from '../controllers/fileUpload.controller.js';
import { uploadSingleFile, uploadMultipleFiles } from '../middlewares/upload.middleware.js';
import { authenticate } from '../core/authorization/index.js';

const router = Router();

router.post('/', authenticate, uploadSingleFile('file'), fileUploadController.uploadFile);
router.post('/multiple', authenticate, uploadMultipleFiles('files', 10), fileUploadController.uploadMultipleFiles);
router.delete('/:filePath', authenticate, fileUploadController.deleteFile);

export default router;
