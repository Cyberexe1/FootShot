import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import FanCopilot from '../features/copilot/FanCopilot';
import Services from '../features/services/Services';
import Wayfinding from '../features/wayfinding/Wayfinding';
import CrowdView from '../features/crowd/CrowdView';
import AuthPage from '../features/auth/AuthPage';
import OperatorDashboard from '../features/operator/OperatorDashboard';
import { AuthProvider } from '../lib/auth';

// Stub the API so components render their static UI without network calls.
vi.mock('../lib/api', () => ({
  setUnauthorizedHandler: vi.fn(),
  api: {
    chat: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn().mockResolvedValue({ ok: true }),
    transport: vi.fn().mockResolvedValue({ updatedAt: '', options: [] }),
    sustainability: vi.fn().mockResolvedValue({ amenities: [] }),
    accessibilityServices: vi.fn().mockResolvedValue({ services: [] }),
    requestAssistance: vi.fn(),
    crowdZones: vi.fn().mockResolvedValue({
      updatedAt: new Date().toISOString(),
      zones: [
        { id: 'gate-a', name: 'Gate A', capacity: 5000, occupancy: 2000, density: 0.4, level: 'ok' },
      ],
    }),
    venueGraph: vi.fn().mockResolvedValue({
      nodes: [
        { id: 'gate-a', name: 'Gate A', type: 'gate', x: 10, y: 10 },
        { id: 'sec-1', name: 'Section 1', type: 'seat', x: 50, y: 50 },
      ],
      edges: [{ from: 'gate-a', to: 'sec-1', distance: 100, stepFree: true }],
    }),
    route: vi.fn(),
  },
}));

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
  );
}

/**
 * Automated accessibility checks. Color-contrast is excluded because jsdom
 * cannot compute layout/colors; contrast is verified via the design tokens.
 * We assert there are no serious/critical violations.
 */
async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
}

describe('accessibility (no serious violations)', () => {
  it('Fan Copilot', async () => {
    const { container } = renderWithClient(<FanCopilot />);
    await expectNoA11yViolations(container);
  });

  it('Services', async () => {
    const { container } = renderWithClient(<Services />);
    await expectNoA11yViolations(container);
  });

  it('Wayfinding', async () => {
    const { container, findByLabelText } = renderWithClient(<Wayfinding />);
    await findByLabelText(/from/i);
    await expectNoA11yViolations(container);
  });

  it('Crowd View', async () => {
    const { container, findByText } = renderWithClient(<CrowdView />);
    await findByText(/Gate A/);
    await expectNoA11yViolations(container);
  });

  it('Auth page', async () => {
    const { container } = renderWithClient(
      <AuthPage onSuccess={() => {}} onBack={() => {}} />,
    );
    await expectNoA11yViolations(container);
  });

  it('Operator login gate', async () => {
    const { container } = renderWithClient(
      <OperatorDashboard onRequireLogin={() => {}} />,
    );
    await waitFor(() => expect(container.querySelector('h2')).toBeTruthy());
    await expectNoA11yViolations(container);
  });
});
