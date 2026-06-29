import { Router } from 'express';
import { fileUploadController } from '../controllers/fileUpload.controller.js';
import { uploadSingleFile, uploadMultipleFiles } from '../middlewares/upload.middleware.js';
import { enforceBidderUploadFolderScope } from '../middlewares/bidder-file-upload.middleware.js';
import { authenticate, authorize, MODULES, ACTIONS } from '../core/authorization/index.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize({ module: MODULES.FILES, action: ACTIONS.CREATE }),
  uploadSingleFile('file'),
  enforceBidderUploadFolderScope,
  fileUploadController.uploadFile,
);
router.post(
  '/multiple',
  authenticate,
  authorize({ module: MODULES.FILES, action: ACTIONS.CREATE }),
  uploadMultipleFiles('files', 10),
  enforceBidderUploadFolderScope,
  fileUploadController.uploadMultipleFiles,
);
router.delete(
  '/:filePath',
  authenticate,
  authorize({ module: MODULES.FILES, action: ACTIONS.DELETE }),
  fileUploadController.deleteFile,
);

export default router;
