import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../services/bedrock.service.js', () => ({
  generateAnswer: vi
    .fn()
    .mockResolvedValue('Hi! Gate C has step-free access via the elevators. Follow the signs and a steward can help.'),
  streamAnswer: vi.fn(),
}));

import { createApp } from '../app.js';
import { generateAnswer } from '../services/bedrock.service.js';
import { bearer } from './helpers.js';

const app = createApp();
const STAFF = bearer('staff');

describe('POST /api/volunteer/script', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/volunteer/script')
      .send({ question: 'where is step-free access' });
    expect(res.status).toBe(401);
  });

  it('drafts a grounded script with sources', async () => {
    const res = await request(app)
      .post('/api/volunteer/script')
      .set('Authorization', STAFF)
      .send({ question: 'where is the step-free entrance' });
    expect(res.status).toBe(200);
    expect(res.body.script).toContain('step-free');
    expect(res.body.sources.length).toBeGreaterThan(0);
  });

  it('redacts PII from the question before the model call', async () => {
    await request(app)
      .post('/api/volunteer/script')
      .set('Authorization', STAFF)
      .send({ question: 'fan email is bob@example.com asking about gates' });
    const [, turns] = vi.mocked(generateAnswer).mock.calls[0];
    expect(turns[0].content).toContain('[EMAIL]');
  });
});
