import { describe, expect, it } from 'vitest';
import { redactPii } from '../utils/pii.js';

describe('redactPii', () => {
  it('redacts email addresses', () => {
    expect(redactPii('contact me at sofia@example.com please')).toContain('[EMAIL]');
  });

  it('redacts phone numbers', () => {
    expect(redactPii('call +1 202 555 0123')).toContain('[PHONE]');
  });

  it('redacts long numeric ids like ticket numbers', () => {
    expect(redactPii('my ticket is 1234567890')).toContain('[ID]');
  });

  it('leaves normal text untouched', () => {
    const text = 'where is the nearest step-free exit';
    expect(redactPii(text)).toBe(text);
  });
});
