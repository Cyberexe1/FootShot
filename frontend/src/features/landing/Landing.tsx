interface Props {
  onEnter: () => void;
  onLogin: () => void;
}

const FEATURES = [
  {
    icon: '🧭',
    title: 'AI Wayfinding',
    desc: 'Gate-to-seat directions with step-free routes for every guest.',
  },
  {
    icon: '👥',
    title: 'Crowd Management',
    desc: 'Live zone-density heatmaps and congestion forecasts.',
  },
  {
    icon: '♿',
    title: 'Accessibility',
    desc: 'Sensory maps, assistance requests, screen-reader-first design.',
  },
  {
    icon: '🚇',
    title: 'Transportation',
    desc: 'Metro, shuttle, and rideshare options with live ETAs.',
  },
  {
    icon: '🌱',
    title: 'Sustainability',
    desc: 'Water refill, recycling, and EV charging across the venue.',
  },
  {
    icon: '🌐',
    title: 'Multilingual Assistance',
    desc: 'Conversational help and announcements in 20+ languages.',
  },
  {
    icon: '📊',
    title: 'Operational Intelligence',
    desc: 'KPIs, incident tracking, and organizer analytics.',
  },
  {
    icon: '⚡',
    title: 'Real-time Decisions',
    desc: 'AI situation summaries with prioritized recommended actions.',
  },
];

const STATS = [
  { value: '16', label: 'Host cities' },
  { value: '20+', label: 'Languages' },
  { value: '8', label: 'Capability areas' },
  { value: 'Nova', label: 'Powered by Amazon Bedrock' },
];

export default function Landing({ onEnter, onLogin }: Props) {
  return (
    <div className="min-h-screen bg-bg text-content">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-md bg-primary font-heading text-lg font-bold text-white"
          >
            F
          </span>
          <span className="font-heading text-xl font-bold">FanFlow&nbsp;26</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLogin}
            className="rounded-md border border-surface-2 px-4 py-2 text-sm font-medium text-content transition-colors hover:border-primary"
          >
            Login
          </button>
          <button
            type="button"
            onClick={onEnter}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Launch app
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-16 text-center sm:pt-24">
          <p className="text-content-muted mb-4 text-xs font-medium uppercase tracking-[0.2em]">
            FIFA World Cup 2026 · USA · Canada · Mexico
          </p>
          <h1 className="font-heading text-4xl font-bold leading-tight sm:text-6xl">
            Smart stadiums,{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              seamless tournaments
            </span>
          </h1>
          <p className="text-content-muted mx-auto mt-6 max-w-2xl text-lg">
            A GenAI platform that helps fans, volunteers, and venue staff navigate,
            stay safe, and get real-time answers — powered by Amazon Nova.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onEnter}
              className="rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Enter the console
            </button>
            <a
              href="#features"
              className="rounded-md border border-surface-2 px-6 py-3 font-medium text-content transition-colors hover:border-primary"
            >
              Explore features
            </a>
          </div>

          {/* Stats */}
          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="font-heading block text-2xl font-bold text-content">
                    {s.value}
                  </span>
                  <span className="text-content-muted text-xs">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="mx-auto max-w-6xl px-6 py-16"
      >
        <h2
          id="features-heading"
          className="font-heading mb-2 text-center text-3xl font-bold"
        >
          Everything for match day
        </h2>
        <p className="text-content-muted mx-auto mb-10 max-w-xl text-center">
          Eight capability areas, one platform — from navigation to real-time
          operational decision support.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="rounded-lg border border-surface-2 bg-surface p-5 transition-colors hover:border-primary"
            >
              <span aria-hidden="true" className="text-3xl">
                {f.icon}
              </span>
              <h3 className="font-heading mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="text-content-muted mt-1 text-sm">{f.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-lg bg-gradient-to-r from-primary/20 to-accent/10 p-8 text-center sm:p-12">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            Ready to explore the venue?
          </h2>
          <p className="text-content-muted mx-auto mt-3 max-w-lg">
            Try the Fan Copilot, plan a step-free route, or sign in as an operator
            for live crowd intelligence.
          </p>
          <button
            type="button"
            onClick={onEnter}
            className="mt-6 rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Enter the console
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-2">
        <div className="text-content-muted mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs sm:flex-row">
          <span>FanFlow 26 · Smart Stadiums &amp; Tournament Operations</span>
          <span>React · Node.js · AWS DynamoDB · Amazon Bedrock (Nova)</span>
        </div>
      </footer>
    </div>
  );
}
