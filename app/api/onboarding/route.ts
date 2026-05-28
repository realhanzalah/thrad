import { NextResponse } from "next/server";
import { getProfile, setProfile, setAutonomy } from "@/lib/store";
import type { AutonomyLevel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ profile: getProfile() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const monthlyBudgetGbp = Math.max(
      50,
      Math.min(100_000, Number(body?.monthlyBudgetGbp) || 500),
    );
    const autonomy = (body?.autonomy as AutonomyLevel) || "balanced";
    setProfile({
      onboarded: true,
      monthlyBudgetGbp,
      autonomy,
    });
    setAutonomy(autonomy);
    return NextResponse.json({ profile: getProfile() });
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
}
