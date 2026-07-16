import { useQuery } from '@tanstack/react-query';
import { api, type DensityLevel } from '../../lib/api';

const LEVEL_META: Record<DensityLevel, { color: string; label: string }> = {
  ok: { color: '#22C55E', label: 'Low' },
  warn: { color: '#F59E0B', label: 'Moderate' },
  crit: { color: '#EF4444', label: 'High' },
};

export default function CrowdView() {
  // Refresh every 15s per the PRD requirement for live crowd data.
  const crowd = useQuery({
    queryKey: ['crowd-zones'],
    queryFn: api.crowdZones,
    refetchInterval: 15_000,
  });

  return (
    <section aria-labelledby="crowd-heading" className="flex flex-col gap-4">
      <h2 id="crowd-heading" className="font-heading text-2xl font-semibold">
        Live Crowd View
      </h2>

      {crowd.isLoading && (
        <p className="text-content-muted text-sm">Loading crowd data…</p>
      )}
      {crowd.isError && (
        <p className="text-status-crit text-sm" role="alert">
          Could not load crowd data.
        </p>
      )}

      {crowd.data && (
        <>
          <ul className="flex flex-col gap-3" aria-label="Zone density">
            {crowd.data.zones.map((zone) => {
              const meta = LEVEL_META[zone.level];
              const pct = Math.round(zone.density * 100);
              return (
                <li key={zone.id} className="rounded-md bg-surface p-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{zone.name}</span>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      {/* Label + number, never color alone (accessibility). */}
                      {meta.label} · {pct}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
                    role="meter"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${zone.name} density ${pct} percent, ${meta.label}`}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                  <p className="text-content-muted mt-1 text-xs">
                    {zone.occupancy.toLocaleString()} /{' '}
                    {zone.capacity.toLocaleString()} people
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="text-content-muted text-xs" aria-live="polite">
            Updated {new Date(crowd.data.updatedAt).toLocaleTimeString()} · refreshes
            every 15s
          </p>
        </>
      )}
    </section>
  );
}
