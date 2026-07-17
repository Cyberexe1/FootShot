import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import Button from '../../components/ui/Button';

type Mode = 'login' | 'signup';

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export default function AuthPage({ onSuccess, onBack }: Props) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      mode === 'login'
        ? login(username.trim(), password)
        : signup(username.trim(), password),
    onSuccess,
  });

  const switchMode = (m: Mode) => {
    setMode(m);
    submit.reset();
  };

  return (
    <div className="min-h-screen bg-bg text-content">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2"
          aria-label="Back to home"
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-md bg-primary font-heading text-lg font-bold text-white"
          >
            F
          </span>
          <span className="font-heading text-xl font-bold">FanFlow&nbsp;26</span>
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-content-muted text-sm hover:text-content"
        >
          ← Back to home
        </button>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-content-muted mt-2 text-sm">
            {mode === 'login'
              ? 'Sign in to access the operator console.'
              : 'Sign up to access the operator console.'}
          </p>
        </div>

        {/* Mode toggle */}
        <div role="tablist" aria-label="Authentication mode" className="flex gap-2 rounded-md bg-surface p-1">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={
                'flex-1 rounded-sm px-3 py-2 text-sm font-medium capitalize transition-colors ' +
                (mode === m ? 'bg-primary text-white' : 'text-content-muted hover:text-content')
              }
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (username.trim() && password) submit.mutate();
          }}
          className="flex flex-col gap-4 rounded-lg bg-surface p-6"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="auth-username" className="text-content-muted text-sm">
              Username
            </label>
            <input
              id="auth-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-sm bg-surface-2 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="auth-password" className="text-content-muted text-sm">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-sm bg-surface-2 px-3 py-2"
            />
            {mode === 'signup' && (
              <span className="text-content-muted text-xs">
                At least 8 characters.
              </span>
            )}
          </div>

          <div aria-live="polite">
            {submit.isError && (
              <p className="text-status-crit text-sm" role="alert">
                {(submit.error as Error).message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={submit.isPending || !username.trim() || !password}
          >
            {submit.isPending
              ? mode === 'login'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </Button>
        </form>

        <p className="text-content-muted text-center text-sm">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button type="button" onClick={() => switchMode('signup')} className="text-primary hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')} className="text-primary hover:underline">
                Log in
              </button>
            </>
          )}
        </p>
      </main>
    </div>
  );
}
