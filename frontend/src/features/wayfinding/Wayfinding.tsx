import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import VenueMap from './VenueMap';

export default function Wayfinding() {
  const graph = useQuery({ queryKey: ['venue-graph'], queryFn: api.venueGraph });
  const [from, setFrom] = useState('gate-a');
  const [to, setTo] = useState('sec-115');
  const [accessible, setAccessible] = useState(false);

  const route = useMutation({
    mutationFn: () => api.route(from, to, accessible),
  });

  // Default the destination to a sensible node once the graph loads.
  useEffect(() => {
    if (graph.data && !graph.data.nodes.some((n) => n.id === to)) {
      setTo(graph.data.nodes[0].id);
    }
  }, [graph.data, to]);

  if (graph.isLoading) {
    return <p className="text-content-muted text-sm">Loading venue map…</p>;
  }
  if (graph.isError || !graph.data) {
    return (
      <p className="text-status-crit text-sm" role="alert">
        Could not load the venue map.
      </p>
    );
  }

  const nodes = graph.data.nodes;

  return (
    <section aria-labelledby="wayfinding-heading" className="flex flex-col gap-4">
      <h2 id="wayfinding-heading" className="font-heading text-2xl font-semibold">
        Wayfinding
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          route.mutate();
        }}
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-content-muted text-sm">
            From
          </label>
          <select
            id="from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-sm bg-surface-2 px-2 py-2"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-content-muted text-sm">
            To
          </label>
          <select
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-sm bg-surface-2 px-2 py-2"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={route.isPending}
          className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          Get directions
        </button>

        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input
            type="checkbox"
            checked={accessible}
            onChange={(e) => setAccessible(e.target.checked)}
          />
          Step-free (accessible) route only
        </label>
      </form>

      <VenueMap graph={graph.data} route={route.data} />

      <div aria-live="polite">
        {route.isError && (
          <p className="text-status-crit text-sm" role="alert">
            {(route.error as Error).message}
          </p>
        )}
        {route.data && (
          <div className="rounded-md bg-surface p-4">
            <p className="text-content-muted mb-2 text-sm">
              {route.data.distanceMeters} m · about {route.data.etaMinutes} min
              {route.data.accessible ? ' · step-free' : ''}
            </p>
            <ol className="ml-5 list-decimal space-y-1 text-sm">
              {route.data.steps.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
