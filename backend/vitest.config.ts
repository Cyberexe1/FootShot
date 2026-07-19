import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text'],
      // Enforced quality gate (set below current levels to allow small dips).
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 55,
        branches: 50,
      },
      // Exclude non-unit-testable bootstrap/config from the denominator.
      exclude: [
        'dist/**',
        'src/index.ts',
        '**/*.test.ts',
        '**/test/**',
        'vitest.config.ts',
      ],
    },
  },
});
