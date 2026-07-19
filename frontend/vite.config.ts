/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to the local backend during development so the frontend
    // uses the same "/api" path it will use behind CloudFront in production.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text'],
      // Enforced quality gate (set below current levels to allow small dips).
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 45,
        branches: 55,
      },
      exclude: [
        '**/main.tsx',
        '**/*.test.{ts,tsx}',
        '**/test/**',
        '**/vite-env.d.ts',
      ],
    },
  },
});
