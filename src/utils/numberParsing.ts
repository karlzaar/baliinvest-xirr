/**
 * Parse a decimal number from user input, supporting both period (.) and comma (,)
 * as decimal separators. This enables European-style decimal input (e.g., "50,9" for 50.9).
 *
 * @param value - The input string to parse
 * @returns The parsed number, or NaN if invalid
 */
export function parseDecimalInput(value: string): number {
  // Remove any whitespace
  const trimmed = value.trim();

  // Replace comma with period to normalize decimal separator
  // This converts "50,9" to "50.9"
  const normalized = trimmed.replace(',', '.');

  // Remove any characters except digits and periods
  const cleaned = normalized.replace(/[^0-9.]/g, '');

  return parseFloat(cleaned);
}

/**
 * Sanitize decimal input to only allow valid characters (digits, period, comma).
 * Used for controlled inputs that need to show the user's input while typing.
 *
 * @param value - The input string to sanitize
 * @returns The sanitized string with only valid decimal characters
 */
export function sanitizeDecimalInput(value: string): string {
  // Allow digits, period, and comma
  return value.replace(/[^0-9.,]/g, '');
}
