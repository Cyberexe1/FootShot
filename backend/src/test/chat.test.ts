import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock the Bedrock service so tests never hit AWS.
vi.mock('../services/bedrock.service.js', () => ({
  generateAnswer: vi.fn().mockResolvedValue('Gate C has step-free access.'),
  streamAnswer: vi.fn(),
}));

import { createApp } from '../app.js';
import { generateAnswer } from '../services/bedrock.service.js';

const app = createApp();

describe('POST /api/chat', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a grounded answer with sources', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'where is the step-free entrance', language: 'English' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toContain('step-free');
    expect(Array.isArray(res.body.sources)).toBe(true);
    expect(res.body.sources.length).toBeGreaterThan(0);
  });

  it('validates the request body', async () => {
    const res = await request(app).post('/api/chat').send({ message: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('redacts PII before sending to the model', async () => {
    await request(app)
      .post('/api/chat')
      .send({ message: 'my email is fan@example.com, where is gate A' });

    const [, turns] = vi.mocked(generateAnswer).mock.calls[0];
    const userTurn = turns[turns.length - 1];
    expect(userTurn.content).toContain('[EMAIL]');
    expect(userTurn.content).not.toContain('fan@example.com');
  });
});
