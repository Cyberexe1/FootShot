import { describe, expect, it, vi } from 'vitest';
import { ZodError, z } from 'zod';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/errors.js';

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('errorHandler', () => {
  it('notFoundHandler returns a 404 envelope', () => {
    const res = mockRes();
    // @ts-expect-error minimal mock
    notFoundHandler({}, res);
    expect(res.statusCode).toBe(404);
    expect((res.body as { error: { code: string } }).error.code).toBe('NOT_FOUND');
  });

  it('maps ZodError to a 400 VALIDATION_ERROR', () => {
    const res = mockRes();
    let zerr: ZodError;
    try {
      z.object({ n: z.number() }).parse({ n: 'x' });
      throw new Error('unreachable');
    } catch (e) {
      zerr = e as ZodError;
    }
    // @ts-expect-error minimal mock
    errorHandler(zerr, {}, res, () => {});
    expect(res.statusCode).toBe(400);
    expect((res.body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  });

  it('maps AppError to its status code and logs 5xx', () => {
    const res = mockRes();
    // @ts-expect-error minimal mock
    errorHandler(AppError.internal('boom', 'BOOM'), {}, res, () => {});
    expect(res.statusCode).toBe(500);
    expect((res.body as { error: { code: string } }).error.code).toBe('BOOM');
  });

  it('maps a 4xx AppError without treating it as server error', () => {
    const res = mockRes();
    // @ts-expect-error minimal mock
    errorHandler(AppError.badRequest('nope'), {}, res, () => {});
    expect(res.statusCode).toBe(400);
  });

  it('maps unknown errors to a 500 INTERNAL_ERROR', () => {
    const res = mockRes();
    // @ts-expect-error minimal mock
    errorHandler(new Error('surprise'), {}, res, () => {});
    expect(res.statusCode).toBe(500);
    expect((res.body as { error: { code: string } }).error.code).toBe('INTERNAL_ERROR');
    vi.restoreAllMocks();
  });
});
