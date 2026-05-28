import { NextResponse } from "next/server";
import { getTraces } from "@/lib/agent-trace";
import { computeMetrics } from "@/lib/metrics";
import {
  getAutonomy,
  getEarnings,
  getLearning,
  getMetrics,
  getRail,
  getSessionId,
  setAutonomy,
  setMetrics,
  thresholdFor,
} from "@/lib/store";
import type { AutonomyLevel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const autonomy = getAutonomy();
  let metrics = getMetrics();
  if (!metrics) {
    metrics = computeMetrics();
    setMetrics(metrics);
  }
  return NextResponse.json({
    sessionId: getSessionId(),
    autonomy,
    intentThreshold: thresholdFor(autonomy),
    earnings: getEarnings(),
    metrics,
    learning: getLearning(),
    traces: getTraces(),
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
