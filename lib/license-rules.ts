// Patterns derived from Microsoft Purview (2024-08-19) + ICBC 8-digit update.
// https://learn.microsoft.com/en-us/purview/sit-defn-canada-drivers-license-number
// https://www.icbc.com/about-icbc/newsroom/2023-feb06-DLnumbers
type Rule = {
  // Replace typed letters/digits with mask (we add hyphens/spaces)
  format: (raw: string) => string;
  // Acceptable normalized pattern (strip hyphens/spaces before testing)
  test: (normalized: string) => boolean;
};

function onlyAZ09(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function stripSep(s: string) {
  return s.replace(/[\s-]/g, "");
}
// chunk helper was used in previous rules; removed after MB rule update

export const caRules: Record<string, Rule> = {
  // Alberta: 6 digits - 3 digits OR 5-9 digits (Purview). We'll normalize to 9 digits or 6-3 display.
  "CA-AB": {
    format: (raw) => {
      const s = raw.replace(/\D/g, "").slice(0, 9);
      return s.length > 6 ? `${s.slice(0, 6)}-${s.slice(6)}` : s;
    },
    test: (n) => /^\d{9}$/.test(n) || /^\d{5,9}$/.test(n),
  },
  // BC: historically 7 digits; since 2023, 8 digits permitted.
  "CA-BC": {
    format: (raw) => raw.replace(/\D/g, "").slice(0, 8),
    test: (n) => /^\d{7,8}$/.test(n),
  },
  // CA-MB: display as 2-2-2-6 (e.g., DA-GG-UV-S057NT), store alnum only (12 chars typical).
  "CA-MB": {
    format: (raw) => {
      const s = onlyAZ09(raw).slice(0, 12);
      // group 2-2-2-6
      if (!s) return "";
      const a = s.slice(0, 2),
        b = s.slice(2, 4),
        c = s.slice(4, 6),
        d = s.slice(6);
      return [a, b, c, d].filter(Boolean).join("-");
    },
    // Canonical 12 alphanumerics
    test: (n) => /^[A-Z0-9]{12}$/.test(n),
  },
  // New Brunswick: 5–7 digits
  "CA-NB": { format: (r) => r.replace(/\D/g, "").slice(0, 7), test: (n) => /^\d{5,7}$/.test(n) },
  // Newfoundland & Labrador: 1 letter + 9 digits
  "CA-NL": {
    format: (raw) => {
      const s = onlyAZ09(raw);
      return (s.slice(0, 1) + s.slice(1, 10)).toUpperCase();
    },
    test: (n) => /^[A-Z]\d{9}$/.test(n),
  },
  // Nova Scotia: Purview shows letter-heavy pattern; accept 14-char mixed alnum.
  "CA-NS": {
    format: (raw) => onlyAZ09(raw).slice(0, 14),
    test: (n) => /^[A-Z0-9]{6,14}$/.test(n),
  },
  // Ontario: letter + 4 digits + 5 digits + 5 digits (display with hyphens)
  "CA-ON": {
    format: (raw) => {
      const s = onlyAZ09(raw).slice(0, 14); // A#### ##### #####
      const a = s.slice(0, 1),
        b = s.slice(1, 5),
        c = s.slice(5, 10),
        d = s.slice(10, 15);
      return [a + b, c, d].filter(Boolean).join("-");
    },
    test: (n) => /^[A-Z]\d{14}$/.test(n),
  },
  // Prince Edward Island: 5–6 digits
  "CA-PE": { format: (r) => r.replace(/\D/g, "").slice(0, 6), test: (n) => /^\d{5,6}$/.test(n) },
  // Quebec: 1 letter + 12 digits
  "CA-QC": {
    format: (raw) => {
      const s = onlyAZ09(raw);
      return (s.slice(0, 1) + s.slice(1, 13)).toUpperCase();
    },
    test: (n) => /^[A-Z]\d{12}$/.test(n),
  },
  // Saskatchewan: 8 digits
  "CA-SK": { format: (r) => r.replace(/\D/g, "").slice(0, 8), test: (n) => /^\d{8}$/.test(n) },
  // Territories & others (fallback): allow 5–15 alphanumerics
  "CA-DEFAULT": { format: (r) => onlyAZ09(r).slice(0, 15), test: (n) => /^[A-Z0-9]{5,15}$/.test(n) },
};

export function formatLicence(jurisdiction: string, input: string) {
  const fallback = caRules["CA-DEFAULT"] as Rule;
  const rule = (caRules[jurisdiction] ?? fallback) as Rule;
  return rule.format(input);
}
export function isValidLicence(jurisdiction: string, input: string) {
  const fallback = caRules["CA-DEFAULT"] as Rule;
  const rule = (caRules[jurisdiction] ?? fallback) as Rule;
  return rule.test(stripSep(input.toUpperCase()));
}
export function normalizedLicence(input: string) {
  return stripSep(input.toUpperCase());
}
