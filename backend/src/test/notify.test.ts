import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../services/bedrock.service.js', () => ({
  generateAnswer: vi.fn().mockResolvedValue('Bienvenidos al estadio.'),
  streamAnswer: vi.fn(),
}));

import { createApp } from '../app.js';
import { generateAnswer } from '../services/bedrock.service.js';
import { bearer } from './helpers.js';

const app = createApp();
const STAFF = bearer('staff');

describe('POST /api/notify/translate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/notify/translate')
      .send({ message: 'Welcome', languages: ['Spanish'] });
    expect(res.status).toBe(401);
  });

  it('translates an announcement into each language', async () => {
    const res = await request(app)
      .post('/api/notify/translate')
      .set('Authorization', STAFF)
      .send({ message: 'Welcome to the stadium', languages: ['Spanish', 'French'] });

    expect(res.status).toBe(200);
    expect(res.body.translations).toHaveLength(2);
    expect(res.body.translations[0].language).toBe('Spanish');
    expect(generateAnswer).toHaveBeenCalledTimes(2);
  });

  it('validates the request body', async () => {
    const res = await request(app)
      .post('/api/notify/translate')
      .set('Authorization', STAFF)
      .send({ message: '', languages: [] });
    expect(res.status).toBe(400);
  });
});
