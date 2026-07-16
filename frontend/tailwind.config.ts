import type { Config } from 'tailwindcss';

// Design tokens mirror design.md so utility classes stay consistent with the
// design system.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0B5FFF', hover: '#0A4FD1' },
        secondary: '#00A878',
        accent: '#FF5A1F',
        bg: '#0F172A',
        surface: { DEFAULT: '#1E293B', 2: '#334155' },
        content: { DEFAULT: '#F8FAFC', muted: '#CBD5E1' },
        status: {
          ok: '#22C55E',
          warn: '#F59E0B',
          crit: '#EF4444',
          info: '#38BDF8',
        },
      },
      fontFamily: {
        body: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Sora', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
      },
    },
  },
  plugins: [],
} satisfies Config;
