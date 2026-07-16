import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();
const STAFF = 'Bearer dev-staff-token';

describe('incidents endpoints', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', 'Bearer wrong');
    expect(res.status).toBe(401);
  });

  it('creates, lists, and resolves an incident', async () => {
    const created = await request(app)
      .post('/api/incidents')
      .set('Authorization', STAFF)
      .send({ title: 'Congestion at Gate C', severity: 'high', zoneId: 'gate-c' });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('open');
    const id = created.body.id;

    const list = await request(app).get('/api/incidents').set('Authorization', STAFF);
    expect(list.status).toBe(200);
    expect(list.body.incidents.some((i: { id: string }) => i.id === id)).toBe(true);

    const resolved = await request(app)
      .patch(`/api/incidents/${id}`)
      .set('Authorization', STAFF)
      .send({ status: 'resolved' });
    expect(resolved.status).toBe(200);
    expect(resolved.body.status).toBe('resolved');
  });

  it('validates the create body', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', STAFF)
      .send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when updating a missing incident', async () => {
    const res = await request(app)
      .patch('/api/incidents/does-not-exist')
      .set('Authorization', STAFF)
      .send({ status: 'resolved' });
    expect(res.status).toBe(404);
  });
});
