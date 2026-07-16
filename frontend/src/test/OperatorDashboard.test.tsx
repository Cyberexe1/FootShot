import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import OperatorDashboard from '../features/operator/OperatorDashboard';

vi.mock('../lib/api', () => ({
  setAuthToken: vi.fn(),
  api: {
    crowdZones: vi.fn().mockResolvedValue({ updatedAt: '', zones: [] }),
    listIncidents: vi.fn().mockResolvedValue({ incidents: [] }),
    opsSummary: vi.fn(),
    createIncident: vi.fn(),
    updateIncident: vi.fn(),
  },
}));

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OperatorDashboard />
    </QueryClientProvider>,
  );
}

describe('OperatorDashboard', () => {
  beforeEach(() => localStorage.clear());

  it('requires sign-in before showing the dashboard', () => {
    renderDashboard();
    expect(screen.getByText(/Operator Sign-in/i)).toBeInTheDocument();
  });

  it('shows the dashboard after entering a token', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(screen.getByLabelText(/staff access token/i), 'dev-staff-token');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/Operator Dashboard/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/AI Decision Support/i)).toBeInTheDocument();
  });
});
