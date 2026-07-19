import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the Bedrock client so embed() never hits AWS.
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: class {
    send = sendMock;
  },
  InvokeModelCommand: class {
    constructor(public input: unknown) {}
  },
}));

import { cosineSimilarity, embed } from '../services/embeddings.service.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('returns 0 when a vector is all zeros (no divide-by-zero)', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe('embed', () => {
  beforeEach(() => sendMock.mockReset());

  it('returns the embedding array from Bedrock', async () => {
    const vector = [0.1, 0.2, 0.3];
    sendMock.mockResolvedValue({
      body: new TextEncoder().encode(JSON.stringify({ embedding: vector })),
    });
    await expect(embed('hello')).resolves.toEqual(vector);
  });

  it('throws when the response has no embedding', async () => {
    sendMock.mockResolvedValue({
      body: new TextEncoder().encode(JSON.stringify({})),
    });
    await expect(embed('hello')).rejects.toThrow();
  });

});
