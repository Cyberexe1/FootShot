import { Router } from 'express';

export const healthRouter = Router();

/**
 * Health check consumed by App Runner. Kept dependency-free and fast so it
 * reflects process liveness, not downstream availability.
 */
healthRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'fanflow26-backend',
    timestamp: new Date().toISOString(),
  });
});
