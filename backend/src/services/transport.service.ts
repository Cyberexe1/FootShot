import { config } from '../config/index.js';

/**
 * Transport options out of the stadium. Base ETAs are lightly simulated so the
 * planner feels live. In production these would come from transit feeds.
 */
export type TransportMode = 'metro' | 'shuttle' | 'rideshare' | 'bus';

interface OptionSeed {
  id: string;
  mode: TransportMode;
  name: string;
  baseEtaMinutes: number;
  frequency: string;
  accessible: boolean;
  note: string;
}

const OPTIONS: OptionSeed[] = [
  {
    id: 'metro-l3',
    mode: 'metro',
    name: 'Metro — Line 3',
    baseEtaMinutes: 6,
    frequency: 'every 4 min',
    accessible: true,
    note: 'Step-free walk from Gate A (North).',
  },
  {
    id: 'park-ride',
    mode: 'shuttle',
    name: 'Park & Ride Shuttle',
    baseEtaMinutes: 12,
    frequency: 'every 10 min',
    accessible: true,
    note: 'Accessible drop-off at the East plaza near Gate C.',
  },
  {
    id: 'rideshare',
    mode: 'rideshare',
    name: 'Rideshare Pickup',
    baseEtaMinutes: 8,
    frequency: 'on demand',
    accessible: false,
    note: 'Designated pickup at the South lot after the match.',
  },
  {
    id: 'city-bus-40',
    mode: 'bus',
    name: 'City Bus 40',
    baseEtaMinutes: 15,
    frequency: 'every 15 min',
    accessible: true,
    note: 'Stop is a 4-minute walk from Gate C (East).',
  },
];

export interface TransportOption {
  id: string;
  mode: TransportMode;
  name: string;
  etaMinutes: number;
  frequency: string;
  accessible: boolean;
  note: string;
}

export function getTransportOptions(): {
  options: TransportOption[];
  updatedAt: string;
} {
  const jitter = () =>
    config.nodeEnv === 'test' ? 0 : Math.round((Math.random() - 0.5) * 4);

  const options = OPTIONS.map((o) => ({
    id: o.id,
    mode: o.mode,
    name: o.name,
    etaMinutes: Math.max(1, o.baseEtaMinutes + jitter()),
    frequency: o.frequency,
    accessible: o.accessible,
    note: o.note,
  })).sort((a, b) => a.etaMinutes - b.etaMinutes);

  return { options, updatedAt: new Date().toISOString() };
}
