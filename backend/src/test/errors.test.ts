import { describe, expect, it } from 'vitest';
import { AppError } from '../utils/errors.js';

describe('AppError', () => {
  it('badRequest sets 400 and code', () => {
    const e = AppError.badRequest('bad', 'BAD');
    expect(e.statusCode).toBe(400);
    expect(e.code).toBe('BAD');
    expect(e.message).toBe('bad');
    expect(e).toBeInstanceOf(Error);
  });

  it('unauthorized defaults to 401', () => {
    expect(AppError.unauthorized().statusCode).toBe(401);
    expect(AppError.unauthorized('nope', 'X').code).toBe('X');
  });

  it('forbidden defaults to 403', () => {
    expect(AppError.forbidden().statusCode).toBe(403);
  });

  it('notFound defaults to 404', () => {
    expect(AppError.notFound().statusCode).toBe(404);
  });

  it('internal defaults to 500', () => {
    expect(AppError.internal().statusCode).toBe(500);
  });

  it('supports a custom constructor', () => {
    const e = new AppError(418, 'TEAPOT', 'short and stout');
    expect(e.statusCode).toBe(418);
    expect(e.name).toBe('AppError');
  });
});
