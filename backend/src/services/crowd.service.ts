import { AppError } from '../utils/errors.js';
import { crowdRepo } from '../repositories/crowd.repo.js';

/**
 * Live crowd-density service. Occupancy is persisted via the crowd repository
 * (DynamoDB in prod → shared across instances; in-memory for dev/tests).
 */
export type DensityLevel = 'ok' | 'warn' | 'crit';

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

function toStatus(record: {
  zoneId: string;
  name: string;
  capacity: number;
  occupancy: number;
}): ZoneStatus {
  const density = Math.round((record.occupancy / record.capacity) * 100) / 100;
  return {
    id: record.zoneId,
    name: record.name,
    capacity: record.capacity,
    occupancy: record.occupancy,
    density,
    level: levelFor(density),
  };
}

export async function getZones(): Promise<{
  zones: ZoneStatus[];
  updatedAt: string;
}> {
  const records = await crowdRepo.getAll();
  return { zones: records.map(toStatus), updatedAt: new Date().toISOString() };
}

/** Ingest an occupancy reading for a zone (staff-only). */
export async function ingestOccupancy(
  zoneId: string,
  value: number,
): Promise<ZoneStatus> {
  const updated = await crowdRepo.setOccupancy(zoneId, value);
  if (!updated) {
    throw AppError.badRequest(`Unknown zone: ${zoneId}`, 'UNKNOWN_ZONE');
  }
  return toStatus(updated);
}
