import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import App from '../App';
import { AuthProvider } from '../lib/auth';

// Avoid real network calls in the component test.
vi.mock('../lib/api', () => ({
  api: {
    health: vi.fn().mockResolvedValue({ status: 'ok', service: 'test', timestamp: '' }),
    logout: vi.fn().mockResolvedValue({ ok: true }),
  },
  setUnauthorizedHandler: vi.fn(),
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

describe('App', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows the landing page first', () => {
    renderApp();
    expect(screen.getByRole('button', { name: /launch app/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /smart stadiums/i }),
    ).toBeInTheDocument();
  });

  it('enters the console from the landing CTA', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getAllByRole('button', { name: /enter the console/i })[0]);
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fan copilot/i })).toBeInTheDocument();
    // Accessibility: a skip-to-content link and a focusable main landmark exist.
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });
});
