import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  type Message,
} from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

/**
 * Wraps the Bedrock Runtime client and invokes Amazon Nova via the Converse
 * API. Kept model-agnostic at the call site: the model id comes from config.
 */
const client = new BedrockRuntimeClient({ region: config.awsRegion });

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

function toMessages(turns: ChatTurn[]): Message[] {
  return turns.map((t) => ({
    role: t.role,
    content: [{ text: t.content }],
  }));
}

/** Non-streaming completion. Returns the full assistant text. */
export async function generateAnswer(
  systemPrompt: string,
  turns: ChatTurn[],
): Promise<string> {
  const start = Date.now();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), config.bedrock.timeoutMs);
  try {
    const command = new ConverseCommand({
      modelId: config.bedrock.modelId,
      system: [{ text: systemPrompt }],
      messages: toMessages(turns),
      inferenceConfig: {
        maxTokens: config.bedrock.maxTokens,
        temperature: config.bedrock.temperature,
      },
    });

    const response = await client.send(command, { abortSignal: abort.signal });
    const text =
      response.output?.message?.content?.map((c) => c.text ?? '').join('') ?? '';

    logger.info(
      { model: config.bedrock.modelId, latencyMs: Date.now() - start },
      'Bedrock converse completed',
    );

    if (!text.trim()) {
      throw AppError.internal('Empty response from model', 'MODEL_EMPTY_RESPONSE');
    }
    return text.trim();
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error({ err }, 'Bedrock converse failed');
    throw new AppError(502, 'MODEL_ERROR', 'The assistant is unavailable right now.');
  } finally {
    clearTimeout(timer);
  }
}

/** Streaming completion. Yields text chunks as they arrive. */
export async function* streamAnswer(
  systemPrompt: string,
  turns: ChatTurn[],
): AsyncGenerator<string> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), config.bedrock.timeoutMs);
  try {
    const command = new ConverseStreamCommand({
      modelId: config.bedrock.modelId,
      system: [{ text: systemPrompt }],
      messages: toMessages(turns),
      inferenceConfig: {
        maxTokens: config.bedrock.maxTokens,
        temperature: config.bedrock.temperature,
      },
    });

    const response = await client.send(command, { abortSignal: abort.signal });
    if (!response.stream) return;

    for await (const event of response.stream) {
      const delta = event.contentBlockDelta?.delta?.text;
      if (delta) yield delta;
    }
  } catch (err) {
    logger.error({ err }, 'Bedrock stream failed');
    throw new AppError(502, 'MODEL_ERROR', 'The assistant is unavailable right now.');
  } finally {
    clearTimeout(timer);
  }
}
