import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

// Workaround: i18n-iso-countries expects a locale object shape
type LocaleData = { locale: string; countries: Record<string, string> };
countries.registerLocale(en as unknown as LocaleData);

export type Country = { code: string; name: string };

/**
 * Return all countries with ISO alpha-2 code and English official name.
 * Sorted alphabetically by name.
 */
export function allCountries(): Country[] {
  const names = countries.getNames("en", { select: "official" }) as Record<
    string,
    string
  >;

  return Object.entries(names)
    .map(([code, name]) => ({
      code: code.toUpperCase(),
      name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check if a given code is a valid ISO alpha-2 country code.
 */
export function isCountry(code?: string): boolean {
  if (!code) return false;
  const c = code.toUpperCase();
  try {
    return Boolean(countries.alpha2ToNumeric(c));
  } catch {
    return false;
  }
}
