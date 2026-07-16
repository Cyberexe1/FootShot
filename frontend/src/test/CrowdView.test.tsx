import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import CrowdView from '../features/crowd/CrowdView';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({ api: { crowdZones: vi.fn() } }));

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CrowdView />
    </QueryClientProvider>,
  );
}

describe('CrowdView', () => {
  it('renders zone density with a text label and percentage', async () => {
    vi.mocked(api.crowdZones).mockResolvedValue({
      updatedAt: new Date().toISOString(),
      zones: [
        {
          id: 'concourse-1',
          name: 'Concourse Level 1',
          capacity: 8000,
          occupancy: 6900,
          density: 0.86,
          level: 'crit',
        },
      ],
    });

    renderView();

    await waitFor(() =>
      expect(screen.getByText('Concourse Level 1')).toBeInTheDocument(),
    );
    // Accessibility: level conveyed as text, not just color.
    expect(screen.getByText(/High · 86%/)).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '86');
  });
});
