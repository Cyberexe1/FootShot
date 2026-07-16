import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getZones } from '../services/crowd.service.js';
import { incidentsRepo } from '../repositories/incidents.repo.js';
import { generateAnswer } from '../services/bedrock.service.js';
import { OPS_SYSTEM_PROMPT, buildOpsUserMessage } from '../prompts/ops.js';

export const opsRouter = Router();

opsRouter.use('/ops', authenticate, requireRole('staff', 'organizer'));

/**
 * POST /api/ops/summary — AI decision support.
 * Summarizes live crowd density + open incidents and recommends actions.
 */
opsRouter.post('/ops/summary', async (_req, res, next) => {
  try {
    const { zones } = getZones();
    const incidents = await incidentsRepo.list();
    const userMessage = buildOpsUserMessage(zones, incidents);

    const summary = await generateAnswer(OPS_SYSTEM_PROMPT, [
      { role: 'user', content: userMessage },
    ]);

    res.status(200).json({ summary, generatedAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});
