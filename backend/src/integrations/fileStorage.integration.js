import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.config.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalFileStorage {
  constructor() {
    this.uploadDir = path.resolve(process.cwd(), env.storage.uploadDir);
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file, folder = 'default') {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const folderPath = path.join(this.uploadDir, folder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, file.buffer);

    const fileUrl = `${env.apiBaseUrl}/uploads/${folder}/${fileName}`;

    return {
      fileName,
      originalName: file.originalname,
      filePath: `${folder}/${fileName}`,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  async delete(filePath) {
    const fullPath = path.join(this.uploadDir, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }

  async getUrl(filePath) {
    return `${env.apiBaseUrl}/uploads/${filePath}`;
  }
}

let storageProvider;

if (env.storage.provider === 'local') {
  storageProvider = new LocalFileStorage();
} else {
  throw new Error(`Unsupported storage provider: ${env.storage.provider}`);
}

export default storageProvider;
