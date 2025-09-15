export function detectCA(postalRaw: string): { ok: boolean; normalized?: string; province?: string } {
  const s = postalRaw.toUpperCase().replace(/\s+/g, "");
  const re = /^[ABCEGHJ-NPRSTVXY]\d[A-Z]\d[A-Z]\d$/; // Canada Post
  if (!re.test(s)) return { ok: false };
  const norm = `${s.slice(0, 3)} ${s.slice(3)}`;
  const first = s.charAt(0);
  const PROV: Record<string, string> = {
    A: "NL",
    B: "NS",
    C: "PE",
    E: "NB",
    G: "QC",
    H: "QC",
    J: "QC",
    K: "ON",
    L: "ON",
    M: "ON",
    N: "ON",
    P: "ON",
    R: "MB",
    S: "SK",
    T: "AB",
    V: "BC",
    Y: "YT",
    X: "NT", // Note: NU also uses X
  };
  const province = PROV[first] ?? undefined;
  return { ok: true, normalized: norm, province };
}

export function isUSZip(raw: string) {
  return /^\d{5}(-\d{4})?$/.test(raw.trim());
}
