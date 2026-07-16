import { describe, expect, it } from 'vitest';
import { buildContext, retrieve } from '../services/rag.service.js';

describe('rag.service', () => {
  it('retrieves accessibility content for a step-free query', () => {
    const docs = retrieve('where is the step-free accessible elevator');
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].id).toBe('accessibility');
  });

  it('retrieves transport content for a metro query', () => {
    const docs = retrieve('how do I get to the metro station');
    expect(docs.some((d) => d.id === 'transport')).toBe(true);
  });

  it('returns nothing for an empty query', () => {
    expect(retrieve('')).toEqual([]);
  });

  it('builds a numbered context block', () => {
    const docs = retrieve('recycling and water refill');
    const context = buildContext(docs);
    expect(context).toContain('[1]');
  });
});
