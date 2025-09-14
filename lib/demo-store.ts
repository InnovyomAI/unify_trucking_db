// lib/demo-store.ts
export type DriverSnapshot = {
  qrid: string;
  name: string;
  jurisdiction: string;
  licenseNo: string;
  licenseClass: string;
  licenseExpiry: string;
  issuedAt: string; // ISO
};

const KEY = (id: string) => `qr:${id}`;

export function saveSnapshot(s: DriverSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(s.qrid), JSON.stringify(s));
  } catch {}
}

export function loadSnapshot(qrid: string): DriverSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY(qrid));
    if (!raw) return null;
    return JSON.parse(raw) as DriverSnapshot;
  } catch {
    return null;
  }
}

