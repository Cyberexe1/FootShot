import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import FanCopilot from './features/copilot/FanCopilot';

/**
 * App shell for Phase 1. Renders the AI Fan Copilot with a header and a small
 * backend health indicator.
 */
export default function App() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    retry: 1,
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-content-muted text-xs uppercase tracking-widest">
            FIFA World Cup 2026
          </p>
          <h1 className="font-heading text-3xl font-bold">FanFlow&nbsp;26</h1>
        </div>
        <span
          className="text-xs"
          aria-live="polite"
          title="Backend status"
        >
          {health.isSuccess && (
            <span className="text-status-ok">● Online</span>
          )}
          {health.isError && <span className="text-status-crit">● Offline</span>}
        </span>
      </header>

      <FanCopilot />

      <footer className="text-content-muted text-center text-xs">
        Smart Stadiums &amp; Tournament Operations · Powered by Amazon Nova
      </footer>
    </div>
  );
}
