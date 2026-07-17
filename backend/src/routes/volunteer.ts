import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { redactPii } from '../utils/pii.js';
import { buildContext, retrieve } from '../services/rag.service.js';
import { buildVolunteerSystemPrompt } from '../prompts/volunteer.js';
import { generateAnswer } from '../services/bedrock.service.js';

export const volunteerRouter = Router();

volunteerRouter.use('/volunteer', authenticate, requireRole('staff', 'organizer'));

const scriptSchema = z.object({
  question: z.string().min(1).max(500),
  language: z.string().min(2).max(40).default('English'),
});

/**
 * POST /api/volunteer/script — draft a grounded, ready-to-read response script
 * for a volunteer answering a fan question.
 */
volunteerRouter.post('/volunteer/script', async (req, res, next) => {
  try {
    const { question, language } = scriptSchema.parse(req.body);
    const safeQuestion = redactPii(question);

    const docs = retrieve(safeQuestion);
    const context = buildContext(docs);
    const systemPrompt = buildVolunteerSystemPrompt(language, context);

    const script = await generateAnswer(systemPrompt, [
      { role: 'user', content: safeQuestion },
    ]);

    res.status(200).json({
      script,
      sources: docs.map((d) => ({ id: d.id, title: d.title })),
    });
  } catch (err) {
    next(err);
  }
});
