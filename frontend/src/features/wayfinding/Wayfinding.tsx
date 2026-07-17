import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
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
      <p id="wayfinding-heading" className="sr-only">
        Wayfinding
      </p>

      <Card>
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
              className="rounded-md border border-surface-2 bg-surface-2 px-3 py-2 focus:border-primary"
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
              className="rounded-md border border-surface-2 bg-surface-2 px-3 py-2 focus:border-primary"
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
            className="rounded-md bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {route.isPending ? 'Routing…' : 'Get directions'}
          </button>

          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input
              type="checkbox"
              checked={accessible}
              onChange={(e) => setAccessible(e.target.checked)}
              className="accent-primary"
            />
            ♿ Step-free (accessible) route only
          </label>
        </form>
      </Card>

      <Card title="Venue map" icon="🗺️">
        <VenueMap graph={graph.data} route={route.data} />
      </Card>

      <div aria-live="polite">
        {route.isError && (
          <p className="text-status-crit text-sm" role="alert">
            {(route.error as Error).message}
          </p>
        )}
        {route.data && (
          <Card title="Directions" icon="🧭">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-surface-2 px-3 py-1 text-xs">
                {route.data.distanceMeters} m
              </span>
              <span className="rounded-full bg-surface-2 px-3 py-1 text-xs">
                ~{route.data.etaMinutes} min walk
              </span>
              {route.data.accessible && (
                <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs text-secondary">
                  ♿ Step-free
                </span>
              )}
            </div>
            <ol className="space-y-2">
              {route.data.steps.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                  >
                    {i + 1}
                  </span>
                  {s.name}
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>
    </section>
  );
}
