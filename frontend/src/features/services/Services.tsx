import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type AmenityType, type AssistanceType } from '../../lib/api';

/**
 * Fan-facing services hub, composed of three self-contained sections:
 *  - Transport: live-ish ETAs for metro/shuttle/rideshare/bus.
 *  - Accessibility: service directory + an assistance-request form.
 *  - Sustainability: locations of water refill, recycling, compost, EV charging.
 * Each section fetches its own data so a slow/failed call never blocks the rest.
 */
const AMENITY_LABEL: Record<AmenityType, string> = {
  water: '💧 Water refill',
  recycling: '♻️ Recycling',
  compost: '🌱 Compost',
  'ev-charging': '🔌 EV charging',
};

function Transport() {
  const q = useQuery({ queryKey: ['transport'], queryFn: api.transport });
  return (
    <div className="rounded-md bg-surface p-4">
      <h3 className="font-heading mb-2 text-lg font-semibold">Transport</h3>
      {q.isLoading && <p className="text-content-muted text-sm">Loading…</p>}
      <ul className="flex flex-col gap-2">
        {q.data?.options.map((o) => (
          <li key={o.id} className="rounded-sm bg-surface-2 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{o.name}</span>
              <span>~{o.etaMinutes} min</span>
            </div>
            <p className="text-content-muted text-xs">
              {o.frequency} · {o.note}
              {o.accessible ? ' · ♿ accessible' : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Sustainability() {
  const q = useQuery({ queryKey: ['sustainability'], queryFn: api.sustainability });
  return (
    <div className="rounded-md bg-surface p-4">
      <h3 className="font-heading mb-2 text-lg font-semibold">Sustainability</h3>
      {q.isLoading && <p className="text-content-muted text-sm">Loading…</p>}
      <ul className="flex flex-col gap-1 text-sm">
        {q.data?.amenities.map((a) => (
          <li key={a.id} className="flex justify-between">
            <span>{AMENITY_LABEL[a.type]}</span>
            <span className="text-content-muted">{a.zone}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Accessibility() {
  const services = useQuery({
    queryKey: ['accessibility'],
    queryFn: api.accessibilityServices,
  });
  const [type, setType] = useState<AssistanceType>('wheelchair');
  const [zoneId, setZoneId] = useState('gate-c');
  const request = useMutation({
    mutationFn: () => api.requestAssistance(type, zoneId),
  });

  return (
    <div className="rounded-md bg-surface p-4">
      <h3 className="font-heading mb-2 text-lg font-semibold">Accessibility</h3>
      <ul className="mb-3 flex flex-col gap-1 text-sm">
        {services.data?.services.map((s) => (
          <li key={s.id}>
            <span className="font-medium">{s.name}</span>
            <span className="text-content-muted"> — {s.description}</span>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          request.mutate();
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="assist-type" className="text-content-muted text-xs">
            Assistance type
          </label>
          <select
            id="assist-type"
            value={type}
            onChange={(e) => setType(e.target.value as AssistanceType)}
            className="rounded-sm bg-surface-2 px-2 py-1.5 text-sm"
          >
            <option value="wheelchair">Wheelchair</option>
            <option value="sensory">Sensory</option>
            <option value="guide">Guide</option>
            <option value="medical">Medical</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="assist-zone" className="text-content-muted text-xs">
            Location
          </label>
          <input
            id="assist-zone"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="rounded-sm bg-surface-2 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={request.isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          Request assistance
        </button>
      </form>

      <div aria-live="polite">
        {request.data && (
          <p className="text-status-ok mt-2 text-sm">
            ✓ Request received — help is about {request.data.etaMinutes} min away.
          </p>
        )}
        {request.isError && (
          <p className="text-status-crit mt-2 text-sm" role="alert">
            {(request.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Services() {
  return (
    <section aria-labelledby="services-heading" className="flex flex-col gap-4">
      <h2 id="services-heading" className="font-heading text-2xl font-semibold">
        Services
      </h2>
      <Transport />
      <Accessibility />
      <Sustainability />
    </section>
  );
}
