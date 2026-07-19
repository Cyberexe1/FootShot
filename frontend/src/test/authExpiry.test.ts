import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { api, setUnauthorizedHandler } from '../lib/api';

/**
 * Verifies session-expiry handling: a 401 on any protected call invokes the
 * registered unauthorized handler so the app can clear UI state (auto-logout).
 * Auth itself is cookie-based (httpOnly), so there is no token in JS to check.
 */
describe('401 auto-logout handling', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => setUnauthorizedHandler(null));

  it('calls the unauthorized handler on a 401 response', async () => {
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
  });

  it('sends credentials (cookie) with requests', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ incidents: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await api.listIncidents();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/incidents'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
