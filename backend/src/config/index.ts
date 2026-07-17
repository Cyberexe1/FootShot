/**
 * Centralized, validated configuration.
 * All environment access goes through here so the rest of the app never reads
 * process.env directly. Secrets are injected via App Runner env vars.
 */
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  // Comma-separated list of allowed CORS origins (e.g. the CloudFront domain).
  CORS_ORIGINS: z.string().default('*'),
  AWS_REGION: z.string().default('us-east-1'),
  // Auth: JWT signing secret + operator/organizer credentials. Passwords are
  // stored as bcrypt hashes (STAFF_PASSWORD_HASH / ORGANIZER_PASSWORD_HASH).
  // For local dev, plaintext fallbacks are hashed at startup if no hash is set.
  AUTH_JWT_SECRET: z.string().default('dev-insecure-jwt-secret-change-me'),
  AUTH_JWT_EXPIRES_IN: z.string().default('8h'),
  STAFF_USERNAME: z.string().default('operator'),
  ORGANIZER_USERNAME: z.string().default('organizer'),
  STAFF_PASSWORD_HASH: z.string().optional(),
  ORGANIZER_PASSWORD_HASH: z.string().optional(),
  STAFF_PASSWORD: z.string().default('operator123'),
  ORGANIZER_PASSWORD: z.string().default('organizer123'),
  // DynamoDB tables. If unset, in-memory stores are used (demo).
  INCIDENTS_TABLE: z.string().optional(),
  USERS_TABLE: z.string().optional(),
  CROWD_TABLE: z.string().optional(),
  // Amazon Nova model id used via Bedrock (Converse API).
  BEDROCK_MODEL_ID: z.string().default('amazon.nova-lite-v1:0'),
  BEDROCK_MAX_TOKENS: z.coerce.number().int().positive().default(1024),
  BEDROCK_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.3),
  BEDROCK_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast on misconfiguration.
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  corsOrigins:
    env.CORS_ORIGINS === '*'
      ? '*'
      : env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  awsRegion: env.AWS_REGION,
  auth: {
    jwtSecret: env.AUTH_JWT_SECRET,
    jwtExpiresIn: env.AUTH_JWT_EXPIRES_IN,
    staff: {
      username: env.STAFF_USERNAME,
      passwordHash: env.STAFF_PASSWORD_HASH ?? null,
      password: env.STAFF_PASSWORD,
    },
    organizer: {
      username: env.ORGANIZER_USERNAME,
      passwordHash: env.ORGANIZER_PASSWORD_HASH ?? null,
      password: env.ORGANIZER_PASSWORD,
    },
  },
  incidentsTable: env.INCIDENTS_TABLE ?? null,
  usersTable: env.USERS_TABLE ?? null,
  crowdTable: env.CROWD_TABLE ?? null,
  bedrock: {
    modelId: env.BEDROCK_MODEL_ID,
    maxTokens: env.BEDROCK_MAX_TOKENS,
    temperature: env.BEDROCK_TEMPERATURE,
    timeoutMs: env.BEDROCK_TIMEOUT_MS,
  },
  logLevel: env.LOG_LEVEL,
} as const;

// Production guardrails: surface insecure defaults loudly. (console is used here
// to avoid a circular dependency with the logger, which imports this config.)
if (config.isProduction) {
  if (config.corsOrigins === '*') {
    console.warn(
      '[SECURITY] CORS_ORIGINS is "*" in production. Set it to your CloudFront domain.',
    );
  }
  if (config.auth.jwtSecret === 'dev-insecure-jwt-secret-change-me') {
    console.warn(
      '[SECURITY] Default AUTH_JWT_SECRET is in use in production. Set a strong AUTH_JWT_SECRET.',
    );
  }
  if (!config.auth.staff.passwordHash || !config.auth.organizer.passwordHash) {
    console.warn(
      '[SECURITY] Operator passwords are using plaintext fallbacks in production. Set STAFF_PASSWORD_HASH / ORGANIZER_PASSWORD_HASH (bcrypt).',
    );
  }
}
