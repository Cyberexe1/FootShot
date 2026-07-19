import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../lib/auth';
import { api, setUnauthorizedHandler } from '../lib/api';

vi.mock('../lib/api', () => ({
  setUnauthorizedHandler: vi.fn(),
  api: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn().mockResolvedValue({ ok: true }),
  },
}));

function Consumer() {
  const { user, login, signup, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? `${user.username}:${user.role}` : 'anon'}</span>
      <button onClick={() => login('operator', 'pw')}>login</button>
      <button onClick={() => signup('newfan', 'pw12345678')}>signup</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts anonymous', () => {
    renderAuth();
    expect(screen.getByTestId('user')).toHaveTextContent('anon');
  });

  it('logs in and persists the profile', async () => {
    vi.mocked(api.login).mockResolvedValue({ token: 't', role: 'staff', username: 'operator' });
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByText('login'));
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('operator:staff'),
    );
    expect(localStorage.getItem('ff26_user')).toContain('operator');
  });

  it('signs up (role staff) and logs out', async () => {
    vi.mocked(api.signup).mockResolvedValue({ token: 't', role: 'staff', username: 'newfan' });
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByText('signup'));
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('newfan:staff'),
    );
    await user.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anon'));
    expect(api.logout).toHaveBeenCalled();
  });

  it('hydrates an existing profile from localStorage', () => {
    localStorage.setItem('ff26_user', JSON.stringify({ username: 'organizer', role: 'organizer' }));
    renderAuth();
    expect(screen.getByTestId('user')).toHaveTextContent('organizer:organizer');
  });

  it('registers an unauthorized handler', () => {
    renderAuth();
    expect(setUnauthorizedHandler).toHaveBeenCalled();
  });
});
