import { Router } from 'express';
import { z } from 'zod';
import { getZones, ingestOccupancy } from '../services/crowd.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const crowdRouter = Router();

/** GET /api/crowd/zones — current zone densities for the heatmap. */
crowdRouter.get('/crowd/zones', (_req, res) => {
  res.status(200).json(getZones());
});

const ingestSchema = z.object({
  zoneId: z.string().min(1).max(64),
  occupancy: z.number().int().nonnegative(),
});

/**
 * POST /api/crowd/ingest — update a zone's occupancy. Staff-only.
 */
crowdRouter.post('/crowd/ingest', authenticate, requireRole('staff'), (req, res, next) => {
  try {
    const { zoneId, occupancy } = ingestSchema.parse(req.body);
    res.status(200).json(ingestOccupancy(zoneId, occupancy));
  } catch (err) {
    next(err);
  }
});
