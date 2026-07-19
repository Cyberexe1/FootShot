import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import App from '../App';
import { AuthProvider } from '../lib/auth';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  setUnauthorizedHandler: vi.fn(),
  api: {
    health: vi.fn().mockResolvedValue({ status: 'ok', service: 'test', timestamp: '' }),
    login: vi.fn().mockResolvedValue({ token: 't', role: 'staff', username: 'operator' }),
    logout: vi.fn().mockResolvedValue({ ok: true }),
    signup: vi.fn(),
    crowdZones: vi.fn().mockResolvedValue({ updatedAt: '', zones: [] }),
    listIncidents: vi.fn().mockResolvedValue({ incidents: [] }),
    opsSummary: vi.fn(),
    createIncident: vi.fn(),
    updateIncident: vi.fn(),
    analytics: vi.fn().mockRejectedValue(new Error('forbidden')),
    congestion: vi.fn().mockResolvedValue({ forecasts: [], generatedAt: '' }),
    volunteerScript: vi.fn(),
    translate: vi.fn(),
  },
}));

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('end-to-end flow: landing → login → dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('logs in from the landing page and reaches the operator dashboard', async () => {
    const user = userEvent.setup();
    renderApp();

    // 1. Landing: click the header Login button.
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    // 2. Auth page: sign in.
    await user.type(screen.getByLabelText(/username/i), 'operator');
    await user.type(screen.getByLabelText(/password/i), 'operator123');
    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    // 3. Lands on the operator dashboard, with the sidebar + user panel.
    await waitFor(() =>
      expect(screen.getByText(/Operator Dashboard/i)).toBeInTheDocument(),
    );
    expect(api.login).toHaveBeenCalledWith('operator', 'operator123');
    // Sidebar shows the signed-in user with a log-out control.
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('launches the console as a guest without logging in', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /launch app/i }));
    // Sidebar navigation is present; Fan Copilot is the default view.
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fan copilot/i })).toBeInTheDocument();
  });
});
