import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getOverview } from '../services/analytics.service.js';

// Challenge area: Operational intelligence (organizer analytics + sustainability).
export const analyticsRouter = Router();

// Organizer-only cross-venue analytics.
analyticsRouter.use('/analytics', authenticate, requireRole('organizer'));

/** GET /api/analytics/overview — aggregate KPIs for organizers. */
analyticsRouter.get('/analytics/overview', async (_req, res, next) => {
  try {
    res.status(200).json(await getOverview());
  } catch (err) {
    next(err);
  }
});
