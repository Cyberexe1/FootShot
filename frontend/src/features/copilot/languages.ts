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
