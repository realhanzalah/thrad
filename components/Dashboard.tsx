"use client";

import { useState } from "react";
import type { Conversion, Placement, RailItem } from "@/lib/types";
import { useYieldState } from "@/hooks/useYieldState";
import { MetricsPanel } from "./MetricsPanel";
import { Btn, Card, fmtGbp } from "./ui";

const STRICTNESS = [
  { level: "conservative" as const, label: "High bar", hint: "80+" },
  { level: "balanced" as const, label: "Balanced", hint: "65+" },
  { level: "aggressive" as const, label: "Low bar", hint: "50+" },
];

export default function Dashboard() {
  const {
    rail,
    metrics,
    learning,
    autonomy,
    threshold,
    earnings,
    pulse,
    setStrictness,
    monetizeDecision,
    saleDecision,
    simulateFlaggedSale,
    profile,
  } = useYieldState();

  const pendingMonetize = rail.filter((r) => r.kind === "hold" && r.pendingApproval);
  const pendingSales = rail.filter((r) => r.conversion?.auditStatus === "held_for_review");
  const seen = new Set<string>();
  const uniquePendingSales = pendingSales.filter((r) => {
    const id = r.conversion!.conversionId;
    if (seen.has(id)) return false;
    seen.add(id);
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
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="px-6 py-5 border-b-2 border-zinc-700">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
        <div className="mt-3 flex gap-8">
          <div>
            <div className="text-xs text-zinc-500">Revenue</div>
            <div
              className={`text-2xl font-semibold tabular-nums ${
                pulse ? "text-emerald-300" : "text-zinc-100"
              }`}
            >
              {fmtGbp(earnings.totalGbp)}
            </div>
          </div>
          {earnings.pendingGbp > 0 && (
            <div>
              <div className="text-xs text-amber-400/90">Pending approval</div>
              <div className="text-xl tabular-nums text-amber-300">
                {fmtGbp(earnings.pendingGbp)}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-w-5xl">
        <MetricsPanel
          metrics={metrics}
          learning={learning}
          budgetGbp={profile?.monthlyBudgetGbp}
        />

        {(pendingMonetize.length > 0 || uniquePendingSales.length > 0) && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-200 mb-3">
              Needs your decision
            </h2>
            <div className="space-y-3">
              {pendingMonetize.map((item) => (
                <Card key={item.id} className="p-4 border-sky-800/50 bg-sky-950/20">
                  <p className="text-sm font-medium text-zinc-100">
                    Is buying intent strong enough to show an ad?
                  </p>
                  <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                    &ldquo;{item.userMessage}&rdquo;
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Score {item.decision?.intent_score ?? "—"} · your bar is {threshold}+
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Btn
                      variant="primary"
                      className="flex-1 py-2"
                      onClick={() => monetizeDecision(item.id, "approve")}
                    >
                      Show ad
                    </Btn>
                    <Btn
                      className="flex-1 py-2"
                      onClick={() => monetizeDecision(item.id, "decline")}
                    >
                      No ad
                    </Btn>
                  </div>
                </Card>
              ))}

              {uniquePendingSales.map((item) => {
                const c = item.conversion!;
                return (
                  <Card key={c.conversionId} className="p-4 border-amber-800/50 bg-amber-950/15">
                    <p className="text-sm font-medium text-zinc-100">
                      Does this conversion need a human audit?
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
                      <Btn
                        variant="danger"
                        className="flex-1 py-2"
                        onClick={() => saleDecision(c.conversionId, "confirm")}
                      >
                        Approve sale
                      </Btn>
                      <Btn
                        className="flex-1 py-2"
                        onClick={() => saleDecision(c.conversionId, "reject")}
                      >
                        Reject
                      </Btn>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-zinc-200 mb-2">
            Ad strictness
          </h2>
          <p className="text-xs text-zinc-500 mb-3">
            Controls when Yield shows ads vs asks you first.
          </p>
          <div className="flex gap-2 max-w-lg">
            {STRICTNESS.map((s) => (
              <button
                key={s.level}
                type="button"
                onClick={() => setStrictness(s.level)}
                className={`flex-1 py-2.5 rounded-none border-2 text-sm font-semibold uppercase tracking-wide transition duration-200 ease-out shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  autonomy === s.level
                    ? "border-emerald-700 bg-emerald-950/50 text-emerald-200"
                    : "border-zinc-600 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <div className="font-medium">{s.label}</div>
                <div className="text-[11px] opacity-70">{s.hint}</div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-zinc-500">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.slice(0, 10).map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>

        <section className="pt-4 border-t-2 border-zinc-800/60">
          <p className="text-[11px] text-zinc-600 mb-2">Demo</p>
          <Btn
            variant="ghost"
            className="text-xs px-3 py-1.5 border border-zinc-800"
            onClick={simulateFlaggedSale}
            disabled={!hasPlacement}
          >
            Simulate flagged sale
          </Btn>
        </section>
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: RailItem }) {
  const [open, setOpen] = useState(false);
  const summary = activitySummary(item);

  return (
    <li>
      <Card className="overflow-hidden hover:-translate-y-0.5 transition-transform">
        <button
          type="button"
          onClick={() => item.placement && setOpen((o) => !o)}
          className="w-full text-left px-3 py-2.5 flex items-center gap-3"
        >
          <StatusDot kind={item.kind} conversion={item.conversion} />
          <span className="text-sm text-zinc-300 flex-1 truncate">{summary}</span>
          {item.placement && (
            <span className="text-[11px] text-zinc-600">{open ? "−" : "+"}</span>
          )}
        </button>
        {open && item.placement && (
          <div className="px-3 pb-3 border-t-2 border-zinc-800">
            <Funnel placement={item.placement} conversion={item.conversion} />
          </div>
        )}
      </Card>
    </li>
  );
}

function activitySummary(item: RailItem): string {
  if (item.kind === "skip") return "No ad";
  if (item.kind === "hold") return "Awaiting decision";
  if (item.conversion?.auditStatus === "held_for_review") {
    return `Sale ${fmtGbp(item.conversion.value)} · review`;
  }
  if (item.conversion) return `Sale ${fmtGbp(item.conversion.value)}`;
  if (item.placement) {
    const t = item.placement.offer.title;
    return `Ad · ${t.length > 36 ? t.slice(0, 36) + "…" : t}`;
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
  const steps = [
    { label: "Message", done: true },
    { label: "Ad shown", done: true },
    { label: "Clicked", done: !!placement.clickedAt },
    { label: "Purchased", done: !!conversion },
  ];
  return (
    <ol className="mt-2 space-y-1.5">
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-2 text-xs">
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              s.done ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-600"
            }`}
          >
            {s.done ? "✓" : "·"}
          </span>
          <span className={s.done ? "text-zinc-300" : "text-zinc-600"}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
