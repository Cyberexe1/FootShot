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
  bedrock: {
    modelId: env.BEDROCK_MODEL_ID,
    maxTokens: env.BEDROCK_MAX_TOKENS,
    temperature: env.BEDROCK_TEMPERATURE,
  },
  logLevel: env.LOG_LEVEL,
} as const;
