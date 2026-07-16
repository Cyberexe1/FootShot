/**
 * Sustainability amenities across the venue: water refill, recycling, compost,
 * and EV charging. Bundled for the MVP.
 */
export type AmenityType = 'water' | 'recycling' | 'compost' | 'ev-charging';

export interface SustainabilityAmenity {
  id: string;
  type: AmenityType;
  name: string;
  zone: string;
}

const AMENITIES: SustainabilityAmenity[] = [
  { id: 'water-l1', type: 'water', name: 'Water Refill Station', zone: 'Concourse Level 1' },
  { id: 'water-n', type: 'water', name: 'Water Refill Station', zone: 'North Concourse' },
  { id: 'recycle-fc', type: 'recycling', name: 'Recycling Point', zone: 'Food Court' },
  { id: 'compost-fc', type: 'compost', name: 'Compost Station', zone: 'Food Court' },
  { id: 'recycle-fz', type: 'recycling', name: 'Recycling Point', zone: 'Fan Zone Plaza' },
  { id: 'ev-south', type: 'ev-charging', name: 'EV Charging', zone: 'South Parking Lot' },
];

export function getAmenities(type?: AmenityType): {
  amenities: SustainabilityAmenity[];
} {
  const amenities = type ? AMENITIES.filter((a) => a.type === type) : AMENITIES;
  return { amenities };
}
