import { Router } from 'express';
import { z } from 'zod';
import { findRoute, getGraph } from '../services/wayfinding.service.js';

// Challenge area: Navigation (gate-to-seat routing, incl. step-free/accessible).
export const wayfindingRouter = Router();

const routeSchema = z.object({
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  accessible: z.boolean().optional().default(false),
});

/** GET /api/wayfinding/graph — venue nodes/edges for rendering the base map. */
wayfindingRouter.get('/wayfinding/graph', (_req, res) => {
  // Static per venue — safe to cache at the CDN and in the browser.
  res.set('Cache-Control', 'public, max-age=3600');
  res.status(200).json(getGraph());
});

/** POST /api/wayfinding — shortest route (optionally step-free). */
wayfindingRouter.post('/wayfinding', (req, res, next) => {
  try {
    const { from, to, accessible } = routeSchema.parse(req.body);
    res.status(200).json(findRoute(from, to, accessible));
  } catch (err) {
    next(err);
  }
});
