import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import OperatorDashboard from '../features/operator/OperatorDashboard';
import { AuthProvider } from '../lib/auth';

vi.mock('../lib/api', () => ({
  setAuthToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
  api: {
    crowdZones: vi.fn().mockResolvedValue({ updatedAt: '', zones: [] }),
    listIncidents: vi.fn().mockResolvedValue({ incidents: [] }),
    opsSummary: vi.fn(),
    createIncident: vi.fn(),
    updateIncident: vi.fn(),
    analytics: vi.fn().mockRejectedValue(new Error('forbidden')),
    congestion: vi.fn().mockResolvedValue({ forecasts: [], generatedAt: '' }),
    volunteerScript: vi.fn(),
    translate: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
  },
}));

function renderDashboard(onRequireLogin = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <OperatorDashboard onRequireLogin={onRequireLogin} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { onRequireLogin };
}

describe('OperatorDashboard', () => {
  beforeEach(() => localStorage.clear());

  it('shows a login gate when not authenticated', () => {
    renderDashboard();
    expect(screen.getByText(/Operator access/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in \/ sign up/i })).toBeInTheDocument();
  });

  it('calls onRequireLogin when the gate button is clicked', async () => {
    const user = userEvent.setup();
    const { onRequireLogin } = renderDashboard();
    await user.click(screen.getByRole('button', { name: /log in \/ sign up/i }));
    expect(onRequireLogin).toHaveBeenCalled();
  });

  it('shows the dashboard when a user is already authenticated', async () => {
    localStorage.setItem(
      'ff26_user',
      JSON.stringify({ username: 'operator', role: 'staff' }),
    );
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/Operator Dashboard/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/AI Decision Support/i)).toBeInTheDocument();
  });
});
