import { getZones } from './crowd.service.js';
import { getAmenities, type AmenityType } from './sustainability.service.js';
import { getTransportOptions } from './transport.service.js';
import { incidentsRepo, type Severity } from '../repositories/incidents.repo.js';

/**
 * Cross-cutting organizer analytics: crowd, incidents, sustainability, and
 * transport rolled into a single overview for reporting dashboards.
 */
export interface AnalyticsOverview {
  crowd: {
    totalCapacity: number;
    totalOccupancy: number;
    avgDensity: number;
    zonesAtCapacity: number;
  };
  incidents: {
    open: number;
    resolved: number;
    bySeverity: Record<Severity, number>;
  };
  sustainability: {
    amenitiesByType: Record<AmenityType, number>;
    wasteDivertedPercent: number;
  };
  transport: {
    optionCount: number;
    accessibleCount: number;
  };
  generatedAt: string;
}

export async function getOverview(): Promise<AnalyticsOverview> {
  const { zones } = await getZones();
  const incidents = await incidentsRepo.list();
  const { amenities } = getAmenities();
  const { options } = getTransportOptions();

  const totalCapacity = zones.reduce((s, z) => s + z.capacity, 0);
  const totalOccupancy = zones.reduce((s, z) => s + z.occupancy, 0);
  const avgDensity =
    zones.length > 0
      ? Math.round((totalOccupancy / totalCapacity) * 100) / 100
      : 0;

  const bySeverity: Record<Severity, number> = { low: 0, medium: 0, high: 0 };
  for (const i of incidents) bySeverity[i.severity] += 1;

  const amenitiesByType: Record<AmenityType, number> = {
    water: 0,
    recycling: 0,
    compost: 0,
    'ev-charging': 0,
  };
  for (const a of amenities) amenitiesByType[a.type] += 1;

  // Mock waste-diversion metric derived from recycling/compost presence.
  const diversionPoints = amenitiesByType.recycling * 12 + amenitiesByType.compost * 18;
  const wasteDivertedPercent = Math.min(95, 40 + diversionPoints);

  return {
    crowd: {
      totalCapacity,
      totalOccupancy,
      avgDensity,
      zonesAtCapacity: zones.filter((z) => z.level === 'crit').length,
    },
    incidents: {
      open: incidents.filter((i) => i.status === 'open').length,
      resolved: incidents.filter((i) => i.status === 'resolved').length,
      bySeverity,
    },
    sustainability: {
      amenitiesByType,
      wasteDivertedPercent,
    },
    transport: {
      optionCount: options.length,
      accessibleCount: options.filter((o) => o.accessible).length,
    },
    generatedAt: new Date().toISOString(),
  };
}
