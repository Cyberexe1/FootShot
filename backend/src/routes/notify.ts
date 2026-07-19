import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generateAnswer } from '../services/bedrock.service.js';
import { buildTranslateSystemPrompt } from '../prompts/notify.js';

// Challenge area: Multilingual assistance (auto-translated announcements, GenAI).
export const notifyRouter = Router();

notifyRouter.use('/notify', authenticate, requireRole('staff', 'organizer'));

const translateSchema = z.object({
  message: z.string().min(1).max(500),
  languages: z.array(z.string().min(2).max(40)).min(1).max(10),
});

/**
 * POST /api/notify/translate — translate an announcement into multiple
 * languages via Nova. Staff/organizer only.
 */
notifyRouter.post('/notify/translate', async (req, res, next) => {
  try {
    const { message, languages } = translateSchema.parse(req.body);

    const translations = await Promise.all(
      languages.map(async (language) => ({
        language,
        text: await generateAnswer(buildTranslateSystemPrompt(language), [
          { role: 'user', content: message },
        ]),
      })),
    );

    res.status(200).json({ original: message, translations, generatedAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});
