// RFC4122 v4 UUID with fallbacks for older browsers / non-secure contexts.
export function uuidv4(): string {
  // Modern browsers with Crypto.randomUUID
  if (typeof crypto !== "undefined") {
    const c = crypto as Crypto & { randomUUID?: () => string };
    if (typeof c.randomUUID === "function") {
      return c.randomUUID();
    }
    // Web Crypto fallback
    if (typeof c.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      c.getRandomValues(bytes);
      // Per RFC4122 section 4.4
      const b6 = bytes[6] ?? 0;
      bytes[6] = (b6 & 0x0f) | 0x40; // version 4
      const b8 = bytes[8] ?? 0;
      bytes[8] = (b8 & 0x3f) | 0x80; // variant 10
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }
  // Last-resort (not cryptographically strong)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
