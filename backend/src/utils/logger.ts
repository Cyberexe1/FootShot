import pino from 'pino';
import { config } from '../config/index.js';

/**
 * Structured logger. In development we pretty-print; in production we emit JSON
 * for CloudWatch. Never log PII.
 */
export const logger = pino({
  level: config.logLevel,
  transport: config.isProduction
    ? undefined
    : {
        target: 'pino/file',
        options: { destination: 1 },
      },
});
