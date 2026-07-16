import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';

// Avoid real network calls in the component test.
vi.mock('../lib/api', () => ({
  api: { health: vi.fn().mockResolvedValue({ status: 'ok', service: 'test', timestamp: '' }) },
}));

function renderWithClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the FanFlow 26 heading', () => {
    renderWithClient();
    expect(
      screen.getByRole('heading', { name: /FanFlow/i }),
    ).toBeInTheDocument();
  });
});
