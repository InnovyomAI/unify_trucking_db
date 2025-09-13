export const JURISDICTIONS = [
  "CA-MB",
  "CA-ON",
  "CA-BC",
  "CA-AB",
  "CA-SK",
  "CA-QC",
  "CA-NS",
  "CA-NB",
  "CA-NL",
  "CA-PE",
  "CA-NT",
  "CA-NU",
  "CA-YT",
  "US-CA",
  "US-NY",
  "US-TX",
  "US-IL",
  "US-FL",
  "US-WA",
  "US-NJ",
  "US-PA",
  "US-MI",
  "US-OH",
] as const;

export const COUNTRIES = ["Canada", "United States", "Other"] as const;

export type Jurisdiction = typeof JURISDICTIONS[number];
export type Country = typeof COUNTRIES[number];

