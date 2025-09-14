import QRCode from "qrcode";

// Now the QR encodes only a version + a URL with a random qrid.
// No licence, no jurisdiction, no PII.
export function buildQrPayload(input: { qrid: string; origin?: string }) {
  const origin =
    input.origin ?? (typeof window !== "undefined" ? window.location.origin : "https://example.org");
  return {
    v: 1,
    url: `${origin}/v/${input.qrid}`,
  };
}

export async function makeQrPng(payload: object) {
  return QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 6,
  });
}
