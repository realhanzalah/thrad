import { NextResponse } from "next/server";
import { findOffer } from "@/lib/tavily";
import {
  findRailItemById,
  getSessionId,
  recordPlacement,
  updateRailItem,
  uuid,
} from "@/lib/store";
import type { Placement } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  railId?: string;
  action?: "approve" | "decline";
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const railId = body.railId;
  const action = body.action ?? "approve";
  if (!railId) {
    return NextResponse.json({ error: "railId required" }, { status: 400 });
  }

  const item = findRailItemById(railId);
  if (!item || item.kind !== "hold" || !item.pendingApproval) {
    return NextResponse.json({ error: "not pending" }, { status: 404 });
  }

  if (action === "decline") {
    const updated = updateRailItem(railId, {
      kind: "skip",
      pendingApproval: false,
      decision: item.decision
        ? { ...item.decision, decision: "skip", reason: "You chose not to show an ad." }
        : undefined,
    });
    return NextResponse.json({ railItem: updated });
  }

  const message = item.userMessage ?? "";
  const query = item.decision?.offer_query ?? message;
  let offer;
  try {
    offer = await findOffer(query, item.decision?.category ?? "general");
  } catch (err) {
    console.error("[monetize/confirm] Tavily failed", err);
    return NextResponse.json({ error: "Could not load product" }, { status: 503 });
  }

  const placement: Placement = {
    impressionId: uuid("imp"),
    clickId: uuid("clk"),
    sessionId: getSessionId(),
    turnId: item.turnId ?? uuid("turn"),
    prompt: message,
    offer,
    intentScore: item.decision?.intent_score ?? 0,
    reason: item.decision?.reason ?? "Approved by you.",
    ts: Date.now(),
  };
  recordPlacement(placement);

  const updated = updateRailItem(railId, {
    kind: "place",
    pendingApproval: false,
    placement,
    decision: item.decision
      ? { ...item.decision, decision: "place" }
      : undefined,
  });

  return NextResponse.json({ railItem: updated, placement });
}
