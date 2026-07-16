import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { incidentsRepo } from '../repositories/incidents.repo.js';
import { AppError } from '../utils/errors.js';

export const incidentsRouter = Router();

// All incident routes require an authenticated staff/organizer user.
incidentsRouter.use('/incidents', authenticate, requireRole('staff', 'organizer'));

const createSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().max(1000).optional(),
  zoneId: z.string().max(64).optional(),
  severity: z.enum(['low', 'medium', 'high']),
});

const updateSchema = z
  .object({
    status: z.enum(['open', 'resolved']).optional(),
    severity: z.enum(['low', 'medium', 'high']).optional(),
    description: z.string().max(1000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

incidentsRouter.get('/incidents', async (_req, res, next) => {
  try {
    res.status(200).json({ incidents: await incidentsRepo.list() });
  } catch (err) {
    next(err);
  }
});

incidentsRouter.post('/incidents', async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    res.status(201).json(await incidentsRepo.create(input));
  } catch (err) {
    next(err);
  }
});

incidentsRouter.patch('/incidents/:id', async (req, res, next) => {
  try {
    const patch = updateSchema.parse(req.body);
    const updated = await incidentsRepo.update(req.params.id, patch);
    if (!updated) throw AppError.notFound('Incident not found');
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});
