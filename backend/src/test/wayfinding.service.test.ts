import { describe, expect, it } from 'vitest';
import { findRoute } from '../services/wayfinding.service.js';
import { AppError } from '../utils/errors.js';

describe('wayfinding.service', () => {
  it('finds a route from a gate to a seat', () => {
    const route = findRoute('gate-a', 'sec-115');
    expect(route.steps[0].id).toBe('gate-a');
    expect(route.steps[route.steps.length - 1].id).toBe('sec-115');
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.etaMinutes).toBeGreaterThanOrEqual(1);
  });

  it('avoids stairs when accessible (step-free) is requested', () => {
    const accessible = findRoute('gate-a', 'concourse-1', true);
    expect(accessible.steps.some((s) => s.id === 'stairs-1')).toBe(false);
    // Step-free route uses the elevator.
    expect(accessible.steps.some((s) => s.id === 'elevator-1')).toBe(true);
  });

  it('may use stairs on the shortest non-accessible route', () => {
    const fastest = findRoute('gate-a', 'concourse-1', false);
    // Stairs path (30+35) is shorter than elevator path (40+45).
    expect(fastest.steps.some((s) => s.id === 'stairs-1')).toBe(true);
  });

  it('rejects unknown nodes', () => {
    expect(() => findRoute('gate-a', 'nope')).toThrow(AppError);
  });

  it('rejects identical origin and destination', () => {
    expect(() => findRoute('gate-a', 'gate-a')).toThrow(AppError);
  });
});
