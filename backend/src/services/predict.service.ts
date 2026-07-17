import { getZones, type DensityLevel } from './crowd.service.js';

/**
 * Lightweight congestion forecasting. With no historical feed available, this
 * projects current density forward using a per-zone trend (arrival waves build,
 * fan zones disperse). Deterministic given current occupancy, so it is testable
 * and can be replaced by a model trained on real telemetry later.
 */
const HORIZONS_MIN = [15, 30, 45, 60];

// Fractional density change per 15-minute step.
const TREND_PER_15: Record<string, number> = {
  'gate-a': 0.15,
  'gate-c': 0.08,
  'concourse-1': 0.1,
  'fan-zone': -0.1,
};
const DEFAULT_TREND = 0.05;

function levelFor(density: number): DensityLevel {
  if (density >= 0.85) return 'crit';
  if (density >= 0.6) return 'warn';
  return 'ok';
}

export interface HorizonPoint {
  minutes: number;
  density: number;
  level: DensityLevel;
}

export interface ZoneForecast {
  zoneId: string;
  name: string;
  currentDensity: number;
  horizon: HorizonPoint[];
  risk: DensityLevel;
}

export async function forecastCongestion(): Promise<{
  forecasts: ZoneForecast[];
  generatedAt: string;
}> {
  const { zones } = await getZones();

  const forecasts: ZoneForecast[] = zones.map((zone) => {
    const rate = TREND_PER_15[zone.id] ?? DEFAULT_TREND;
    let risk: DensityLevel = zone.level;

    const horizon: HorizonPoint[] = HORIZONS_MIN.map((minutes) => {
      const steps = minutes / 15;
      const projected = zone.density * Math.pow(1 + rate, steps);
      const density = Math.min(1.5, Math.max(0, Math.round(projected * 100) / 100));
      const level = levelFor(density);
      if (level === 'crit') risk = 'crit';
      else if (level === 'warn' && risk === 'ok') risk = 'warn';
      return { minutes, density, level };
    });

    return {
      zoneId: zone.id,
      name: zone.name,
      currentDensity: zone.density,
      horizon,
      risk,
    };
  });

  return { forecasts, generatedAt: new Date().toISOString() };
}
