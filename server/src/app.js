import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { getCorsOptions } from './config/cors.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(cors(getCorsOptions()));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  const uploadRoot = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadRoot));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Lazy-load API routes so /health works even if DB deps are not installed yet.
  app.use('/api', async (req, res, next) => {
    try {
      const { default: apiRouter } = await import('./routes/index.js');
      return apiRouter(req, res, next);
    } catch (err) {
      next(err);
    }
  });

  app.use(async (req, res, next) => {
    try {
      const { notFoundHandler } = await import('./middleware/errorHandler.js');
      return notFoundHandler(req, res, next);
    } catch (err) {
      res.status(404).json({ message: 'Not found' });
    }
  });

  app.use(async (err, req, res, next) => {
    try {
      const { errorHandler } = await import('./middleware/errorHandler.js');
      return errorHandler(err, req, res, next);
    } catch (e) {
      const status = err?.statusCode || 500;
      res.status(status).json({ message: err?.message || 'Internal server error' });
    }
  });

  return app;
}
