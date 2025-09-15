import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";

export function formatPhoneForDisplay(input: string, defaultCountry?: "CA" | "US") {
  const ayt = new AsYouType(defaultCountry);
  return ayt.input(input);
}
export function toE164(input: string, defaultCountry?: "CA" | "US") {
  const p = parsePhoneNumberFromString(input, defaultCountry);
  return p?.isValid() ? p.number : null; // E.164 or null
}

