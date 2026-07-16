import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import Wayfinding from '../features/wayfinding/Wayfinding';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: { venueGraph: vi.fn(), route: vi.fn() },
}));

const graph = {
  nodes: [
    { id: 'gate-a', name: 'Gate A (North)', type: 'gate' as const, x: 100, y: 20 },
    { id: 'sec-115', name: 'Section 115', type: 'seat' as const, x: 245, y: 225 },
  ],
  edges: [{ from: 'gate-a', to: 'sec-115', distance: 200, stepFree: true }],
};

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Wayfinding />
    </QueryClientProvider>,
  );
}

describe('Wayfinding', () => {
  it('requests a route and shows ordered steps with ETA', async () => {
    vi.mocked(api.venueGraph).mockResolvedValue(graph);
    vi.mocked(api.route).mockResolvedValue({
      from: 'gate-a',
      to: 'sec-115',
      accessible: false,
      distanceMeters: 200,
      etaMinutes: 3,
      steps: [
        { id: 'gate-a', name: 'Gate A (North)', type: 'gate', x: 100, y: 20 },
        { id: 'sec-115', name: 'Section 115', type: 'seat', x: 245, y: 225 },
      ],
    });

    const user = userEvent.setup();
    renderView();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /get directions/i })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: /get directions/i }));

    await waitFor(() => expect(screen.getByText(/about 3 min/i)).toBeInTheDocument());
    expect(screen.getByRole('list')).toHaveTextContent('Section 115');
  });
});
