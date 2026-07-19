import { describe, expect, it } from 'vitest';
import { getTransportOptions } from '../services/transport.service.js';
import { getAmenities } from '../services/sustainability.service.js';
import {
  getServices,
  requestAssistance,
} from '../services/accessibility.service.js';
import { getOverview } from '../services/analytics.service.js';
import { findRoute, getGraph } from '../services/wayfinding.service.js';
import { getZones, ingestOccupancy } from '../services/crowd.service.js';

describe('transport.service', () => {
  it('returns options sorted by ETA', () => {
    const { options } = getTransportOptions();
    const etas = options.map((o) => o.etaMinutes);
    expect([...etas]).toEqual([...etas].sort((a, b) => a - b));
  });
});

describe('sustainability.service', () => {
  it('returns all amenities and filters by type', () => {
    expect(getAmenities().amenities.length).toBeGreaterThan(0);
    expect(getAmenities('water').amenities.every((a) => a.type === 'water')).toBe(true);
  });
});

describe('accessibility.service', () => {
  it('lists services', () => {
    expect(getServices().services.length).toBeGreaterThan(0);
  });

  it('creates an assistance request, redacting PII and setting ETA by type', () => {
    const medical = requestAssistance('medical', 'gate-a', 'call 2025550123');
    expect(medical.status).toBe('received');
    expect(medical.etaMinutes).toBe(3);
    expect(medical.note).not.toContain('2025550123');

    const wheelchair = requestAssistance('wheelchair', 'gate-c');
    expect(wheelchair.etaMinutes).toBe(8);
    expect(wheelchair.note).toBeUndefined();
  });
});

describe('analytics.service', () => {
  it('aggregates crowd, incidents, sustainability and transport', async () => {
    const o = await getOverview();
    expect(o.crowd.totalCapacity).toBeGreaterThan(0);
    expect(o.crowd.avgDensity).toBeGreaterThanOrEqual(0);
    expect(o.sustainability.wasteDivertedPercent).toBeGreaterThan(0);
    expect(o.transport.optionCount).toBeGreaterThan(0);
    expect(o.incidents).toHaveProperty('bySeverity');
  });
});

describe('wayfinding.service', () => {
  it('returns the full graph', () => {
    const g = getGraph();
    expect(g.nodes.length).toBeGreaterThan(0);
    expect(g.edges.length).toBeGreaterThan(0);
  });

  it('throws on same origin/destination', () => {
    expect(() => findRoute('gate-a', 'gate-a')).toThrow();
  });
});

describe('crowd.service', () => {
  it('reports density levels and ingests occupancy', async () => {
    const before = await getZones();
    expect(before.zones.length).toBeGreaterThan(0);
    const updated = await ingestOccupancy('gate-a', 4800);
    expect(updated.occupancy).toBe(4800);
    expect(updated.level).toBe('crit');
  });

  it('rejects an unknown zone on ingest', async () => {
    await expect(ingestOccupancy('nope', 1)).rejects.toThrow();
  });
});
