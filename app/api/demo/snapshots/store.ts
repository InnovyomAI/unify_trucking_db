// Simple in-memory snapshot store with TTL.
// ⚠️ Resets on server restart; good for demos.
export type DriverSnapshot = {
  qrid: string;
  name: string;
  jurisdiction: string;
  licenseNo: string;
  licenseClass: string;
  licenseExpiry: string;
  issuedAt: string; // ISO string
};

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const snapshots = new Map<string, { data: DriverSnapshot; expiresAt: number }>();

function cleanup() {
  const now = Date.now();
  for (const [k, v] of snapshots) if (v.expiresAt <= now) snapshots.delete(k);
}

export function setSnapshot(s: DriverSnapshot, ttlMs = TTL_MS) {
  cleanup();
  snapshots.set(s.qrid, { data: s, expiresAt: Date.now() + ttlMs });
}

export function getSnapshot(qrid: string): DriverSnapshot | null {
  cleanup();
  const hit = snapshots.get(qrid);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    snapshots.delete(qrid);
    return null;
  }
  return hit.data;
}

