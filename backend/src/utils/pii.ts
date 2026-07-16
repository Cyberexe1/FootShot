/**
 * Best-effort PII redaction applied to user input BEFORE it is sent to the AI
 * model. This is a defense-in-depth measure — not a substitute for not
 * collecting PII in the first place. Redacts common patterns: emails, phone
 * numbers, credit-card-like sequences, and long numeric IDs (e.g. tickets).
 */
const PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: '[EMAIL]', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  // Credit-card-like: 13-16 digits, optionally separated by spaces/dashes.
  { label: '[CARD]', regex: /\b(?:\d[ -]?){13,16}\b/g },
  // Long contiguous numeric IDs (7+ digits) e.g. ticket/booking numbers.
  // Checked before phone so unformatted ID runs are labelled as IDs.
  { label: '[ID]', regex: /\b\d{7,}\b/g },
  // Phone numbers (loose international/US formats with separators).
  { label: '[PHONE]', regex: /\+?\d{1,3}[-.\s]\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g },
];

export function redactPii(input: string): string {
  let output = input;
  for (const { label, regex } of PATTERNS) {
    output = output.replace(regex, label);
  }
  return output;
}
