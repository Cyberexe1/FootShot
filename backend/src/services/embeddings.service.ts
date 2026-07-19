import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Amazon Titan text embeddings via Bedrock. Used for semantic RAG retrieval.
 * Kept isolated so retrieval can fall back to lexical scoring if embeddings
 * are unavailable.
 */
const client = new BedrockRuntimeClient({ region: config.awsRegion });

export async function embed(text: string): Promise<number[]> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), config.bedrock.timeoutMs);
  try {
    const res = await client.send(
      new InvokeModelCommand({
        modelId: config.bedrock.embedModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({ inputText: text }),
      }),
      { abortSignal: abort.signal },
    );
    const parsed = JSON.parse(new TextDecoder().decode(res.body)) as {
      embedding?: number[];
    };
    if (!parsed.embedding) throw new Error('No embedding in response');
    return parsed.embedding;
  } catch (err) {
    logger.warn({ err }, 'Titan embedding failed');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
