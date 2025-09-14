// lib/ocr/parse.ts
export type ExtractedFields = {
  legalName?: string;
  licenseNo?: string;
  dob?: string;            // normalized YYYY-MM-DD
  licenseExpiry?: string;  // normalized YYYY-MM-DD
  issuingAuthority?: string;
  rawText: string;
};

// Patterns for common labels & formats (EN/FR friendly)
const DATE_ANY = /(\d{4}[\/\-.](?:0[1-9]|1[0-2])[\/\-.](?:0[1-9]|[12]\d|3[01])|(?:0[1-9]|1[0-2])[\/\-.](?:0[1-9]|[12]\d|3[01])[\/\-.]\d{2,4}|(?:0[1-9]|[12]\d|3[01])[\/\-.](?:0[1-9]|1[0-2])[\/\-.]\d{2,4})/i;
const EXP   = /(?:EXP|Expires|Expiry|Expiration|Expire\s?le)\s*[:\-]?\s*([^\s,]+)/i;
const LIC   = /(?:DL|LIC|Licence|License|Num[eé]ro|No\.?|N[oº]\.?)\s*[:#\-]?\s*([A-Z0-9\-]{5,})/i;
const AUTH  = /(Manitoba|Ontario|Saskatchewan|Alberta|British Columbia|Quebec|Nova Scotia|New Brunswick|Newfoundland|Prince Edward Island|Yukon|Nunavut|Northwest Territories|California|New York|Texas|Florida|Washington|State of [A-Z][a-z]+|Province of [A-Z][a-z]+)/i;

function normDate(s?: string): string | undefined {
  if (!s) return;
  if (/^\d{4}[\/\-.]\d{2}[\/\-.]\d{2}$/.test(s)) return s.replace(/[\/.]/g, "-");
  const mdy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (mdy) {
    const mm = mdy[1] ?? "";
    const dd = mdy[2] ?? "";
    const yy = mdy[3] ?? "";
    const y = yy.length === 2 ? (Number(yy) > 30 ? "19"+yy : "20"+yy) : yy;
    return `${(y ?? "").padStart(4,"0")}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
  }
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) return s; // already handled by mdy; keep as fallback
  return s;
}

function guessName(lines: string[]) {
  const labelish = /(License|Licence|DL|Class|DOB|Birth|Expiry|Expires|Sex|Gender|Address|Num|No\.)/i;
  const clean = lines.map(l => l.trim()).filter(Boolean);
  const isCapsish = (s: string) => s.replace(/[^A-Z\s\-']/g, "").length / Math.max(1, s.length) > 0.6;
  for (let i = 0; i < clean.length - 1; i++) {
    const a = clean[i] ?? "";
    const b = clean[i + 1] ?? "";
    if (!labelish.test(a) && !labelish.test(b) && isCapsish(a) && isCapsish(b)) {
      return `${a} ${b}`.replace(/\s+/g, " ").trim();
    }
  }
  return clean.find(l => !labelish.test(l) && l.length > 3);
}

export function parseFields(rawText: string): ExtractedFields {
  const text = rawText.replace(/\s{2,}/g, " ").trim();
  const lines = rawText.split(/\r?\n/);

  const dobLabeled = text.match(/(?:DOB|Birth|N[eé]\s?le|Date of Birth|Naissance)\s*[:\-]?\s*([^\s,]+)/i)?.[1];
  const dobFree    = text.match(DATE_ANY)?.[1];
  const dob        = normDate(dobLabeled || dobFree);

  const licenseExpiry = normDate(text.match(EXP)?.[1]);
  const licenseNo     = text.match(LIC)?.[1]?.replace(/[^A-Z0-9]/gi, "");
  const issuingAuthority = text.match(AUTH)?.[1];

  const legalName = guessName(lines);

  return { legalName, licenseNo, dob, licenseExpiry, issuingAuthority, rawText };
}
