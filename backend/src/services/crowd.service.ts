import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

/**
 * Live crowd-density service. For the MVP occupancy is held in memory and lightly
 * simulated so the heatmap feels live. In production this would be backed by
 * DynamoDB and fed by real occupancy events (see architecture.md).
 *
 * Note: in-memory state is per-instance and does not survive App Runner scaling.
 * Acceptable for the demo; DynamoDB-backed in Phase 3+.
 */
export type DensityLevel = 'ok' | 'warn' | 'crit';

interface ZoneSeed {
  id: string;
  name: string;
  capacity: number;
}

const ZONES: ZoneSeed[] = [
  { id: 'gate-a', name: 'Gate A — North', capacity: 5000 },
  { id: 'gate-c', name: 'Gate C — East', capacity: 4000 },
  { id: 'concourse-1', name: 'Concourse Level 1', capacity: 8000 },
  { id: 'fan-zone', name: 'Fan Zone Plaza', capacity: 12000 },
];

// Seeded occupancy so the demo shows a meaningful spread of density levels.
const occupancy = new Map<string, number>([
  ['gate-a', 2100],
  ['gate-c', 3600],
  ['concourse-1', 6900],
  ['fan-zone', 4200],
]);

export interface ZoneStatus {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  density: number;
  level: DensityLevel;
}

function levelFor(density: number): DensityLevel {
  if (density >= 0.85) return 'crit';
  if (density >= 0.6) return 'warn';
  return 'ok';
}

/** Applies a small bounded random walk so the demo looks live (skipped in tests). */
function simulateTick(): void {
  if (config.nodeEnv === 'test') return;
  for (const zone of ZONES) {
    const current = occupancy.get(zone.id) ?? 0;
    const delta = Math.round((Math.random() - 0.5) * zone.capacity * 0.05);
    const next = Math.min(zone.capacity, Math.max(0, current + delta));
    occupancy.set(zone.id, next);
  }
}

export function getZones(): { zones: ZoneStatus[]; updatedAt: string } {
  simulateTick();
  const zones = ZONES.map((zone) => {
    const occ = occupancy.get(zone.id) ?? 0;
    const density = Math.round((occ / zone.capacity) * 100) / 100;
    return {
      id: zone.id,
      name: zone.name,
      capacity: zone.capacity,
      occupancy: occ,
      density,
      level: levelFor(density),
    };
  });
  return { zones, updatedAt: new Date().toISOString() };
}

/** Ingest an occupancy reading for a zone (staff-only in Phase 3). */
export function ingestOccupancy(zoneId: string, value: number): ZoneStatus {
  const zone = ZONES.find((z) => z.id === zoneId);
  if (!zone) {
    throw AppError.badRequest(`Unknown zone: ${zoneId}`, 'UNKNOWN_ZONE');
  }
  const clamped = Math.min(zone.capacity, Math.max(0, Math.round(value)));
  occupancy.set(zoneId, clamped);
  const density = Math.round((clamped / zone.capacity) * 100) / 100;
  return {
    id: zone.id,
    name: zone.name,
    capacity: zone.capacity,
    occupancy: clamped,
    density,
    level: levelFor(density),
  };
}
