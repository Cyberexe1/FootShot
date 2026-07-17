import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../services/bedrock.service.js', () => ({
  generateAnswer: vi
    .fn()
    .mockResolvedValue('Situation stable. Recommend opening Gate C to relieve East zone.'),
  streamAnswer: vi.fn(),
}));

import { createApp } from '../app.js';
import { generateAnswer } from '../services/bedrock.service.js';
import { bearer } from './helpers.js';

const app = createApp();
const STAFF = bearer('staff');

describe('POST /api/ops/summary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication', async () => {
    const res = await request(app).post('/api/ops/summary');
    expect(res.status).toBe(401);
  });

  it('returns an AI decision-support summary for staff', async () => {
    const res = await request(app)
      .post('/api/ops/summary')
      .set('Authorization', STAFF)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.summary).toContain('Gate C');
    expect(res.body.generatedAt).toBeTruthy();

    // The prompt should include current crowd density context.
    const [, turns] = vi.mocked(generateAnswer).mock.calls[0];
    expect(turns[0].content).toContain('CURRENT CROWD DENSITY');
  });
});
