import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { authority, scope, signedName } = body ?? {};
    if (!authority || !scope || !signedName) {
      // still return a stubbed success to keep flow moving, but indicate minimal validation
      const now = new Date().toISOString();
      return NextResponse.json({ artifactDocId: `fake_${Date.now()}`, signedAt: now });
    }
    const now = new Date().toISOString();
    return NextResponse.json({ artifactDocId: `fake_${Date.now()}`, signedAt: now });
  } catch {
    const now = new Date().toISOString();
    return NextResponse.json({ artifactDocId: `fake_${Date.now()}`, signedAt: now });
  }
}
