import { NextResponse } from "next/server";
import {
  getAutonomy,
  getEarnings,
  getRail,
  getSessionId,
  setAutonomy,
  thresholdFor,
} from "@/lib/store";
import type { AutonomyLevel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const autonomy = getAutonomy();
  return NextResponse.json({
    sessionId: getSessionId(),
    autonomy,
    intentThreshold: thresholdFor(autonomy),
    earnings: getEarnings(),
    rail: getRail(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body?.autonomy) {
      setAutonomy(body.autonomy as AutonomyLevel);
    }
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  return NextResponse.json({
    autonomy: getAutonomy(),
    earnings: getEarnings(),
  });
}
