import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AuthPage from '../features/auth/AuthPage';
import { AuthProvider } from '../lib/auth';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  setUnauthorizedHandler: vi.fn(),
  api: { login: vi.fn(), signup: vi.fn(), logout: vi.fn().mockResolvedValue({ ok: true }) },
}));

function renderAuth(onSuccess = vi.fn(), onBack = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <AuthPage onSuccess={onSuccess} onBack={onBack} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { onSuccess, onBack };
}

describe('AuthPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('logs in and calls onSuccess', async () => {
    vi.mocked(api.login).mockResolvedValue({
      token: 't',
      role: 'staff',
      username: 'operator',
    });
    const user = userEvent.setup();
    const { onSuccess } = renderAuth();

    await user.type(screen.getByLabelText(/username/i), 'operator');
    await user.type(screen.getByLabelText(/password/i), 'operator123');
    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(api.login).toHaveBeenCalledWith('operator', 'operator123');
  });

  it('switches to signup and registers a new account', async () => {
    vi.mocked(api.signup).mockResolvedValue({
      token: 't',
      role: 'staff',
      username: 'newfan',
    });
    const user = userEvent.setup();
    const { onSuccess } = renderAuth();

    await user.click(screen.getByRole('tab', { name: /sign up/i }));
    await user.type(screen.getByLabelText(/username/i), 'newfan');
    await user.type(screen.getByLabelText(/password/i), 'strongpass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(api.signup).toHaveBeenCalledWith('newfan', 'strongpass123');
  });

  it('shows an error when login fails', async () => {
    vi.mocked(api.login).mockRejectedValue(new Error('Invalid username or password'));
    const user = userEvent.setup();
    renderAuth();

    await user.type(screen.getByLabelText(/username/i), 'operator');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid/i),
    );
  });
});
