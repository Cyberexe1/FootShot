import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('crowd endpoints', () => {
  it('returns zone statuses with density and level', async () => {
    const res = await request(app).get('/api/crowd/zones');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.zones)).toBe(true);
    const zone = res.body.zones[0];
    expect(zone).toHaveProperty('density');
    expect(['ok', 'warn', 'crit']).toContain(zone.level);
  });

  it('ingests an occupancy reading and reflects it (staff auth)', async () => {
    const res = await request(app)
      .post('/api/crowd/ingest')
      .set('Authorization', 'Bearer dev-staff-token')
      .send({ zoneId: 'gate-a', occupancy: 4500 });
    expect(res.status).toBe(200);
    expect(res.body.occupancy).toBe(4500);
    expect(res.body.level).toBe('crit'); // 4500/5000 = 0.9
  });

  it('rejects ingest without a token', async () => {
    const res = await request(app)
      .post('/api/crowd/ingest')
      .send({ zoneId: 'gate-a', occupancy: 100 });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown zone', async () => {
    const res = await request(app)
      .post('/api/crowd/ingest')
      .set('Authorization', 'Bearer dev-staff-token')
      .send({ zoneId: 'nope', occupancy: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNKNOWN_ZONE');
  });
});
