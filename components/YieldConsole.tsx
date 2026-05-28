"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AutonomyLevel,
  Conversion,
  Placement,
  RailItem,
} from "@/lib/types";
import { thradConversion, thradEvent } from "@/lib/thrad";

const STRICTNESS: {
  level: AutonomyLevel;
  label: string;
  threshold: number;
  hint: string;
}[] = [
  { level: "conservative", label: "High bar", threshold: 80, hint: "80+" },
  { level: "balanced", label: "Balanced", threshold: 65, hint: "65+" },
  { level: "aggressive", label: "Low bar", threshold: 50, hint: "50+" },
];

function fmtGbp(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(n);
}

export default function YieldConsole() {
  const [rail, setRail] = useState<RailItem[]>([]);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>("balanced");
  const [threshold, setThreshold] = useState(65);
  const [earnings, setEarnings] = useState({ totalGbp: 0, pendingGbp: 0 });
  const [pulse, setPulse] = useState(false);
  const prevTotal = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setRail(data.rail);
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
    const r = await fetch("/api/conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clickId, mode: "suspicious" }),
    });
    const data = (await r.json()) as { conversion?: Conversion };
    if (data.conversion?.auditStatus === "clean_auto_billed") {
      thradConversion({
        order_id: data.conversion.conversionId,
        value: data.conversion.value,
        currency: data.conversion.currency,
        click_id: data.conversion.clickId,
      });
    }
    await refresh();
  };

  const pendingMonetize = rail.filter((r) => r.kind === "hold" && r.pendingApproval);
  const pendingSales = rail.filter(
    (r) => r.conversion?.auditStatus === "held_for_review",
  );
  const seenConv = new Set<string>();
  const uniquePendingSales = pendingSales.filter((r) => {
    const id = r.conversion!.conversionId;
    if (seenConv.has(id)) return false;
    seenConv.add(id);
    return true;
  });

  const activity = rail.filter(
    (r) =>
      !(r.kind === "hold" && r.pendingApproval) &&
      r.kind !== "audit" &&
      !(r.conversion && !r.decision && r.kind === "conversion"),
  );

  const hasPlacement = rail.some((r) => r.placement && !r.conversion);

  return (
    <div className="flex flex-col flex-1 min-h-screen max-w-3xl">
      <header className="px-6 py-5 border-b border-zinc-800/60">
        <h1 className="text-xl font-semibold text-zinc-100">Yield</h1>
        <div className="mt-4 flex items-baseline gap-6">
          <div>
            <div className="text-xs text-zinc-500">Revenue</div>
            <div
              className={`text-3xl font-semibold tabular-nums ${
                pulse ? "text-emerald-300" : "text-zinc-100"
              }`}
            >
              {fmtGbp(earnings.totalGbp)}
            </div>
          </div>
          {earnings.pendingGbp > 0 && (
            <div>
              <div className="text-xs text-amber-400/90">Awaiting approval</div>
              <div className="text-xl font-medium tabular-nums text-amber-300">
                {fmtGbp(earnings.pendingGbp)}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {(pendingMonetize.length > 0 || uniquePendingSales.length > 0) && (
          <section>
            <h2 className="text-sm font-medium text-zinc-200 mb-3">
              Needs your decision
            </h2>
            <div className="space-y-3">
              {pendingMonetize.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-sky-800/50 bg-sky-950/30 p-4"
                >
                  <p className="text-sm font-medium text-zinc-100">
                    Show an ad for this message?
                  </p>
                  <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                    &ldquo;{item.userMessage}&rdquo;
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Buying intent: {item.decision?.intent_score ?? "—"} · your
                    bar is {threshold}+
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => monetizeDecision(item.id, "approve")}
                      className="flex-1 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      Show ad
                    </button>
                    <button
                      type="button"
                      onClick={() => monetizeDecision(item.id, "decline")}
                      className="flex-1 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      No ad
                    </button>
                  </div>
                </div>
              ))}

              {uniquePendingSales.map((item) => {
                const c = item.conversion!;
                return (
                  <div
                    key={c.conversionId}
                    className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4"
                  >
                    <p className="text-sm font-medium text-zinc-100">
                      Approve this sale?
                    </p>
                    <p className="mt-1 text-lg tabular-nums text-amber-200">
                      {fmtGbp(c.value)}
                    </p>
                    <ul className="mt-2 text-xs text-zinc-400 space-y-1">
                      {c.heldReasons.map((reason, i) => (
                        <li key={i}>· {reason}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => saleDecision(c.conversionId, "confirm")}
                        className="flex-1 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-500"
                      >
                        Approve sale
                      </button>
                      <button
                        type="button"
                        onClick={() => saleDecision(c.conversionId, "reject")}
                        className="flex-1 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-medium text-zinc-200 mb-1">
            When should we show ads?
          </h2>
          <p className="text-xs text-zinc-500 mb-3">
            Higher bar = fewer ads. Yield asks you when intent is borderline.
          </p>
          <div className="flex gap-2">
            {STRICTNESS.map((s) => (
              <button
                key={s.level}
                type="button"
                onClick={() => setStrictness(s.level)}
                className={`flex-1 py-2.5 rounded-lg border text-sm transition ${
                  autonomy === s.level
                    ? "border-emerald-600/50 bg-emerald-950/40 text-emerald-200"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="font-medium">{s.label}</div>
                <div className="text-[11px] opacity-70 mt-0.5">{s.hint}</div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-zinc-200 mb-3">Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">
              No activity yet. Send a message in the cooking app.
            </p>
          ) : (
            <ul className="space-y-2">
              {activity.slice(0, 12).map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>

        <section className="pt-2 border-t border-zinc-800/40">
          <p className="text-xs text-zinc-600 mb-2">Demo only</p>
          <button
            type="button"
            onClick={simulateFlaggedSale}
            disabled={!hasPlacement}
            className="text-xs px-3 py-1.5 rounded-md border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-40"
          >
            Simulate sale requiring review
          </button>
        </section>
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: RailItem }) {
  const [open, setOpen] = useState(false);
  const summary = activitySummary(item);

  return (
    <li className="rounded-lg border border-zinc-800/80 bg-zinc-900/40">
      <button
        type="button"
        onClick={() => item.placement && setOpen((o) => !o)}
        className="w-full text-left px-3 py-2.5 flex items-center gap-3"
      >
        <StatusDot kind={item.kind} conversion={item.conversion} />
        <span className="text-sm text-zinc-300 flex-1 min-w-0 truncate">
          {summary}
        </span>
        {item.placement && (
          <span className="text-[11px] text-zinc-600 shrink-0">
            {open ? "Hide" : "Steps"}
          </span>
        )}
      </button>
      {open && item.placement && (
        <div className="px-3 pb-3 border-t border-zinc-800/60">
          <Funnel placement={item.placement} conversion={item.conversion} />
        </div>
      )}
    </li>
  );
}

function activitySummary(item: RailItem): string {
  if (item.kind === "skip") return "No ad shown";
  if (item.kind === "hold") return "Waiting — show ad?";
  if (item.conversion?.auditStatus === "held_for_review") {
    return `Sale ${fmtGbp(item.conversion.value)} — needs approval`;
  }
  if (item.conversion) {
    return `Sale ${fmtGbp(item.conversion.value)}`;
  }
  if (item.placement) {
    const title = item.placement.offer.title;
    return `Ad shown · ${title.length > 40 ? title.slice(0, 40) + "…" : title}`;
  }
  return "Update";
}

function StatusDot({
  kind,
  conversion,
}: {
  kind: RailItem["kind"];
  conversion?: Conversion;
}) {
  let color = "bg-zinc-500";
  if (conversion?.auditStatus === "held_for_review" || kind === "audit")
    color = "bg-amber-400";
  else if (kind === "place" || kind === "conversion") color = "bg-emerald-400";
  else if (kind === "hold") color = "bg-sky-400";
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />;
}

function Funnel({
  placement,
  conversion,
}: {
  placement: Placement;
  conversion?: Conversion;
}) {
  const clicked = !!placement.clickedAt;
  const purchased = !!conversion;

  const steps = [
    { label: "Message", done: true },
    { label: "Ad shown", done: true },
    { label: "User clicked", done: clicked },
    { label: "Purchase", done: purchased },
  ];

  return (
    <ol className="mt-2 space-y-2">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-2 text-xs">
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              step.done
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-zinc-800 text-zinc-600"
            }`}
          >
            {step.done ? "✓" : "·"}
          </span>
          <span className={step.done ? "text-zinc-300" : "text-zinc-600"}>
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
