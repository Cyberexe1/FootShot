import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('service endpoints', () => {
  it('returns transport options sorted by ETA', async () => {
    const res = await request(app).get('/api/transport');
    expect(res.status).toBe(200);
    expect(res.body.options.length).toBeGreaterThan(0);
    const etas = res.body.options.map((o: { etaMinutes: number }) => o.etaMinutes);
    expect([...etas]).toEqual([...etas].sort((a, b) => a - b));
  });

  it('lists sustainability amenities and filters by type', async () => {
    const all = await request(app).get('/api/sustainability/amenities');
    expect(all.status).toBe(200);
    expect(all.body.amenities.length).toBeGreaterThan(0);

    const water = await request(app).get('/api/sustainability/amenities?type=water');
    expect(water.status).toBe(200);
    expect(water.body.amenities.every((a: { type: string }) => a.type === 'water')).toBe(true);
  });

  it('rejects an invalid amenity type', async () => {
    const res = await request(app).get('/api/sustainability/amenities?type=nope');
    expect(res.status).toBe(400);
  });

  it('lists accessibility services', async () => {
    const res = await request(app).get('/api/accessibility/services');
    expect(res.status).toBe(200);
    expect(res.body.services.length).toBeGreaterThan(0);
  });

  it('accepts an assistance request and redacts PII in the note', async () => {
    const res = await request(app)
      .post('/api/accessibility/assistance')
      .send({ type: 'wheelchair', zoneId: 'gate-c', note: 'call me at 2025550123' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('received');
    expect(res.body.note).not.toContain('2025550123');
  });

  it('validates the assistance request', async () => {
    const res = await request(app)
      .post('/api/accessibility/assistance')
      .send({ type: 'invalid', zoneId: 'gate-c' });
    expect(res.status).toBe(400);
  });
});
