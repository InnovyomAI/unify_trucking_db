import { NextResponse } from "next/server";
import { normalizeLicense } from "@/lib/license-normalize";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { issuingJurisdiction, licenseNo } = body ?? {};
    const norm = normalizeLicense(issuingJurisdiction ?? "", licenseNo ?? "");
    const licenseNoNorm = norm.split(":")[1] ?? "";
    const exists = licenseNoNorm.endsWith("99");
    const claimable = exists; // simple stub rule for now
    return NextResponse.json({ exists, claimable });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
