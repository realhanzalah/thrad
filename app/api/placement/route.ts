import { NextResponse } from "next/server";
import { conversionForClick, placementByClickId } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clickId = new URL(req.url).searchParams.get("clickId");
  if (!clickId) {
    return NextResponse.json({ error: "clickId required" }, { status: 400 });
  }
  const placement = placementByClickId(clickId);
  if (!placement) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const existing = conversionForClick(clickId);
  return NextResponse.json({
    placement,
    alreadyConverted: !!existing,
    conversion: existing,
  });
}
