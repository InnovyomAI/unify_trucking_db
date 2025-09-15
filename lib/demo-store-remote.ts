// lib/demo-store-remote.ts (DriverSnapshot type)
// lib/demo-store-remote.ts

export type DriverSnapshot = {
  qrid: string;
  pinHash: string;

  // Identity
  name: string;
  dob: string;
  gender?: string;
  citizenship: string;
  residencyCA: string;

  // Licence
  jurisdiction: string;
  licenseNo: string;
  licenseClass: string;
  licenseExpiry: string;

  // Contact
  email: string;
  phone: string;

  // Address
  postal?: string;
  country?: string;
  region?: string;
  city?: string;
  address1?: string;
  address2?: string;

  // Status
  prNumber?: string;
  permitType?: string;
  uci?: string;
  permitExpiry?: string;

  // Passport
  passportCountry?: string;
  passportNumber?: string;

  // Languages
  englishLevel: string;
  otherLanguages?: { language: string; level: string }[];

  // Work experience
  work?: { company: string; role: string; start: string; end: string }[];

  // Consents
  consentName: string;
  consentDate: string;
  consentAbstract: boolean;
  certifyAccurate: boolean;

  // Metadata
  issuedAt: string;
};



export async function saveSnapshotRemote(s: DriverSnapshot): Promise<void> {
  const res = await fetch("/api/demo/snapshots", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(s),
    cache: "no-store",
  });
  if (!res.ok) {
    const j: unknown = await res.json().catch(() => null as unknown);
    const msg = getErrorMessage(j) ?? `Failed to save snapshot (${res.status})`;
    throw new Error(msg);
  }
}

export async function loadSnapshotRemote(qrid: string): Promise<DriverSnapshot | null> {
  const res = await fetch(`/api/demo/snapshots/${encodeURIComponent(qrid)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return (await res.json()) as DriverSnapshot;
}

function getErrorMessage(x: unknown): string | null {
  if (!x || typeof x !== "object") return null;
  const rec = x as Record<string, unknown>;
  const e = rec["error"];
  return typeof e === "string" ? e : null;
}
