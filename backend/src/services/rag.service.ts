import { knowledgeBase, type KnowledgeDoc } from './knowledgeBase.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cosineSimilarity, embed } from './embeddings.service.js';

export interface RetrievedDoc {
  id: string;
  title: string;
  text: string;
  score: number;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'to', 'of', 'and', 'or', 'in', 'on', 'at',
  'for', 'my', 'i', 'me', 'do', 'how', 'what', 'where', 'when', 'can', 'you',
  'it', 'this', 'that', 'with', 'from', 'get', 'there', 'be', 'am',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Lightweight lexical retriever (term-overlap scoring). Deterministic and
 * dependency-free, which keeps it fast and easy to test. It can be swapped for
 * a Titan-embedding vector search without changing the calling code.
 */
export function retrieve(query: string, topK = 3): RetrievedDoc[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const scored = knowledgeBase.map((doc: KnowledgeDoc) => {
    const docTerms = tokenize(`${doc.title} ${doc.text}`);
    const docSet = new Set(docTerms);
    let score = 0;
    for (const term of queryTerms) {
      if (docSet.has(term)) score += 1;
    }
    return {
      id: doc.id,
      title: doc.title,
      text: doc.text,
      score: score / queryTerms.length,
    };
  });

  return scored
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// Lazily-computed KB embeddings, cached for the process lifetime.
let kbEmbeddingsPromise: Promise<Array<{ doc: KnowledgeDoc; vector: number[] }>> | null =
  null;

function getKbEmbeddings() {
  if (!kbEmbeddingsPromise) {
    kbEmbeddingsPromise = Promise.all(
      knowledgeBase.map(async (doc) => ({
        doc,
        vector: await embed(`${doc.title}\n${doc.text}`),
      })),
    );
  }
  return kbEmbeddingsPromise;
}

/**
 * Semantic retrieval using Titan embeddings when enabled, with a transparent
 * fallback to lexical scoring on any failure. Callers use this instead of the
 * raw lexical `retrieve` so grounding quality can improve without code changes.
 */
export async function retrieveSmart(query: string, topK = 3): Promise<RetrievedDoc[]> {
  if (!config.rag.useEmbeddings) return retrieve(query, topK);
  try {
    const [kb, queryVec] = await Promise.all([getKbEmbeddings(), embed(query)]);
    const scored = kb.map(({ doc, vector }) => ({
      id: doc.id,
      title: doc.title,
      text: doc.text,
      score: cosineSimilarity(queryVec, vector),
    }));
    return scored
      .filter((d) => d.score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (err) {
    logger.warn({ err }, 'Embedding retrieval failed; falling back to lexical');
    kbEmbeddingsPromise = null; // allow retry later
    return retrieve(query, topK);
  }
}

/** Builds the grounding context block injected into the prompt. */
export function buildContext(docs: RetrievedDoc[]): string {
  if (docs.length === 0) return '';
  return docs
    .map((d, i) => `[${i + 1}] ${d.title}\n${d.text}`)
    .join('\n\n');
}
