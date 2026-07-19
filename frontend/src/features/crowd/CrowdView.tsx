import { useQuery } from '@tanstack/react-query';
import { api, type DensityLevel } from '../../lib/api';

const LEVEL_META: Record<DensityLevel, { color: string; label: string; bg: string }> = {
  ok: { color: '#22C55E', label: 'Low', bg: 'bg-status-ok/15' },
  warn: { color: '#F59E0B', label: 'Moderate', bg: 'bg-status-warn/15' },
  crit: { color: '#EF4444', label: 'High', bg: 'bg-status-crit/15' },
};

/**
 * Live crowd-density view. Polls `/api/crowd/zones` every 15s and renders a
 * summary (people in venue, overall fill, zones at capacity) plus per-zone
 * meters. Density level is conveyed by text label + percentage + a `meter`
 * role, never colour alone, for colourblind accessibility.
 */
export default function CrowdView() {
  const crowd = useQuery({
    queryKey: ['crowd-zones'],
    queryFn: api.crowdZones,
    refetchInterval: 15_000,
  });

  const zones = crowd.data?.zones ?? [];
  const totalPeople = zones.reduce((s, z) => s + z.occupancy, 0);
  const totalCapacity = zones.reduce((s, z) => s + z.capacity, 0);
  const critical = zones.filter((z) => z.level === 'crit').length;

  return (
    <section aria-labelledby="crowd-heading" className="flex flex-col gap-4">
      <p id="crowd-heading" className="sr-only">
        Live Crowd View
      </p>

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
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'People in venue', value: totalPeople.toLocaleString() },
              {
                label: 'Overall fill',
                value: `${Math.round((totalPeople / totalCapacity) * 100)}%`,
              },
              { label: 'Zones at capacity', value: String(critical) },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-surface-2/60 bg-surface p-3 text-center"
              >
                <p className="font-heading text-2xl font-bold">{s.value}</p>
                <p className="text-content-muted text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Zones */}
          <ul className="flex flex-col gap-3" aria-label="Zone density">
            {zones.map((zone) => {
              const meta = LEVEL_META[zone.level];
              const pct = Math.round(zone.density * 100);
              return (
                <li
                  key={zone.id}
                  className="rounded-lg border border-surface-2/60 bg-surface p-4"
                >
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{zone.name}</span>
                    <span
                      className={
                        'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                        meta.bg
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      {meta.label} · {pct}%
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
                    role="meter"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${zone.name} density ${pct} percent, ${meta.label}`}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                  <p className="text-content-muted mt-1.5 text-xs">
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
