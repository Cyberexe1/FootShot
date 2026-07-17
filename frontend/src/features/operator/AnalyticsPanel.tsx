import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

/** Organizer-only analytics. Shows a friendly notice if the role lacks access. */
export default function AnalyticsPanel() {
  const q = useQuery({
    queryKey: ['analytics'],
    queryFn: api.analytics,
    retry: false,
  });

  return (
    <div className="rounded-md bg-surface p-4">
      <h3 className="font-heading mb-2 text-lg font-semibold">
        Organizer Analytics
      </h3>

      {q.isLoading && <p className="text-content-muted text-sm">Loading…</p>}
      {q.isError && (
        <p className="text-content-muted text-sm">
          Organizer access required to view analytics.
        </p>
      )}

      {q.data && (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="font-heading text-xl font-bold">
              {Math.round(q.data.crowd.avgDensity * 100)}%
            </p>
            <p className="text-content-muted text-xs">Avg density</p>
          </div>
          <div>
            <p className="font-heading text-xl font-bold">
              {q.data.incidents.open}
            </p>
            <p className="text-content-muted text-xs">Open incidents</p>
          </div>
          <div>
            <p className="font-heading text-xl font-bold">
              {q.data.sustainability.wasteDivertedPercent}%
            </p>
            <p className="text-content-muted text-xs">Waste diverted</p>
          </div>
          <div>
            <p className="font-heading text-xl font-bold">
              {q.data.transport.accessibleCount}/{q.data.transport.optionCount}
            </p>
            <p className="text-content-muted text-xs">Accessible transit</p>
          </div>
        </div>
      )}
    </div>
  );
}
