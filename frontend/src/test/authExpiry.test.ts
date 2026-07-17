import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { api, setAuthToken, setUnauthorizedHandler } from '../lib/api';

/**
 * Verifies the session-expiry behaviour: a 401 on a protected call while a token
 * is set clears the token and invokes the unauthorized handler (auto-logout).
 */
describe('401 auto-logout handling', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });
  afterEach(() => setUnauthorizedHandler(null));

  it('clears the token and calls the handler on a 401 with an active session', async () => {
    setAuthToken('expired-jwt');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'nope' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(api.listIncidents()).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('ff26_token')).toBeNull();
  });

  it('does not trigger logout for anonymous 401s (no token set)', async () => {
    setAuthToken(null);
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'nope' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(api.listIncidents()).rejects.toThrow();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
