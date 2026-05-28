import { NextResponse } from "next/server";
import { scoreAndDecide } from "@/lib/agent";
import { findOffer } from "@/lib/tavily";
import {
  addRailItem,
  getAutonomy,
  getSessionId,
  recordPlacement,
  uuid,
} from "@/lib/store";
import type { ChatResponse, Placement, RailItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let message = "";
  try {
    const body = await req.json();
    message = String(body?.message ?? "").slice(0, 2000);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!message.trim()) {
    return NextResponse.json({ error: "empty message" }, { status: 400 });
  }

  const autonomy = getAutonomy();
  const sessionId = getSessionId();
  const turnId = uuid("turn");

  let decision;
  try {
    decision = await scoreAndDecide(message, autonomy);
  } catch (err) {
    console.error("[chat] agent failed", err);
    decision = {
      intent_score: 0,
      category: "general" as const,
      monetizable: false,
      decision: "skip" as const,
      reason: "Agent hiccuped — answered without an ad.",
      offer_query: null,
      assistant_reply:
        "I'm having a brief technical issue, but I'm still here to help with cooking questions — try again in a moment.",
    };
  }

  let placement: Placement | undefined;
  let assistantReply = decision.assistant_reply;

  if (decision.decision === "place") {
    let offer;
    try {
      offer = await findOffer(decision.offer_query ?? message, decision.category);
    } catch (err) {
      console.error("[chat] Tavily failed", err);
      return NextResponse.json(
        {
          error: "Could not find a real product offer right now. Try again.",
        },
        { status: 503 },
      );
    }
    const impressionId = uuid("imp");
    const clickId = uuid("clk");
    placement = {
      impressionId,
      clickId,
      sessionId,
      turnId,
      prompt: message,
      offer,
      intentScore: decision.intent_score,
      reason: decision.reason,
      ts: Date.now(),
    };
    recordPlacement(placement);

    // Weave offer into reply (substitute placeholder or append naturally).
    if (offer.title) {
      if (assistantReply.includes("[PRODUCT_NAME]")) {
        assistantReply = assistantReply.replaceAll("[PRODUCT_NAME]", offer.title);
      } else {
        // Light append so we never lose the placement signal on stage.
        assistantReply = `${assistantReply}\n\nOne I'd actually point at: **${offer.title}**${
          offer.price ? ` (${offer.price})` : ""
        }${offer.merchant ? ` — ${offer.merchant}` : ""}.`;
      }
    }

    // Thrad "contents_viewed" event is fired client-side by the browser
    // once it receives this response (see Cockpit.tsx).
  } else {
    // Make sure assistantReply never leaks the placeholder.
    assistantReply = assistantReply.replace(/\[PRODUCT_NAME\]/g, "").trim();
  }

  const railItem: RailItem = {
    id: uuid("rail"),
    kind:
      decision.decision === "place"
        ? "place"
        : decision.decision === "hold"
          ? "hold"
          : "skip",
    ts: Date.now(),
    turnId,
    userMessage: message,
    decision,
    placement,
    pendingApproval: decision.decision === "hold",
  };
  addRailItem(railItem);

  const resp: ChatResponse = {
    turnId,
    assistantReply,
    decision,
    placement,
    railItem,
  };
  return NextResponse.json(resp);
}
