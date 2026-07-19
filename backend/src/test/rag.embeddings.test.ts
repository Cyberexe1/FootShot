import { describe, expect, it, vi, beforeEach } from 'vitest';

// Force the embeddings retrieval path on, with a minimal config the logger + rag
// service both read.
vi.mock('../config/index.js', () => ({
  config: {
    rag: { useEmbeddings: true },
    logLevel: 'silent',
    isProduction: false,
  },
}));

const embedMock = vi.fn();
const cosineMock = vi.fn();
vi.mock('../services/embeddings.service.js', () => ({
  embed: (t: string) => embedMock(t),
  cosineSimilarity: (a: number[], b: number[]) => cosineMock(a, b),
}));

import { retrieveSmart } from '../services/rag.service.js';

describe('retrieveSmart (embeddings path)', () => {
  beforeEach(() => {
    embedMock.mockReset();
    cosineMock.mockReset();
  });

  it('ranks documents by cosine similarity and returns top-k', async () => {
    embedMock.mockResolvedValue([0.1, 0.2, 0.3]);
    cosineMock.mockReturnValue(0.9); // all above the 0.15 threshold
    const docs = await retrieveSmart('where is the exit', 3);
    expect(docs.length).toBe(3);
    expect(docs[0].score).toBe(0.9);
  });

  it('filters out low-similarity documents', async () => {
    embedMock.mockResolvedValue([0.1]);
    cosineMock.mockReturnValue(0.05); // below threshold
    const docs = await retrieveSmart('irrelevant', 3);
    expect(docs).toEqual([]);
  });

  it('falls back to lexical retrieval when embedding fails', async () => {
    embedMock.mockRejectedValue(new Error('bedrock down'));
    const docs = await retrieveSmart('step free accessible entrance');
    // Lexical retriever still finds the accessibility doc.
    expect(docs.some((d) => d.id === 'accessibility')).toBe(true);
  });
});
