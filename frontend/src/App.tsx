import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import FanCopilot from './features/copilot/FanCopilot';
import Wayfinding from './features/wayfinding/Wayfinding';
import CrowdView from './features/crowd/CrowdView';
import OperatorDashboard from './features/operator/OperatorDashboard';

type Tab = 'copilot' | 'wayfinding' | 'crowd' | 'operator';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'copilot', label: 'Fan Copilot' },
  { id: 'wayfinding', label: 'Wayfinding' },
  { id: 'crowd', label: 'Crowd View' },
  { id: 'operator', label: 'Operator' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('copilot');
  const health = useQuery({ queryKey: ['health'], queryFn: api.health, retry: 1 });

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-content-muted text-xs uppercase tracking-widest">
            FIFA World Cup 2026
          </p>
          <h1 className="font-heading text-3xl font-bold">FanFlow&nbsp;26</h1>
        </div>
        <span className="text-xs" aria-live="polite" title="Backend status">
          {health.isSuccess && <span className="text-status-ok">● Online</span>}
          {health.isError && <span className="text-status-crit">● Offline</span>}
        </span>
      </header>

      <nav aria-label="Sections">
        <div role="tablist" className="flex gap-2 border-b border-surface-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={
                'rounded-t-md px-4 py-2 text-sm font-medium ' +
                (tab === t.id
                  ? 'border-b-2 border-primary text-content'
                  : 'text-content-muted hover:text-content')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="flex flex-1 flex-col"
      >
        {tab === 'copilot' && <FanCopilot />}
        {tab === 'wayfinding' && <Wayfinding />}
        {tab === 'crowd' && <CrowdView />}
        {tab === 'operator' && <OperatorDashboard />}
      </main>

      <footer className="text-content-muted text-center text-xs">
        Smart Stadiums &amp; Tournament Operations · Powered by Amazon Nova
      </footer>
    </div>
  );
}
