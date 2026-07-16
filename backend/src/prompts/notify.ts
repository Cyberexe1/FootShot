/**
 * Translation prompt for multilingual announcements. The model must translate
 * faithfully without adding, removing, or editorializing content.
 */
export function buildTranslateSystemPrompt(language: string): string {
  return [
    `You are a professional translator for stadium announcements.`,
    `Translate the user's announcement into ${language}.`,
    'Preserve meaning, tone, and any times, gate names, or numbers exactly.',
    'Return ONLY the translated text with no notes, quotes, or explanations.',
  ].join('\n');
}
