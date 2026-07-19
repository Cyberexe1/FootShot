import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text'],
      // Enforced quality gate (set below current levels to allow small dips).
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 80,
      },
      // Exclude non-unit-testable bootstrap/config/logging from the denominator.
      exclude: [
        'dist/**',
        'src/index.ts',
        'src/config/**',
        'src/utils/logger.ts',
        '**/*.test.ts',
        '**/test/**',
        'vitest.config.ts',
      ],
    },
  },
});
