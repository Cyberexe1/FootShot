import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { bearer } from './helpers.js';

const app = createApp();

describe('GET /api/analytics/overview', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/analytics/overview');
    expect(res.status).toBe(401);
  });

  it('forbids staff (organizer-only)', async () => {
    const res = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', bearer('staff'));
    expect(res.status).toBe(403);
  });

  it('returns an aggregate overview for organizers', async () => {
    const res = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', bearer('organizer'));
    expect(res.status).toBe(200);
    expect(res.body.crowd.totalCapacity).toBeGreaterThan(0);
    expect(res.body.sustainability.wasteDivertedPercent).toBeGreaterThan(0);
    expect(res.body.transport.optionCount).toBeGreaterThan(0);
  });
});
