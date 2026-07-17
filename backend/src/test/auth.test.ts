import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('POST /api/auth/login', () => {
  it('issues a JWT for valid credentials (bcrypt verified)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'operator', password: 'operator123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.role).toBe('staff');
  });

  it('issues an organizer token for organizer credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'organizer', password: 'organizer123' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('organizer');
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'operator', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an unknown user with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'whatever' });
    expect(res.status).toBe(401);
  });

  it('validates the request body', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: '' });
    expect(res.status).toBe(400);
  });

  it('allows access to a protected route with the issued token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'operator', password: 'operator123' });
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/signup', () => {
  it('registers a new account and issues a JWT (role: staff)', async () => {
    const username = `fan_${Date.now()}`;
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username, password: 'strongpass123' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('staff');
    expect(res.body.token).toBeTruthy();

    // The new account can then log in and reach a protected route.
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'strongpass123' });
    expect(login.status).toBe(200);
    const protectedRes = await request(app)
      .get('/api/incidents')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(protectedRes.status).toBe(200);
  });

  it('rejects a duplicate username', async () => {
    const username = `dup_${Date.now()}`;
    await request(app).post('/api/auth/signup').send({ username, password: 'strongpass123' });
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username, password: 'strongpass123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
  });

  it('rejects a reserved (built-in) username', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'operator', password: 'strongpass123' });
    expect(res.status).toBe(400);
  });

  it('rejects a weak/short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'shortpw', password: '123' });
    expect(res.status).toBe(400);
  });
});
