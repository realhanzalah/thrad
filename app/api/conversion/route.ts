import { NextResponse } from "next/server";
import { cleanSignals, scoreConversionTrust, suspiciousSignals } from "@/lib/audit";
import {
  addRailItem,
  findRailItemByClickId,
  getSessionId,
  placementByClickId,
  recordConversion,
  updateRailItem,
  uuid,
} from "@/lib/store";
import type { Conversion, RailItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  clickId?: string;
  value?: number;
  mode?: "clean" | "suspicious";
};

// Yield's back-gate audit. The client fires the actual Thrad "conversion"
// event only after this endpoint clears it (clean → fire now; held → wait
// for /api/audit/confirm).
export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const clickId = body.clickId;
  if (!clickId) {
    return NextResponse.json({ error: "clickId required" }, { status: 400 });
  }
  const placement = placementByClickId(clickId);
  if (!placement) {
    return NextResponse.json({ error: "unknown clickId" }, { status: 404 });
  }

  const value = body.value ?? Math.round((20 + Math.random() * 40) * 100) / 100;
  const signals =
    body.mode === "suspicious" ? suspiciousSignals() : cleanSignals();
  const audit = scoreConversionTrust(signals, placement, value);

  const conversion: Conversion = {
    conversionId: uuid("conv"),
    clickId,
    sessionId: getSessionId(),
    value,
    currency: "GBP",
    signals,
    auditStatus: audit.status,
    heldReasons: audit.reasons,
    ts: Date.now(),
  };
  recordConversion(conversion);

  // Expand the originating rail item with the conversion (attribution view).
  const originating = findRailItemByClickId(clickId);
  if (originating) {
    updateRailItem(originating.id, { conversion });
  }

  // Surface either an audit card or a conversion card at the top of the rail.
  const item: RailItem = {
    id: uuid("rail"),
    kind: conversion.auditStatus === "held_for_review" ? "audit" : "conversion",
    ts: Date.now(),
    conversion,
    placement,
  };
  addRailItem(item);

  return NextResponse.json({ conversion });
}
