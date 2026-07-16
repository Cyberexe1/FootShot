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
  // Staff/organizer auth tokens (demo). In production, swap for Cognito JWT
  // verification (COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID).
  STAFF_TOKEN: z.string().default('dev-staff-token'),
  ORGANIZER_TOKEN: z.string().default('dev-organizer-token'),
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  // DynamoDB table for incidents. If unset, an in-memory store is used (demo).
  INCIDENTS_TABLE: z.string().optional(),
  // Amazon Nova model id used via Bedrock (Converse API).
  BEDROCK_MODEL_ID: z.string().default('amazon.nova-lite-v1:0'),
  BEDROCK_MAX_TOKENS: z.coerce.number().int().positive().default(1024),
  BEDROCK_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.3),
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
    staffToken: env.STAFF_TOKEN,
    organizerToken: env.ORGANIZER_TOKEN,
    cognito:
      env.COGNITO_USER_POOL_ID && env.COGNITO_CLIENT_ID
        ? { userPoolId: env.COGNITO_USER_POOL_ID, clientId: env.COGNITO_CLIENT_ID }
        : null,
  },
  incidentsTable: env.INCIDENTS_TABLE ?? null,
  bedrock: {
    modelId: env.BEDROCK_MODEL_ID,
    maxTokens: env.BEDROCK_MAX_TOKENS,
    temperature: env.BEDROCK_TEMPERATURE,
  },
  logLevel: env.LOG_LEVEL,
} as const;
