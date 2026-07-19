import { describe, expect, it, vi, beforeEach } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: class {
    send = sendMock;
  },
  ConverseCommand: class {
    constructor(public input: unknown) {}
  },
  ConverseStreamCommand: class {
    constructor(public input: unknown) {}
  },
}));

import { generateAnswer, streamAnswer } from '../services/bedrock.service.js';

describe('generateAnswer', () => {
  beforeEach(() => sendMock.mockReset());

  it('returns the concatenated model text', async () => {
    sendMock.mockResolvedValue({
      output: { message: { content: [{ text: 'Hello ' }, { text: 'world' }] } },
    });
    await expect(generateAnswer('sys', [{ role: 'user', content: 'hi' }])).resolves.toBe(
      'Hello world',
    );
  });

  it('throws a 500 MODEL_EMPTY_RESPONSE when the model returns empty text', async () => {
    sendMock.mockResolvedValue({ output: { message: { content: [{ text: '' }] } } });
    const err = await generateAnswer('sys', [{ role: 'user', content: 'hi' }]).catch(
      (e) => e,
    );
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('MODEL_EMPTY_RESPONSE');
  });
});

describe('streamAnswer', () => {
  beforeEach(() => sendMock.mockReset());

  it('yields text deltas from the stream', async () => {
    async function* fakeStream() {
      yield { contentBlockDelta: { delta: { text: 'Ga' } } };
      yield { contentBlockDelta: { delta: { text: 'te C' } } };
      yield { other: true };
    }
    sendMock.mockResolvedValue({ stream: fakeStream() });

    const chunks: string[] = [];
    for await (const c of streamAnswer('sys', [{ role: 'user', content: 'hi' }])) {
      chunks.push(c);
    }
    expect(chunks.join('')).toBe('Gate C');
  });

  it('returns nothing when there is no stream', async () => {
    sendMock.mockResolvedValue({});
    const chunks: string[] = [];
    for await (const c of streamAnswer('sys', [{ role: 'user', content: 'hi' }])) {
      chunks.push(c);
    }
    expect(chunks).toEqual([]);
  });


});
