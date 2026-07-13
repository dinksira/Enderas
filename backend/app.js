import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { i18nMiddleware } from './src/config/i18n.config.js';
import apiRouter from './src/routes/index.js';
import { errorMiddleware } from './src/middleware/error.middleware.js';
import { env } from './src/config/env.config.js';

console.log('=== APP.JS LOADED == env.isProduction', env.isProduction);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable('x-powered-by');

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use((req, res, next) => {
  console.log(`[http] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(i18nMiddleware);

// Serve static files from uploads directory
const uploadsDir = path.resolve(process.cwd(), env.storage.uploadDir);
app.use('/api/uploads', express.static(uploadsDir));

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.use('/api', apiRouter);

app.use(errorMiddleware);

export default app;
