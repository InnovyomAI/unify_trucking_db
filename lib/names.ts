export function titleCaseName(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\b[\p{L}\p{M}]+/gu, (w) => (w[0]?.toUpperCase() ?? "") + w.slice(1));
}
export function canonicalKey(s: string) {
  // Uppercase, strip diacritics, collapse spaces
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

