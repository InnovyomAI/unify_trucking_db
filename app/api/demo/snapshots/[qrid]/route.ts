import { NextRequest, NextResponse } from "next/server";
import { getSnapshot } from "../store";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ qrid: string }> }) {
  const { qrid } = await ctx.params;
  const s = getSnapshot(qrid);
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
  return NextResponse.json(s, { headers: noStore });
}

export async function HEAD(_req: NextRequest, ctx: { params: Promise<{ qrid: string }> }) {
  const { qrid } = await ctx.params;
  const s = getSnapshot(qrid);
  return new Response(null, { status: s ? 200 : 404, headers: noStore });
}

const noStore = { "Cache-Control": "no-store" } as const;
