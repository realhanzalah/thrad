import { NextResponse } from "next/server";
import { placementByClickId } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The browser fires the actual Thrad "items_added" tag event for the click.
// This endpoint just validates and acknowledges the click for our own
// attribution store.
export async function POST(req: Request) {
  let clickId = "";
  try {
    const body = await req.json();
    clickId = String(body?.clickId ?? "");
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!clickId) {
    return NextResponse.json({ error: "clickId required" }, { status: 400 });
  }
  const placement = placementByClickId(clickId);
  if (!placement) {
    return NextResponse.json({ error: "unknown clickId" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, clickId, impressionId: placement.impressionId });
}
