// lib/security.ts
import { createHash } from "crypto";

/**
 * Hashes a PIN securely using SHA-256.
 * (For real production, use bcrypt or argon2 with salt.)
 */
export function hashPin(pin: string): string {
  if (!pin) return "";
  return createHash("sha256").update(pin).digest("hex");
}

/**
 * Verify a PIN against stored hash.
 */
export function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash;
}
