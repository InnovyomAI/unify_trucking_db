import ISO6391 from "iso-639-1";

export type Lang = { code: string; name: string };

/**
 * Return all ISO-639-1 languages with display names.
 * - Codes are lowercase (e.g., "en", "pa").
 * - Filters out entries without a readable name.
 * - Sorted alphabetically by name.
 */
export function allLanguages(): Lang[] {
  const codes = ISO6391.getAllCodes() as string[];
  const rows = codes
    .map((code) => {
      const name = ISO6391.getName(code);
      return { code: code.toLowerCase(), name };
    })
    .filter((l) => Boolean(l.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

/** Quick validator for ISO-639-1 language codes */
export function isLanguage(code?: string): boolean {
  return Boolean(code && ISO6391.validate(code.toLowerCase()));
}

/** Optional: handy map for O(1) lookups by code */
export function languagesMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { code, name } of allLanguages()) map[code] = name;
  return map;
}
