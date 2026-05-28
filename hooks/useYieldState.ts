"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AgentTrace,
  AutonomyLevel,
  BusinessMetrics,
  Conversion,
  LearningState,
  RailItem,
} from "@/lib/types";
import { thradConversion, thradEvent } from "@/lib/thrad";

type Earnings = { totalGbp: number; pendingGbp: number };

export function useYieldState() {
  const [rail, setRail] = useState<RailItem[]>([]);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [learning, setLearning] = useState<LearningState | null>(null);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>("balanced");
  const [threshold, setThreshold] = useState(65);
  const [earnings, setEarnings] = useState<Earnings>({ totalGbp: 0, pendingGbp: 0 });
  const [pulse, setPulse] = useState(false);
  const prevTotal = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setRail(data.rail);
      setTraces(data.traces ?? []);
      setMetrics(data.metrics ?? null);
      setLearning(data.learning ?? null);
      setAutonomy(data.autonomy);
      setThreshold(data.intentThreshold ?? 65);
      setEarnings(data.earnings);
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (earnings.totalGbp > prevTotal.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      prevTotal.current = earnings.totalGbp;
      return () => clearTimeout(t);
    }
    prevTotal.current = earnings.totalGbp;
  }, [earnings.totalGbp]);

  const setStrictness = async (level: AutonomyLevel) => {
    setAutonomy(level);
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autonomy: level }),
    }).catch(() => {});
    await refresh();
  };

  const monetizeDecision = async (railId: string, action: "approve" | "decline") => {
    const r = await fetch("/api/monetize/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ railId, action }),
    });
    const data = await r.json();
    if (action === "approve" && data.placement) {
      thradEvent("contents_viewed", {
        content_id: data.placement.offer.url,
        impression_id: data.placement.impressionId,
        click_id: data.placement.clickId,
        session_id: data.placement.sessionId,
      });
    }
    await refresh();
  };

  const saleDecision = async (conversionId: string, action: "confirm" | "reject") => {
    const r = await fetch("/api/audit/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversionId, action }),
    });
    const data = (await r.json()) as { conversion?: Conversion };
    if (action === "confirm" && data.conversion?.auditStatus === "human_confirmed") {
      thradConversion({
        order_id: data.conversion.conversionId,
        value: data.conversion.value,
        currency: data.conversion.currency,
        click_id: data.conversion.clickId,
      });
    }
    await refresh();
  };

  const simulateFlaggedSale = async () => {
    const last = rail.find((r) => r.placement && !r.conversion);
    if (!last?.placement) return;
    const { clickId } = last.placement;
    await fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clickId }),
    });
    await fetch("/api/conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clickId, mode: "suspicious" }),
    });
    await refresh();
  };

  return {
    rail,
    traces,
    metrics,
    learning,
    autonomy,
    threshold,
    earnings,
    pulse,
    refresh,
    setStrictness,
    monetizeDecision,
    saleDecision,
    simulateFlaggedSale,
  };
}
