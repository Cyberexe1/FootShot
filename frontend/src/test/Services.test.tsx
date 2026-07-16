import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import Services from '../features/services/Services';

vi.mock('../lib/api', () => ({
  api: {
    transport: vi.fn().mockResolvedValue({
      updatedAt: '',
      options: [
        {
          id: 'metro-l3',
          mode: 'metro',
          name: 'Metro — Line 3',
          etaMinutes: 6,
          frequency: 'every 4 min',
          accessible: true,
          note: 'Step-free from Gate A',
        },
      ],
    }),
    sustainability: vi.fn().mockResolvedValue({
      amenities: [{ id: 'water-l1', type: 'water', name: 'Water', zone: 'Level 1' }],
    }),
    accessibilityServices: vi.fn().mockResolvedValue({
      services: [
        { id: 'sensory-room', name: 'Quiet room', description: 'Calm space', zone: 'L1' },
      ],
    }),
    requestAssistance: vi.fn(),
  },
}));

function renderServices() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Services />
    </QueryClientProvider>,
  );
}

describe('Services', () => {
  it('renders transport, accessibility, and sustainability data', async () => {
    renderServices();
    await waitFor(() => expect(screen.getByText(/Metro — Line 3/)).toBeInTheDocument());
    expect(screen.getByText(/Quiet room/)).toBeInTheDocument();
    expect(screen.getByText(/Level 1/)).toBeInTheDocument();
  });
});
