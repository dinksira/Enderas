import multer from 'multer';
import { env } from '../config/env.config.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (env.storage.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: env.storage.maxFileSize,
  },
  fileFilter,
});

export const uploadSingleFile = (fieldName) => upload.single(fieldName);
export const uploadMultipleFiles = (fieldName, maxCount) => upload.array(fieldName, maxCount);

export default upload;
