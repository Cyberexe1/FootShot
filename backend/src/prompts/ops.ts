import type { ZoneStatus } from '../services/crowd.service.js';
import type { Incident } from '../repositories/incidents.repo.js';

/**
 * Builds the operations decision-support prompt. The model receives a compact,
 * structured snapshot and must return a brief situation summary plus concrete,
 * prioritized recommended actions. No PII is included.
 */
export const OPS_SYSTEM_PROMPT = [
  'You are the operations decision-support assistant for a FIFA World Cup 2026 stadium.',
  'You help venue staff act quickly and safely.',
  'Given the current crowd density by zone and the list of open incidents, produce:',
  '1) A 1-2 sentence situation summary.',
  '2) A short, prioritized list of recommended actions (most urgent first).',
  'Be specific and reference zones by name. Focus on crowd safety, flow, and incident response.',
  'Do not invent data beyond what is provided. Keep it concise and actionable.',
].join('\n');

export function buildOpsUserMessage(
  zones: ZoneStatus[],
  incidents: Incident[],
): string {
  const zoneLines = zones
    .map(
      (z) =>
        `- ${z.name}: ${Math.round(z.density * 100)}% full (${z.level}), ${z.occupancy}/${z.capacity}`,
    )
    .join('\n');

  const openIncidents = incidents.filter((i) => i.status === 'open');
  const incidentLines = openIncidents.length
    ? openIncidents
        .map((i) => `- [${i.severity}] ${i.title}${i.zoneId ? ` (zone: ${i.zoneId})` : ''}`)
        .join('\n')
    : '- None';

  return [
    'CURRENT CROWD DENSITY:',
    zoneLines,
    '',
    'OPEN INCIDENTS:',
    incidentLines,
  ].join('\n');
}
