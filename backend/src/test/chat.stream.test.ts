import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../services/bedrock.service.js', () => ({
  generateAnswer: vi.fn().mockResolvedValue('ok'),
  streamAnswer: vi.fn(),
}));

import { createApp } from '../app.js';
import { streamAnswer } from '../services/bedrock.service.js';

const app = createApp();

describe('POST /api/chat (SSE streaming)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('streams deltas and a done event', async () => {
    vi.mocked(streamAnswer).mockImplementation(async function* () {
      yield 'Gate ';
      yield 'C';
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'where is the step-free exit', stream: true });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('"delta":"Gate "');
    expect(res.text).toContain('"delta":"C"');
    expect(res.text).toContain('event: done');
  });

  it('emits an SSE error event if the model fails mid-stream', async () => {
    vi.mocked(streamAnswer).mockImplementation(async function* () {
      yield 'partial';
      throw new Error('model exploded');
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'hello', stream: true });

    // Response already committed as a stream; error surfaced as an event.
    expect(res.status).toBe(200);
    expect(res.text).toContain('event: error');
  });
});
