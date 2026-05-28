import { NextResponse } from "next/server";
import {
  billHeldConversion,
  rejectHeldConversion,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  conversionId?: string;
  action?: "confirm" | "reject";
};

// Human-in-the-loop confirmation for a held conversion. The browser fires
// the actual Thrad "conversion" tag event after we return ok=true.
export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const id = body.conversionId;
  const action = body.action ?? "confirm";
  if (!id) {
    return NextResponse.json({ error: "conversionId required" }, { status: 400 });
  }
  if (action === "reject") {
    const c = rejectHeldConversion(id);
    if (!c) {
      return NextResponse.json({ error: "unknown conversion" }, { status: 404 });
    }
    return NextResponse.json({ conversion: c });
  }
  const c = billHeldConversion(id);
  if (!c) {
    return NextResponse.json({ error: "unknown conversion" }, { status: 404 });
  }
  return NextResponse.json({ conversion: c });
}
