"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AutonomyLevel,
  Conversion,
  RailItem,
} from "@/lib/types";
import { thradConversion } from "@/lib/thrad";

const AUTONOMY_LEVELS: { level: AutonomyLevel; label: string; threshold: number }[] = [
  { level: "conservative", label: "Careful", threshold: 80 },
  { level: "balanced", label: "Normal", threshold: 65 },
  { level: "aggressive", label: "Eager", threshold: 50 },
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
  const [earnings, setEarnings] = useState({ totalGbp: 0, pendingGbp: 0 });
  const [earningsPulse, setEarningsPulse] = useState(false);
  const prevTotalRef = useRef(0);

  const refreshState = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setRail(data.rail);
      setAutonomy(data.autonomy);
      setEarnings(data.earnings);
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    refreshState();
    const id = setInterval(refreshState, 2000);
    return () => clearInterval(id);
  }, [refreshState]);

  useEffect(() => {
    if (earnings.totalGbp > prevTotalRef.current) {
      setEarningsPulse(true);
      const t = setTimeout(() => setEarningsPulse(false), 700);
      prevTotalRef.current = earnings.totalGbp;
      return () => clearTimeout(t);
    }
    prevTotalRef.current = earnings.totalGbp;
  }, [earnings.totalGbp]);

  const setAutonomyLevel = useCallback(
    async (level: AutonomyLevel) => {
      setAutonomy(level);
      try {
        await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autonomy: level }),
        });
      } catch {
        /* swallow */
      }
    },
    [],
  );

  const testConversion = useCallback(
    async (mode: "clean" | "suspicious") => {
      const lastPlace = rail.find((r) => r.placement);
      if (!lastPlace?.placement) return;
      const { clickId } = lastPlace.placement;
      try {
        await fetch("/api/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clickId }),
        });
        const r = await fetch("/api/conversion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clickId, mode }),
        });
        const data = (await r.json()) as { conversion?: Conversion };
        if (data.conversion?.auditStatus === "clean_auto_billed") {
          thradConversion({
            order_id: data.conversion.conversionId,
            value: data.conversion.value,
            currency: data.conversion.currency,
            click_id: data.conversion.clickId,
            audit_status: data.conversion.auditStatus,
          });
        }
        await refreshState();
      } catch {
        /* swallow */
      }
    },
    [rail, refreshState],
  );

  const confirmConversion = useCallback(
    async (conversionId: string, action: "confirm" | "reject") => {
      try {
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
            audit_status: data.conversion.auditStatus,
          });
        }
        await refreshState();
      } catch {
        /* swallow */
      }
    },
    [refreshState],
  );

  const threshold = useMemo(
    () => AUTONOMY_LEVELS.find((a) => a.level === autonomy)?.threshold ?? 65,
    [autonomy],
  );

  const hasPlacement = rail.some((r) => r.placement);

  return (
    <section className="flex flex-col flex-1 min-h-screen bg-zinc-950">
      <header className="px-6 py-5 border-b border-zinc-800/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-400">
              Yield console
            </div>
            <h1 className="text-lg font-semibold text-zinc-100 mt-0.5">
              Your ad agent
            </h1>
            <p className="text-sm text-zinc-500 mt-1 max-w-md">
              Watches chat in the sample app, picks when to recommend products,
              and checks sales before they count toward earnings.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] uppercase tracking-widest text-zinc-500">
              Earned so far
            </div>
            <div
              className={`text-3xl font-semibold tabular-nums transition-colors duration-500 ${
                earningsPulse ? "text-emerald-300" : "text-zinc-100"
              }`}
            >
              {fmtGbp(earnings.totalGbp)}
            </div>
            {earnings.pendingGbp > 0 && (
              <div className="text-xs text-amber-400 tabular-nums mt-0.5">
                {fmtGbp(earnings.pendingGbp)} waiting for your OK
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">
            How strict about showing ads · needs {threshold}+ interest score
          </div>
          <div className="flex gap-1.5 max-w-md">
            {AUTONOMY_LEVELS.map((a) => (
              <button
                key={a.level}
                type="button"
                onClick={() => setAutonomyLevel(a.level)}
                className={`flex-1 text-xs py-2 rounded-md border transition ${
                  autonomy === a.level
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => testConversion("clean")}
            disabled={!hasPlacement}
            className="text-xs px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
          >
            Test a normal sale
          </button>
          <button
            type="button"
            onClick={() => testConversion("suspicious")}
            disabled={!hasPlacement}
            className="text-xs px-3 py-1.5 rounded-md border border-amber-700/60 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 disabled:opacity-40"
          >
            Test a dodgy sale
          </button>
          <span className="text-[11px] text-zinc-600 self-center">
            Or complete a purchase in the sample app — that fires a real sale too.
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 max-w-2xl">
        {rail.length === 0 && (
          <div className="text-sm text-zinc-500 px-2 py-12 text-center">
            Nothing here yet. Try a message in the sample app — this feed updates
            when the agent acts.
          </div>
        )}
        {rail.map((item) => (
          <RailRow key={item.id} item={item} onConfirm={confirmConversion} />
        ))}
      </div>

      <footer className="px-6 py-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 leading-snug max-w-2xl">
        Yield works for the publisher. It can say no to ads that would annoy users,
        and it double-checks sketchy sales before they hit your balance.
      </footer>
    </section>
  );
}

function RailRow({
  item,
  onConfirm,
}: {
  item: RailItem;
  onConfirm: (id: string, action: "confirm" | "reject") => void;
}) {
  const [manualExpanded, setManualExpanded] = useState(false);
  const showExpandable = !!item.placement || !!item.conversion;
  const tone = toneFor(item);
  const conv = item.conversion;
  const expanded = manualExpanded || !!(item.placement && item.conversion);

  return (
    <div className={`rounded-lg border ${tone.border} ${tone.bg}`}>
      <button
        type="button"
        onClick={() => showExpandable && setManualExpanded((e) => !e)}
        className="w-full text-left px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${tone.dot}`} />
          <span className={`text-[11px] uppercase tracking-widest ${tone.label}`}>
            {labelFor(item)}
          </span>
          {item.decision?.intent_score !== undefined &&
            item.decision.intent_score > 0 && (
              <span className="text-[11px] text-zinc-500 ml-auto tabular-nums">
                interest {item.decision.intent_score}
              </span>
            )}
        </div>
        {item.decision?.reason && (
          <div className="mt-1 text-sm text-zinc-300 leading-snug">
            {item.decision.reason}
          </div>
        )}
        {item.placement && (
          <div className="mt-2 text-[13px] text-zinc-200 truncate">
            {item.placement.offer.title}
            {item.placement.offer.price && (
              <span className="text-zinc-500"> · {item.placement.offer.price}</span>
            )}
          </div>
        )}
        {item.conversion && !item.decision && (
          <div className="mt-1 text-sm text-zinc-300">
            Sale {fmtGbp(item.conversion.value)} ·{" "}
            {auditLabelPlain(item.conversion.auditStatus)}
          </div>
        )}
      </button>

      {conv && conv.auditStatus === "held_for_review" && (
        <div className="px-3 pb-3 border-t border-amber-700/30 pt-2 mt-1">
          <div className="text-xs text-amber-300 font-medium mb-1">
            This sale looks wrong — count it anyway?
          </div>
          <ul className="text-[12px] text-amber-200/80 list-disc pl-4 space-y-0.5">
            {conv.heldReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => onConfirm(conv.conversionId, "confirm")}
              className="flex-1 text-xs py-1.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/25"
            >
              Yes, count it
            </button>
            <button
              type="button"
              onClick={() => onConfirm(conv.conversionId, "reject")}
              className="flex-1 text-xs py-1.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
            >
              No, reject it
            </button>
          </div>
        </div>
      )}

      {expanded && item.placement && (
        <div className="px-3 pb-3 border-t border-zinc-800/60 pt-2 mt-1 space-y-2">
          <Chain placement={item.placement} conversion={item.conversion} />
        </div>
      )}
    </div>
  );
}

function Chain({
  placement,
  conversion,
}: {
  placement: NonNullable<RailItem["placement"]>;
  conversion?: Conversion;
}) {
  const steps: {
    label: string;
    value: string;
    sub?: string;
    mono?: boolean;
    state: "done" | "pending";
  }[] = [
    {
      label: "User asked",
      value: `"${placement.prompt}"`,
      sub: "The message that led to the recommendation.",
      state: "done",
    },
    {
      label: "Recommendation",
      value: placement.offer.title,
      sub: `${placement.offer.merchant ?? "shop"}${
        placement.offer.price ? ` · ${placement.offer.price}` : ""
      } · interest ${placement.intentScore}`,
      state: "done",
    },
    {
      label: "Ad seen",
      value: placement.impressionId,
      sub: "Logged to Thrad",
      mono: true,
      state: "done",
    },
    {
      label: "Link clicked",
      value: placement.clickId,
      sub: "Logged to Thrad",
      mono: true,
      state: "done",
    },
  ];

  if (conversion) {
    steps.push({
      label: "Purchase",
      value: `${fmtGbp(conversion.value)} · ${auditLabelPlain(conversion.auditStatus)}`,
      sub:
        conversion.auditStatus === "held_for_review"
          ? "Not billed yet — waiting for you"
          : conversion.auditStatus === "rejected"
            ? "Rejected — not billed"
            : "Logged to Thrad",
      state: "done",
    });
  } else {
    steps.push({
      label: "Purchase",
      value: "(none yet)",
      sub: "User has not completed checkout.",
      state: "pending",
    });
  }

  return (
    <div className="relative">
      {steps.map((s, i) => (
        <div key={i} className="relative pl-7 pb-3 last:pb-0">
          {i < steps.length - 1 && (
            <span
              className={`absolute left-[10px] top-4 bottom-0 w-px ${
                s.state === "done" ? "bg-emerald-700/40" : "bg-zinc-700/50"
              }`}
            />
          )}
          <span
            className={`absolute left-[6px] top-[5px] inline-block w-2.5 h-2.5 rounded-full ${
              s.state === "done"
                ? "bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                : "bg-zinc-600 ring-2 ring-zinc-800"
            }`}
          />
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            {s.label}
          </div>
          <div
            className={`mt-0.5 text-[13px] text-zinc-100 leading-snug break-all ${
              s.mono ? "font-mono text-[11px]" : ""
            }`}
          >
            {s.value}
          </div>
          {s.sub && (
            <div className="mt-0.5 text-[11px] text-zinc-500 leading-snug">{s.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function auditLabelPlain(status: Conversion["auditStatus"]): string {
  switch (status) {
    case "clean_auto_billed":
      return "counted automatically";
    case "human_confirmed":
      return "you approved it";
    case "held_for_review":
      return "on hold";
    case "rejected":
      return "rejected";
  }
}

function toneFor(item: RailItem): {
  border: string;
  bg: string;
  dot: string;
  label: string;
} {
  if (item.conversion?.auditStatus === "held_for_review" || item.kind === "audit") {
    return {
      border: "border-amber-700/40",
      bg: "bg-amber-500/5",
      dot: "bg-amber-400",
      label: "text-amber-300",
    };
  }
  if (item.kind === "place" || item.kind === "conversion") {
    return {
      border: "border-emerald-700/30",
      bg: "bg-emerald-500/5",
      dot: "bg-emerald-400",
      label: "text-emerald-300",
    };
  }
  if (item.kind === "hold") {
    return {
      border: "border-sky-700/40",
      bg: "bg-sky-500/5",
      dot: "bg-sky-400",
      label: "text-sky-300",
    };
  }
  return {
    border: "border-zinc-800",
    bg: "bg-zinc-900/50",
    dot: "bg-zinc-500",
    label: "text-zinc-400",
  };
}

function labelFor(item: RailItem): string {
  if (item.kind === "audit") return "Sale on hold";
  if (item.kind === "conversion") return "Sale recorded";
  if (item.kind === "place") return "Showed recommendation";
  if (item.kind === "skip") return "Skipped ad";
  if (item.kind === "hold") return "Waiting for you";
  return item.kind;
}
