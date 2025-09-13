import { parsePhoneNumberFromString } from "libphonenumber-js";

export function toE164(input: string): string | null {
  if (!input) return null;
  try {
    const pn = parsePhoneNumberFromString(input);
    if (pn && pn.isValid()) {
      return pn.number; // E.164 format
    }
  } catch {
    // ignore
  }
  return null;
}
