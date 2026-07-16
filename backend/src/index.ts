import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(
    { port: config.port, env: config.nodeEnv },
    'FanFlow 26 backend listening',
  );
});

// Graceful shutdown for App Runner scaling/deploys.
const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
