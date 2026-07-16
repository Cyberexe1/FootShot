import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { chatRouter } from './routes/chat.js';
import { wayfindingRouter } from './routes/wayfinding.js';
import { crowdRouter } from './routes/crowd.js';
import { incidentsRouter } from './routes/incidents.js';
import { opsRouter } from './routes/ops.js';
import { servicesRouter } from './routes/services.js';
import { notifyRouter } from './routes/notify.js';

/**
 * Builds and wires the Express application. Kept separate from server startup
 * so it can be imported directly in tests (via supertest).
 */
export function createApp(): Express {
  const app = express();

  // Security headers.
  app.use(helmet());

  // CORS restricted to configured origins (CloudFront domain in production).
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  // Structured request logging.
  app.use(pinoHttp({ logger }));

  // Basic rate limiting for public endpoints.
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  });
  app.use('/api', limiter);

  // Routes.
  app.use('/api', healthRouter);
  app.use('/api', chatRouter);
  app.use('/api', wayfindingRouter);
  app.use('/api', crowdRouter);
  app.use('/api', incidentsRouter);
  app.use('/api', opsRouter);
  app.use('/api', servicesRouter);
  app.use('/api', notifyRouter);

  // 404 + error handling (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
