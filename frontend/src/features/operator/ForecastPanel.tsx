import { useQuery } from '@tanstack/react-query';
import { api, type DensityLevel } from '../../lib/api';

const RISK_META: Record<DensityLevel, { color: string; label: string }> = {
  ok: { color: '#22C55E', label: 'Low risk' },
  warn: { color: '#F59E0B', label: 'Building' },
  crit: { color: '#EF4444', label: 'Congestion likely' },
};

export default function ForecastPanel() {
  const q = useQuery({
    queryKey: ['congestion'],
    queryFn: api.congestion,
    refetchInterval: 30_000,
  });

  return (
    <div className="rounded-md bg-surface p-4">
      <h3 className="font-heading mb-2 text-lg font-semibold">
        Congestion Forecast (next hour)
      </h3>
      {q.isLoading && <p className="text-content-muted text-sm">Loading forecast…</p>}
      {q.isError && (
        <p className="text-status-crit text-sm" role="alert">
          {(q.error as Error).message}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {q.data?.forecasts.map((f) => {
          const meta = RISK_META[f.risk];
          return (
            <li key={f.zoneId} className="rounded-sm bg-surface-2 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{f.name}</span>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {meta.label}
                </span>
              </div>
              <div className="text-content-muted mt-1 flex gap-3 text-xs">
                {f.horizon.map((h) => (
                  <span key={h.minutes}>
                    +{h.minutes}m: {Math.round(h.density * 100)}%
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
