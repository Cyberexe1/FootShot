import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('wayfinding endpoints', () => {
  it('returns the venue graph', async () => {
    const res = await request(app).get('/api/wayfinding/graph');
    expect(res.status).toBe(200);
    expect(res.body.nodes.length).toBeGreaterThan(0);
    expect(res.body.edges.length).toBeGreaterThan(0);
  });

  it('returns a route for valid nodes', async () => {
    const res = await request(app)
      .post('/api/wayfinding')
      .send({ from: 'gate-a', to: 'sec-101' });
    expect(res.status).toBe(200);
    expect(res.body.steps[0].id).toBe('gate-a');
  });

  it('validates the request body', async () => {
    const res = await request(app).post('/api/wayfinding').send({ from: 'gate-a' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
