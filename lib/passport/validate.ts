import { canon, PASSPORT, FALLBACK, type PassportPattern } from "./patterns";
import { isCountry } from "@/lib/countries";

/**
 * Return the passport pattern metadata for a given ISO2 country code.
 * Falls back to a sensible generic pattern (6–10 alnum) if unknown.
 */
export function passportPatternFor(country?: string): PassportPattern {
  const code = (country || "").toUpperCase();
  if (!isCountry(code)) return FALLBACK;
  return PASSPORT[code] ?? FALLBACK;
}

/**
 * Validate a passport number against a country's known pattern.
 * Uses canonicalized (uppercase, alnum-only) value.
 */
export function isValidPassport(country: string | undefined, value: string): boolean {
  const pat = passportPatternFor(country);
  return pat.re.test(canon(value));
}

/**
 * Normalize a passport number for storage/compare:
 * - Uppercase
 * - Strip all non A–Z / 0–9
 */
export function normalizePassport(value: string): string {
  return canon(value);
}

/**
 * Sanitize user input for a given country while typing:
 * - Uppercase alnum only
 * - Clip to country-specific maxLen when provided
 */
export function sanitizePassportInput(value: string, country?: string): string {
  const pat = passportPatternFor(country);
  let v = canon(value);
  if (typeof pat.maxLen === "number" && pat.maxLen > 0) {
    v = v.slice(0, pat.maxLen);
  }
  return v;
}

/**
 * Convenience: get a friendly hint string for the given country.
 * Falls back to generic text.
 */
export function passportHint(country?: string): string {
  const pat = passportPatternFor(country);
  return pat.hint || "6–10 letters/digits";
}
