import { randomUUID } from 'node:crypto';
import { redactPii } from '../utils/pii.js';

/**
 * Accessibility services directory + assistance request intake. Requests are
 * held in memory for the demo (would be persisted + dispatched in production).
 */
export interface AccessibilityService {
  id: string;
  name: string;
  description: string;
  zone: string;
}

const SERVICES: AccessibilityService[] = [
  {
    id: 'step-free',
    name: 'Step-free routes',
    description: 'Elevators near Gate C connect all concourse levels.',
    zone: 'Gate C',
  },
  {
    id: 'sensory-room',
    name: 'Sensory-friendly quiet room',
    description: 'Low-stimulation space for guests who need a break.',
    zone: 'Concourse Level 1',
  },
  {
    id: 'wheelchair',
    name: 'Wheelchair assistance',
    description: 'Request a staff escort or wheelchair from any information point.',
    zone: 'All gates',
  },
  {
    id: 'hearing-loop',
    name: 'Hearing loop & captions',
    description: 'Assistive listening and captioned screens available.',
    zone: 'All stands',
  },
];

export type AssistanceType = 'wheelchair' | 'sensory' | 'medical' | 'guide';

export interface AssistanceRequest {
  requestId: string;
  type: AssistanceType;
  zoneId: string;
  note?: string;
  status: 'received';
  etaMinutes: number;
  createdAt: string;
}

const requests = new Map<string, AssistanceRequest>();

export function getServices(): { services: AccessibilityService[] } {
  return { services: SERVICES };
}

export function requestAssistance(
  type: AssistanceType,
  zoneId: string,
  note?: string,
): AssistanceRequest {
  const request: AssistanceRequest = {
    requestId: randomUUID(),
    type,
    zoneId,
    // Redact any PII the fan may have typed into the free-text note.
    note: note ? redactPii(note) : undefined,
    status: 'received',
    etaMinutes: type === 'medical' ? 3 : 8,
    createdAt: new Date().toISOString(),
  };
  requests.set(request.requestId, request);
  return request;
}
