/** Languages offered to fans. The AI (Amazon Nova) responds in the selected
 * language, demonstrating multilingual assistance without per-string i18n. */
export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'Portuguese',
  'Arabic',
  'German',
  'Japanese',
  'Korean',
  'Hindi',
  'Mandarin Chinese',
] as const;

export type Language = (typeof LANGUAGES)[number];

/**
 * BCP-47 codes so assistant replies can carry a `lang` attribute — this lets
 * screen readers switch to the correct pronunciation for multilingual answers.
 */
export const LANGUAGE_CODES: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  Portuguese: 'pt',
  Arabic: 'ar',
  German: 'de',
  Japanese: 'ja',
  Korean: 'ko',
  Hindi: 'hi',
  'Mandarin Chinese': 'zh',
};

export function languageCode(language: string): string {
  return LANGUAGE_CODES[language] ?? 'en';
}
