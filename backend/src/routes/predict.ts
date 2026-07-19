import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { forecastCongestion } from '../services/predict.service.js';

// Challenge areas: Crowd management · Real-time decision support (forecasting).
export const predictRouter = Router();

predictRouter.use('/predict', authenticate, requireRole('staff', 'organizer'));

/** GET /api/predict/congestion — forecast zone density over the next hour. */
predictRouter.get('/predict/congestion', async (_req, res, next) => {
  try {
    res.status(200).json(await forecastCongestion());
  } catch (err) {
    next(err);
  }
});
