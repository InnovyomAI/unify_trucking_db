export const CA_CLASSES: Record<string, string[]> = {
  "CA-MB": ["1", "2", "3", "4", "5", "6"],
  "CA-ON": ["A", "B", "C", "D", "E", "F", "G", "M"],
  "CA-BC": ["1", "2", "3", "4", "5", "6", "7", "8"],
  "CA-AB": ["1", "2", "3", "4", "5", "6", "7"],
  "CA-SK": ["1", "2", "3", "4", "5", "6", "7"],
  "CA-QC": ["1", "2", "3", "4", "5", "6"],
  "CA-NB": ["1", "2", "3", "4", "5", "6", "7"],
  "CA-NL": ["1", "2", "3", "4", "5", "6"],
  "CA-NS": ["1", "2", "3", "4", "5", "6", "7"],
  "CA-PE": ["1", "2", "3", "4", "5"],
};

export function classesFor(jurisdiction: string): string[] {
  return CA_CLASSES[jurisdiction] ?? [];
}

