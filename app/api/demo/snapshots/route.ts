import { NextRequest, NextResponse } from "next/server";
import { setSnapshot, type DriverSnapshot } from "./store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DriverSnapshot>;
    const required = [
      "qrid",
      "name",
      "jurisdiction",
      "licenseNo",
      "licenseClass",
      "licenseExpiry",
      "issuedAt",
    ] as const;
    for (const k of required) {
      if (!body[k] || typeof body[k] !== "string") {
        return NextResponse.json({ error: `Missing or invalid ${k}` }, { status: 400, headers: noStore });
      }
    }
    setSnapshot(body as DriverSnapshot);
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400, headers: noStore });
  }
}

const noStore = { "Cache-Control": "no-store" } as const;
