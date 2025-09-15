// Country-specific passport patterns (minimal set + safe fallback).
// Sources: IRCC + US State Dept + Microsoft Purview + Indian/PH refs.
// CA: two letters + six digits. US: letter + 8 digits (NGP) OR 9 digits (older).
// IN: 1 letter + 7 digits. PH: variants. GB: commonly 9 digits.

export function normalizePassportNo(raw: string) {
  return (raw || "").toUpperCase().replace(/\s+/g, "");
}

export function passportHint(code?: string) {
  switch (code) {
    case "CA":
      return "AA123456";
    case "US":
      return "A12345678 or 123456789";
    case "IN":
      return "A1234567";
    case "PH":
      return "P1234567 or AB1234567";
    case "GB":
      return "123456789";
    default:
      return "6–10 letters/digits";
  }
}

export function isValidPassport(code: string | undefined, value: string): boolean {
  const v = normalizePassportNo(value);
  if (!code) return /^[A-Z0-9]{6,10}$/.test(v);
  switch (code) {
    case "CA":
      return /^[A-Z]{2}\d{6}$/.test(v);
    case "US":
      return /^[A-Z]\d{8}$/.test(v) || /^\d{9}$/.test(v);
    case "IN":
      return /^[A-Z]\d{7}$/.test(v);
    case "PH":
      return /^[A-Z]\d{6}$/.test(v) || /^[A-Z]{2}\d{6,7}$/.test(v) || /^[A-Z]\d{7}[A-Z]$/.test(v);
    case "GB":
      return /^\d{9}$/.test(v);
    default:
      return /^[A-Z0-9]{6,10}$/.test(v);
  }
}

