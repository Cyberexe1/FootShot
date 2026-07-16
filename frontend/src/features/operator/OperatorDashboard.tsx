import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setAuthToken, type Severity } from '../../lib/api';
import NotifyPanel from './NotifyPanel';

function KpiCards() {
  const crowd = useQuery({
    queryKey: ['crowd-zones'],
    queryFn: api.crowdZones,
    refetchInterval: 15_000,
  });
  const incidents = useQuery({ queryKey: ['incidents'], queryFn: api.listIncidents });

  const zones = crowd.data?.zones ?? [];
  const totalOccupancy = zones.reduce((sum, z) => sum + z.occupancy, 0);
  const critical = zones.filter((z) => z.level === 'crit').length;
  const openIncidents =
    incidents.data?.incidents.filter((i) => i.status === 'open').length ?? 0;

  const cards = [
    { label: 'People in venue', value: totalOccupancy.toLocaleString() },
    { label: 'Zones at capacity', value: String(critical) },
    { label: 'Open incidents', value: String(openIncidents) },
  ];

  return (
    <ul className="grid grid-cols-3 gap-3">
      {cards.map((c) => (
        <li key={c.label} className="rounded-md bg-surface p-3 text-center">
          <p className="font-heading text-2xl font-bold">{c.value}</p>
          <p className="text-content-muted text-xs">{c.label}</p>
        </li>
      ))}
    </ul>
  );
}

function AiSummaryPanel() {
  const summary = useMutation({ mutationFn: api.opsSummary });
  return (
    <div className="rounded-md bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">AI Decision Support</h3>
        <button
          type="button"
          onClick={() => summary.mutate()}
          disabled={summary.isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {summary.isPending ? 'Analyzing…' : 'Generate summary'}
        </button>
      </div>
      <div aria-live="polite">
        {summary.isError && (
          <p className="text-status-crit text-sm" role="alert">
            {(summary.error as Error).message}
          </p>
        )}
        {summary.data ? (
          <p className="whitespace-pre-wrap text-sm">{summary.data.summary}</p>
        ) : (
          !summary.isPending && (
            <p className="text-content-muted text-sm">
              Generate an AI summary of current crowd density and open incidents.
            </p>
          )
        )}
      </div>
    </div>
  );
}

function IncidentsPanel() {
  const qc = useQueryClient();
  const incidents = useQuery({ queryKey: ['incidents'], queryFn: api.listIncidents });
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');

  const create = useMutation({
    mutationFn: () => api.createIncident({ title, severity }),
    onSuccess: () => {
      setTitle('');
      qc.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
  const resolve = useMutation({
    mutationFn: (id: string) => api.updateIncident(id, { status: 'resolved' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  });

  return (
    <div className="rounded-md bg-surface p-4">
      <h3 className="font-heading mb-2 text-lg font-semibold">Incidents</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate();
        }}
        className="mb-3 flex flex-wrap gap-2"
      >
        <label htmlFor="incident-title" className="sr-only">
          Incident title
        </label>
        <input
          id="incident-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New incident…"
          className="flex-1 rounded-sm bg-surface-2 px-2 py-1.5 text-sm"
        />
        <label htmlFor="incident-severity" className="sr-only">
          Severity
        </label>
        <select
          id="incident-severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Severity)}
          className="rounded-sm bg-surface-2 px-2 py-1.5 text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          disabled={create.isPending || !title.trim()}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {incidents.isLoading && (
        <p className="text-content-muted text-sm">Loading incidents…</p>
      )}
      <ul className="flex flex-col gap-2">
        {incidents.data?.incidents.map((i) => (
          <li
            key={i.id}
            className="flex items-center justify-between rounded-sm bg-surface-2 px-3 py-2 text-sm"
          >
            <span>
              <span
                className={
                  i.severity === 'high'
                    ? 'text-status-crit'
                    : i.severity === 'medium'
                      ? 'text-status-warn'
                      : 'text-status-ok'
                }
              >
                [{i.severity}]
              </span>{' '}
              {i.title}
              {i.status === 'resolved' && (
                <span className="text-content-muted"> · resolved</span>
              )}
            </span>
            {i.status === 'open' && (
              <button
                type="button"
                onClick={() => resolve.mutate(i.id)}
                className="rounded-sm border border-surface px-2 py-1 text-xs hover:border-primary"
              >
                Resolve
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OperatorDashboard() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(
    typeof localStorage !== 'undefined' && !!localStorage.getItem('ff26_token'),
  );

  if (!authed) {
    return (
      <section aria-labelledby="operator-heading" className="flex flex-col gap-4">
        <h2 id="operator-heading" className="font-heading text-2xl font-semibold">
          Operator Sign-in
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAuthToken(token.trim());
            setAuthed(true);
          }}
          className="flex flex-col gap-3 rounded-md bg-surface p-4"
        >
          <label htmlFor="op-token" className="text-content-muted text-sm">
            Staff access token
          </label>
          <input
            id="op-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter staff token"
            className="rounded-sm bg-surface-2 px-3 py-2"
          />
          <button
            type="submit"
            disabled={!token.trim()}
            className="self-start rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Sign in
          </button>
        </form>
      </section>
    );
  }

  return (
    <section aria-labelledby="operator-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 id="operator-heading" className="font-heading text-2xl font-semibold">
          Operator Dashboard
        </h2>
        <button
          type="button"
          onClick={() => {
            setAuthToken(null);
            setAuthed(false);
            setToken('');
          }}
          className="text-content-muted text-xs hover:text-content"
        >
          Sign out
        </button>
      </div>
      <KpiCards />
      <AiSummaryPanel />
      <IncidentsPanel />
      <NotifyPanel />
    </section>
  );
}
