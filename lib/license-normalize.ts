// Normalize license strings for comparison & storage
// - Uppercase
// - Strip whitespace/dashes/._ characters
// - Replace O→0, I/L→1

export function normalizeLicense(jurisdiction: string, raw: string): string {
  const upper = (raw || "").toUpperCase();
  const replaced = upper
    .replace(/[\s\-._]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  // Include jurisdiction prefix to avoid cross-jurisdiction collisions
  const j = (jurisdiction || "").toUpperCase().trim();
  return `${j}:${replaced}`;
}

// Type helpers for consumers
export type NormalizedLicense = string;
export type LicenseCheckResult = { exists: boolean; claimable: boolean };
