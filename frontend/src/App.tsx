import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import { useAuth } from './lib/auth';
import Landing from './features/landing/Landing';
import AuthPage from './features/auth/AuthPage';
import FanCopilot from './features/copilot/FanCopilot';
import Wayfinding from './features/wayfinding/Wayfinding';
import CrowdView from './features/crowd/CrowdView';
import Services from './features/services/Services';
import OperatorDashboard from './features/operator/OperatorDashboard';

type View = 'landing' | 'auth' | 'app';
type Tab = 'copilot' | 'wayfinding' | 'crowd' | 'services' | 'operator';

interface NavItem {
  id: Tab;
  label: string;
  icon: string;
  subtitle: string;
}

const NAV: NavItem[] = [
  { id: 'copilot', label: 'Fan Copilot', icon: '💬', subtitle: 'Ask anything, in any language' },
  { id: 'wayfinding', label: 'Wayfinding', icon: '🧭', subtitle: 'Routes and step-free directions' },
  { id: 'crowd', label: 'Crowd View', icon: '👥', subtitle: 'Live zone density' },
  { id: 'services', label: 'Services', icon: '🛎️', subtitle: 'Transport, accessibility, sustainability' },
  { id: 'operator', label: 'Operator', icon: '📊', subtitle: 'Operations & real-time intelligence' },
];

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [tab, setTab] = useState<Tab>('copilot');
  const [navOpen, setNavOpen] = useState(false);
  const { user, logout } = useAuth();
  const health = useQuery({ queryKey: ['health'], queryFn: api.health, retry: 1 });

  if (view === 'landing') {
    return (
      <Landing
        onEnter={() => {
          setTab('copilot');
          setView('app');
        }}
        onLogin={() => setView('auth')}
      />
    );
  }

  if (view === 'auth') {
    return (
      <AuthPage
        onSuccess={() => {
          setTab('operator');
          setView('app');
        }}
        onBack={() => setView('landing')}
      />
    );
  }

  const active = NAV.find((n) => n.id === tab)!;

  const go = (id: Tab) => {
    setTab(id);
    setNavOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-bg text-content">
      {/* Mobile overlay */}
      {navOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-2 bg-surface ' +
          'transition-transform lg:static lg:translate-x-0 ' +
          (navOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-md bg-primary font-heading text-lg font-bold text-white"
          >
            F
          </span>
          <div>
            <p className="font-heading text-lg font-bold leading-none">FanFlow&nbsp;26</p>
            <p className="text-content-muted text-[10px] uppercase tracking-widest">
              World Cup 2026
            </p>
          </div>
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const isActive = tab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => go(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ' +
                      (isActive
                        ? 'bg-primary/15 text-content'
                        : 'text-content-muted hover:bg-surface-2 hover:text-content')
                    }
                  >
                    <span
                      aria-hidden="true"
                      className={
                        'text-lg ' + (isActive ? '' : 'opacity-80')
                      }
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="h-4 w-1 rounded-full bg-primary"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User / auth section */}
        <div className="border-t border-surface-2 p-3">
          {user ? (
            <div className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2.5">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-semibold text-white"
              >
                {user.username.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.username}</p>
                <p className="text-content-muted text-xs capitalize">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-content-muted text-xs hover:text-content"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setView('auth')}
              className="w-full rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Log in / Sign up
            </button>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-surface-2 bg-bg/80 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-1.5 text-content-muted hover:bg-surface-2 hover:text-content lg:hidden"
          >
            <span aria-hidden="true">☰</span>
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="font-heading truncate text-xl font-bold leading-tight">
              {active.label}
            </h1>
            <p className="text-content-muted truncate text-xs">{active.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => setView('landing')}
            className="text-content-muted hidden text-xs hover:text-content sm:inline"
          >
            ← Home
          </button>
          <span
            className="flex items-center gap-1.5 text-xs"
            aria-live="polite"
            title="Backend status"
          >
            <span
              aria-hidden="true"
              className={
                'inline-block h-2 w-2 rounded-full ' +
                (health.isError ? 'bg-status-crit' : 'bg-status-ok')
              }
            />
            <span className="text-content-muted hidden sm:inline">
              {health.isError ? 'Offline' : 'Online'}
            </span>
          </span>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
          {tab === 'copilot' && <FanCopilot />}
          {tab === 'wayfinding' && <Wayfinding />}
          {tab === 'crowd' && <CrowdView />}
          {tab === 'services' && <Services />}
          {tab === 'operator' && (
            <OperatorDashboard onRequireLogin={() => setView('auth')} />
          )}
        </main>

        <footer className="text-content-muted border-t border-surface-2 px-6 py-4 text-center text-xs">
          Smart Stadiums &amp; Tournament Operations · Powered by Amazon Nova
        </footer>
      </div>
    </div>
  );
}
