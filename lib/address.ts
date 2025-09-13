export function regionLabelForCountry(country: string): "Province" | "State" | "Region/State" {
  if (country === "Canada") return "Province";
  if (country === "United States") return "State";
  return "Region/State";
}

const ca = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
const us = /^\d{5}(-\d{4})?$/;

export function normalizePostal(country: string, raw: string) {
  if (country === "Canada")
    return raw
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/^(.{3})(.*)$/, "$1 $2");
  return raw.trim();
}

export function validatePostal(country: string, value: string) {
  if (country === "Canada") return ca.test(value.replace(/\s+/g, ""));
  if (country === "United States") return us.test(value);
  return value.trim().length >= 2; // minimal fallback
}
