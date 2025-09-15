export type PassportPattern = {
  re: RegExp;
  maxLen?: number;
  minLen?: number;
  hint: string;
};

// Canonical normalizer: uppercase and strip spaces/hyphens/dots
export function canon(s: string): string {
  return (s || "").toUpperCase().replace(/[\s\-.]/g, "");
}

// Country-specific patterns (initial coverage + expand as needed)
export const PASSPORT: Record<string, PassportPattern> = {
  CA: { re: /^[A-Z]{2}\d{6}$/, minLen: 8, maxLen: 8, hint: "AA123456" },
  US: { re: /^([A-Z]\d{8}|\d{9})$/, minLen: 9, maxLen: 9, hint: "A12345678 or 123456789" },
  IN: { re: /^[A-Z]\d{7}$/, minLen: 8, maxLen: 8, hint: "A1234567" },
  PH: { re: /^([A-Z]\d{6}|[A-Z]{2}\d{6,7}|[A-Z]\d{7}[A-Z])$/, minLen: 7, maxLen: 9, hint: "P1234567 / AB123456 / AB1234567" },
  GB: { re: /^\d{9}$/, minLen: 9, maxLen: 9, hint: "123456789" },
  PK: { re: /^[A-Z]{2}\d{7}$/, minLen: 9, maxLen: 9, hint: "AB1234567" },
  BD: { re: /^[A-Z]\d{7}$/, minLen: 8, maxLen: 8, hint: "A1234567" },
  NG: { re: /^[A-Z]\d{8}$/, minLen: 9, maxLen: 9, hint: "A12345678" },
  CN: { re: /^[EGDSP]\d{8}$/, minLen: 9, maxLen: 9, hint: "E12345678" },
  MX: { re: /^[A-Z]\d{8}$/, minLen: 9, maxLen: 9, hint: "A12345678" },
};

// Fallback for countries without a specific rule: 6–10 alphanumerics
export const FALLBACK: PassportPattern = {
  re: /^[A-Z0-9]{6,10}$/,
  minLen: 6,
  maxLen: 10,
  hint: "6–10 letters/digits",
};

