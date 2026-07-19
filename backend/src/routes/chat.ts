import { Router } from 'express';
import { z } from 'zod';
import { redactPii } from '../utils/pii.js';
import { buildContext, retrieveSmart } from '../services/rag.service.js';
import { buildSystemPrompt } from '../prompts/copilot.js';
import {
  generateAnswer,
  streamAnswer,
  type ChatTurn,
} from '../services/bedrock.service.js';

// Challenge areas: Multilingual assistance · Navigation · Accessibility (GenAI).
export const chatRouter = Router();

const turnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  language: z.string().min(2).max(40).default('English'),
  history: z.array(turnSchema).max(10).optional(),
  stream: z.boolean().optional().default(false),
});

/**
 * POST /api/chat — grounded, multilingual Fan Copilot.
 * Flow: validate -> redact PII -> RAG retrieve -> prompt -> Nova (Bedrock).
 */
chatRouter.post('/chat', async (req, res, next) => {
  try {
    const { message, language, history, stream } = chatSchema.parse(req.body);

    // Defense-in-depth: strip PII before anything reaches the model.
    const safeMessage = redactPii(message);
    const safeHistory: ChatTurn[] = (history ?? []).map((t) => ({
      role: t.role,
      content: redactPii(t.content),
    }));

    // Ground the answer in venue knowledge.
    const docs = await retrieveSmart(safeMessage);
    const context = buildContext(docs);
    const systemPrompt = buildSystemPrompt(language, context);

    const turns: ChatTurn[] = [...safeHistory, { role: 'user', content: safeMessage }];
    const sources = docs.map((d) => ({ id: d.id, title: d.title }));

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      // Stop generating if the client disconnects.
      let aborted = false;
      req.on('close', () => {
        aborted = true;
      });

      try {
        for await (const chunk of streamAnswer(systemPrompt, turns)) {
          if (aborted) break;
          res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
        }
        res.write(`event: done\ndata: ${JSON.stringify({ sources })}\n\n`);
      } catch {
        // Headers are already sent, so surface the error as an SSE event rather
        // than delegating to the JSON error handler (which would throw).
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error: 'The assistant is unavailable right now.',
          })}\n\n`,
        );
      } finally {
        res.end();
      }
      return;
    }

    const answer = await generateAnswer(systemPrompt, turns);
    res.status(200).json({ answer, sources, language });
  } catch (err) {
    next(err);
  }
});
