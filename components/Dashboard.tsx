"use client";

import { useState } from "react";
import type { Conversion, Placement, RailItem } from "@/lib/types";
import { useYieldState } from "@/hooks/useYieldState";
import { MetricsPanel } from "./MetricsPanel";
import { Btn, Card, fmtGbp, Label, SectionRule } from "./ui";

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
      <header className="px-6 md:px-8 lg:px-12 py-8 md:py-10 border-b-4 border-foreground relative">
        <div className="absolute inset-0 texture-lines pointer-events-none" aria-hidden />
        <div className="relative">
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
            Dashboard
          </h1>
          <div className="mt-8 flex flex-wrap gap-12">
            <div>
              <Label>Revenue</Label>
              <div
                className={`mt-2 font-display text-4xl md:text-5xl tabular-nums tracking-tight transition-colors duration-100 ${
                  pulse ? "italic" : ""
                }`}
              >
                {fmtGbp(earnings.totalGbp)}
              </div>
            </div>
            {earnings.pendingGbp > 0 && (
              <div>
                <Label>Pending approval</Label>
                <div className="mt-2 font-display text-3xl tabular-nums tracking-tight">
                  {fmtGbp(earnings.pendingGbp)}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 py-10 md:py-12 space-y-12 max-w-6xl">
        <MetricsPanel
          metrics={metrics}
          learning={learning}
          budgetGbp={profile?.monthlyBudgetGbp}
        />

        {(pendingMonetize.length > 0 || uniquePendingSales.length > 0) && (
          <section>
            <SectionRule className="mb-8" />
            <h2 className="font-display text-2xl font-medium tracking-tight mb-6">
              Needs your decision
            </h2>
            <div className="space-y-4">
              {pendingMonetize.map((item) => (
                <Card key={item.id} className="p-6 border-2">
                  <p className="text-base font-medium leading-relaxed">
                    Is buying intent strong enough to show an ad?
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2 italic">
                    &ldquo;{item.userMessage}&rdquo;
                  </p>
                  <p className="mt-3 font-label text-xs text-muted-foreground">
                    Score {item.decision?.intent_score ?? "—"} · your bar is {threshold}+
                  </p>
                  <div className="mt-5 flex gap-3">
                    <Btn
                      variant="primary"
                      className="flex-1 py-3"
                      onClick={() => monetizeDecision(item.id, "approve")}
                    >
                      Show ad →
                    </Btn>
                    <Btn
                      className="flex-1 py-3"
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
                  <Card key={c.conversionId} className="p-6 border-2" inverted>
                    <p className="text-base font-medium leading-relaxed">
                      Does this conversion need a human audit?
                    </p>
                    <p className="mt-2 font-display text-3xl tabular-nums">
                      {fmtGbp(c.value)}
                    </p>
                    <ul className="mt-3 font-label text-xs space-y-1 opacity-80">
                      {c.heldReasons.map((reason, i) => (
                        <li key={i}>— {reason}</li>
                      ))}
                    </ul>
                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        className="flex-1 py-3 border-2 border-background bg-background text-foreground font-label text-sm uppercase tracking-widest transition-colors duration-100 hover:bg-transparent hover:text-background focus-ring min-h-[44px]"
                        onClick={() => saleDecision(c.conversionId, "confirm")}
                      >
                        Approve sale →
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-3 border-2 border-background bg-transparent text-background font-label text-sm uppercase tracking-widest transition-colors duration-100 hover:bg-background hover:text-foreground focus-ring min-h-[44px]"
                        onClick={() => saleDecision(c.conversionId, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <SectionRule className="mb-8" />
          <h2 className="font-display text-2xl font-medium tracking-tight">
            Ad strictness
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg">
            Controls when Yield shows ads vs asks you first.
          </p>
          <div className="mt-5 flex gap-2 max-w-lg">
            {STRICTNESS.map((s) => (
              <button
                key={s.level}
                type="button"
                onClick={() => setStrictness(s.level)}
                className={`flex-1 py-3 px-2 rounded-none border-2 text-sm font-label uppercase tracking-widest transition-colors duration-100 focus-ring ${
                  autonomy === s.level
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground bg-background text-muted-foreground hover:bg-foreground hover:text-background"
                }`}
              >
                <div className="font-medium normal-case tracking-normal font-body text-sm">
                  {s.label}
                </div>
                <div className="text-[10px] mt-1 opacity-70">{s.hint}</div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionRule className="mb-8" />
          <h2 className="font-display text-2xl font-medium tracking-tight mb-5">
            Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 10).map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>

        <section className="pt-4">
          <SectionRule className="mb-6" />
          <Label>Demo</Label>
          <Btn
            variant="ghost"
            className="mt-2 text-xs px-0"
            onClick={simulateFlaggedSale}
            disabled={!hasPlacement}
          >
            Simulate flagged sale →
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
      <Card className="overflow-hidden p-0 group">
        <button
          type="button"
          onClick={() => item.placement && setOpen((o) => !o)}
          className="w-full text-left px-4 py-3 flex items-center gap-4 transition-colors duration-100 hover:bg-foreground hover:text-background focus-ring"
        >
          <StatusMark kind={item.kind} conversion={item.conversion} />
          <span className="text-sm flex-1 truncate">{summary}</span>
          {item.placement && (
            <span className="font-label text-[10px] opacity-60">{open ? "−" : "+"}</span>
          )}
        </button>
        {open && item.placement && (
          <div className="px-4 pb-4 border-t border-foreground">
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

function StatusMark({
  kind,
  conversion,
}: {
  kind: RailItem["kind"];
  conversion?: Conversion;
}) {
  const held = conversion?.auditStatus === "held_for_review" || kind === "audit";
  const active = kind === "place" || kind === "conversion";
  const pending = kind === "hold";

  if (held) {
    return (
      <span className="w-3 h-3 shrink-0 border-2 border-foreground bg-transparent" />
    );
  }
  if (active) {
    return <span className="w-3 h-3 shrink-0 bg-foreground" />;
  }
  if (pending) {
    return (
      <span className="w-3 h-3 shrink-0 border border-foreground bg-muted" />
    );
  }
  return <span className="w-3 h-3 shrink-0 border border-border-light bg-transparent" />;
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
    <ol className="mt-3 space-y-2">
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-3 text-xs">
          <span
            className={`w-4 h-4 flex items-center justify-center text-[10px] border ${
              s.done
                ? "border-foreground bg-foreground text-background"
                : "border-border-light text-muted-foreground"
            }`}
          >
            {s.done ? "✓" : "·"}
          </span>
          <span className={s.done ? "text-foreground" : "text-muted-foreground"}>
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
