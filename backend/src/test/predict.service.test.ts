import { describe, expect, it } from 'vitest';
import { forecastCongestion } from '../services/predict.service.js';

describe('forecastCongestion (service)', () => {
  it('produces a 4-point horizon and a risk level per zone', async () => {
    const { forecasts, generatedAt } = await forecastCongestion();
    expect(forecasts.length).toBeGreaterThan(0);
    expect(generatedAt).toBeTruthy();
    for (const f of forecasts) {
      expect(f.horizon).toHaveLength(4);
      expect(['ok', 'warn', 'crit']).toContain(f.risk);
      // Density is clamped to a sane range.
      for (const h of f.horizon) {
        expect(h.density).toBeGreaterThanOrEqual(0);
        expect(h.density).toBeLessThanOrEqual(1.5);
      }
    }
  });

  it('projects rising density for arrival zones and dispersal for fan zone', async () => {
    const { forecasts } = await forecastCongestion();
    const gateA = forecasts.find((f) => f.zoneId === 'gate-a')!;
    const fanZone = forecasts.find((f) => f.zoneId === 'fan-zone')!;
    expect(gateA.horizon.at(-1)!.density).toBeGreaterThan(gateA.currentDensity);
    expect(fanZone.horizon.at(-1)!.density).toBeLessThan(fanZone.currentDensity);
  });
});
