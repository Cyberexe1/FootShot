import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { bearer } from './helpers.js';

const app = createApp();
const STAFF = bearer('staff');

describe('GET /api/predict/congestion', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/predict/congestion');
    expect(res.status).toBe(401);
  });

  it('returns forecasts with hourly horizon points', async () => {
    const res = await request(app)
      .get('/api/predict/congestion')
      .set('Authorization', STAFF);
    expect(res.status).toBe(200);
    expect(res.body.forecasts.length).toBeGreaterThan(0);
    const f = res.body.forecasts[0];
    expect(f.horizon).toHaveLength(4);
    expect(['ok', 'warn', 'crit']).toContain(f.risk);
  });

  it('projects rising density for arrival zones', async () => {
    const res = await request(app)
      .get('/api/predict/congestion')
      .set('Authorization', STAFF);
    const gateA = res.body.forecasts.find(
      (f: { zoneId: string }) => f.zoneId === 'gate-a',
    );
    const last = gateA.horizon[gateA.horizon.length - 1];
    expect(last.density).toBeGreaterThan(gateA.currentDensity);
  });
});
