import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ForecastPanel from '../features/operator/ForecastPanel';
import AnalyticsPanel from '../features/operator/AnalyticsPanel';
import VolunteerScript from '../features/operator/VolunteerScript';
import NotifyPanel from '../features/operator/NotifyPanel';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    congestion: vi.fn(),
    analytics: vi.fn(),
    volunteerScript: vi.fn(),
    translate: vi.fn(),
  },
}));

function wrap(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Operator panels', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ForecastPanel renders per-zone risk', async () => {
    vi.mocked(api.congestion).mockResolvedValue({
      generatedAt: '',
      forecasts: [
        {
          zoneId: 'gate-a',
          name: 'Gate A',
          currentDensity: 0.4,
          risk: 'crit',
          horizon: [
            { minutes: 15, density: 0.5, level: 'ok' },
            { minutes: 30, density: 0.7, level: 'warn' },
            { minutes: 45, density: 0.9, level: 'crit' },
            { minutes: 60, density: 1.0, level: 'crit' },
          ],
        },
      ],
    });
    wrap(<ForecastPanel />);
    await waitFor(() => expect(screen.getByText('Gate A')).toBeInTheDocument());
    expect(screen.getByText(/Congestion likely/i)).toBeInTheDocument();
  });

  it('AnalyticsPanel shows metrics for organizers', async () => {
    vi.mocked(api.analytics).mockResolvedValue({
      crowd: { totalCapacity: 29000, totalOccupancy: 10000, avgDensity: 0.34, zonesAtCapacity: 1 },
      incidents: { open: 2, resolved: 3, bySeverity: { low: 1, medium: 2, high: 2 } },
      sustainability: { amenitiesByType: { water: 2, recycling: 2, compost: 1, 'ev-charging': 1 }, wasteDivertedPercent: 76 },
      transport: { optionCount: 4, accessibleCount: 3 },
      generatedAt: '',
    });
    wrap(<AnalyticsPanel />);
    await waitFor(() => expect(screen.getByText(/76%/)).toBeInTheDocument());
    expect(screen.getByText(/Waste diverted/i)).toBeInTheDocument();
  });

  it('AnalyticsPanel shows an access notice when forbidden', async () => {
    vi.mocked(api.analytics).mockRejectedValue(new Error('forbidden'));
    wrap(<AnalyticsPanel />);
    await waitFor(() =>
      expect(screen.getByText(/Organizer access required/i)).toBeInTheDocument(),
    );
  });

  it('VolunteerScript drafts a script', async () => {
    vi.mocked(api.volunteerScript).mockResolvedValue({
      script: 'Gate C has step-free access.',
      sources: [{ id: 'accessibility', title: 'Accessibility' }],
    });
    const user = userEvent.setup();
    wrap(<VolunteerScript />);
    await user.type(screen.getByLabelText(/fan question/i), 'where is step free');
    await user.click(screen.getByRole('button', { name: /draft script/i }));
    await waitFor(() =>
      expect(screen.getByText(/step-free access/i)).toBeInTheDocument(),
    );
  });

  it('NotifyPanel translates an announcement', async () => {
    vi.mocked(api.translate).mockResolvedValue({
      original: 'Gates close soon',
      generatedAt: '',
      translations: [
        { language: 'Spanish', text: 'Las puertas cierran pronto' },
      ],
    });
    const user = userEvent.setup();
    wrap(<NotifyPanel />);
    await user.type(screen.getByLabelText(/announcement message/i), 'Gates close soon');
    await user.click(screen.getByRole('button', { name: /translate & preview/i }));
    await waitFor(() =>
      expect(screen.getByText(/Las puertas cierran pronto/i)).toBeInTheDocument(),
    );
  });
});
