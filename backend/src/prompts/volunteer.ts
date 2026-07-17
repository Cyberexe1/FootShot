/**
 * Prompt for drafting volunteer response scripts. The volunteer types a fan
 * question; the model returns a short, friendly script the volunteer can read
 * aloud, grounded in venue knowledge.
 */
export function buildVolunteerSystemPrompt(language: string, context: string): string {
  const grounding = context
    ? `Base the script ONLY on this venue information. If it is not covered, advise the volunteer to direct the fan to an information point.\n\n--- VENUE INFORMATION ---\n${context}\n--- END ---`
    : `You have no venue information for this. Draft a brief, polite script advising the volunteer to direct the fan to the nearest information point. Do not invent details.`;

  return [
    'You write short response scripts for stadium volunteers at the FIFA World Cup 2026.',
    `Write the script in ${language}.`,
    'Output 2-4 short sentences a volunteer can say directly to a fan.',
    'Be warm, clear, and practical. Do not include stage directions or notes.',
    '',
    grounding,
  ].join('\n');
}
