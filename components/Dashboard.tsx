"use client";

import { useState } from "react";
import type { Conversion, Placement, RailItem } from "@/lib/types";
import { useYieldState } from "@/hooks/useYieldState";
import { MetricsPanel } from "./MetricsPanel";
import { Btn, Card, fmtGbp, Label, SectionRule } from "./ui";
import { BauhausBtn } from "./bauhaus-ui";

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
      <header className="px-6 md:px-8 py-6 md:py-8 border-b-2 lg:border-b-4 border-[#121212] bg-white shadow-[0_4px_0_0_#121212]">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[#121212] leading-[0.95]">
          Dashboard
        </h1>
        <div className="mt-6 flex flex-wrap gap-8 sm:gap-12">
          <div>
            <Label>Revenue</Label>
            <div
              className={`mt-1 text-3xl sm:text-4xl font-black tabular-nums tracking-tighter ${
                pulse ? "text-[#D02020]" : "text-[#121212]"
              }`}
            >
              {fmtGbp(earnings.totalGbp)}
            </div>
          </div>
          {earnings.pendingGbp > 0 && (
            <div>
              <Label accent="red">Pending approval</Label>
              <div className="mt-1 text-2xl sm:text-3xl font-black tabular-nums text-[#D02020]">
                {fmtGbp(earnings.pendingGbp)}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 space-y-10 max-w-6xl dot-grid">
        <MetricsPanel
          metrics={metrics}
          learning={learning}
          budgetGbp={profile?.monthlyBudgetGbp}
        />

        {(pendingMonetize.length > 0 || uniquePendingSales.length > 0) && (
          <section>
            <SectionRule className="mb-6" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#121212] mb-4">
              Needs your decision
            </h2>
            <div className="space-y-4">
              {pendingMonetize.map((item, i) => (
                <Card key={item.id} className="p-5" cornerIndex={i}>
                  <p className="text-sm font-bold text-[#121212]">
                    Is buying intent strong enough to show an ad?
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#121212]/70 line-clamp-2">
                    &ldquo;{item.userMessage}&rdquo;
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#121212]/50">
                    Score {item.decision?.intent_score ?? "—"} · your bar is {threshold}+
                  </p>
                  <div className="mt-4 flex gap-2">
                    <BauhausBtn
                      variant="blue"
                      className="flex-1 py-2.5"
                      onClick={() => monetizeDecision(item.id, "approve")}
                    >
                      Show ad
                    </BauhausBtn>
                    <BauhausBtn
                      variant="outline"
                      className="flex-1 py-2.5"
                      onClick={() => monetizeDecision(item.id, "decline")}
                    >
                      No ad
                    </BauhausBtn>
                  </div>
                </Card>
              ))}

              {uniquePendingSales.map((item) => (
                <Card
                  key={item.conversion!.conversionId}
                  className="p-5 bg-[#D02020] !text-white border-[#121212]"
                  corner="triangle"
                  cornerColor="#F0C020"
                >
                  <p className="text-sm font-bold">
                    Does this conversion need a human audit?
                  </p>
                  <p className="mt-2 text-3xl font-black tabular-nums">{fmtGbp(item.conversion!.value)}</p>
                  <ul className="mt-2 text-xs font-bold uppercase tracking-widest text-white/80 space-y-1">
                    {item.conversion!.heldReasons.map((reason, j) => (
                      <li key={j}>· {reason}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex gap-2">
                    <BauhausBtn
                      variant="yellow"
                      className="flex-1 py-2.5"
                      onClick={() => saleDecision(item.conversion!.conversionId, "confirm")}
                    >
                      Approve sale
                    </BauhausBtn>
                    <BauhausBtn
                      variant="outline"
                      className="flex-1 py-2.5 !bg-white"
                      onClick={() => saleDecision(item.conversion!.conversionId, "reject")}
                    >
                      Reject
                    </BauhausBtn>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionRule className="mb-6" />
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#121212]">
            Ad strictness
          </h2>
          <p className="mt-2 text-sm font-medium text-[#121212]/70 max-w-lg">
            Controls when Yield shows ads vs asks you first.
          </p>
          <div className="mt-4 flex gap-2 max-w-lg">
            {STRICTNESS.map((s) => (
              <button
                key={s.level}
                type="button"
                onClick={() => setStrictness(s.level)}
                className={`flex-1 py-2.5 px-2 rounded-none border-2 text-sm font-bold uppercase tracking-wide transition-all duration-200 ease-out shadow-[4px_4px_0px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] ${
                  autonomy === s.level
                    ? "border-[#121212] bg-[#1040C0] text-white"
                    : "border-[#121212] bg-white text-[#121212]/60 hover:bg-[#E0E0E0]"
                }`}
              >
                <div>{s.label}</div>
                <div className="text-[10px] mt-0.5 opacity-70">{s.hint}</div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionRule className="mb-6" />
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#121212] mb-4">
            Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm font-medium text-[#121212]/60">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 10).map((item, i) => (
                <ActivityRow key={item.id} item={item} index={i} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionRule className="mb-4" />
          <Label>Demo</Label>
          <Btn
            variant="ghost"
            className="mt-2 text-xs px-2"
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

function ActivityRow({ item, index }: { item: RailItem; index: number }) {
  const [open, setOpen] = useState(false);
  const summary = activitySummary(item);

  return (
    <li>
      <Card className="overflow-hidden p-0" cornerIndex={index}>
        <button
          type="button"
          onClick={() => item.placement && setOpen((o) => !o)}
          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#E0E0E0]/50 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
        >
          <StatusMark kind={item.kind} conversion={item.conversion} />
          <span className="text-sm font-medium flex-1 truncate">{summary}</span>
          {item.placement && (
            <span className="text-[11px] font-bold text-[#121212]/40">{open ? "−" : "+"}</span>
          )}
        </button>
        {open && item.placement && (
          <div className="px-4 pb-4 border-t-2 border-[#121212]">
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
      <span
        className="w-3 h-3 shrink-0 border-2 border-[#121212] bg-[#D02020]"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    );
  }
  if (active) {
    return <span className="w-3 h-3 shrink-0 rounded-full bg-[#1040C0] border-2 border-[#121212]" />;
  }
  if (pending) {
    return <span className="w-3 h-3 shrink-0 bg-[#F0C020] border-2 border-[#121212]" />;
  }
  return <span className="w-3 h-3 shrink-0 border-2 border-[#121212] bg-white" />;
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
        <li key={s.label} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
          <span
            className={`w-5 h-5 flex items-center justify-center text-[10px] border-2 border-[#121212] ${
              s.done ? "bg-[#1040C0] text-white" : "bg-white text-[#121212]/40"
            }`}
          >
            {s.done ? "✓" : "·"}
          </span>
          <span className={s.done ? "text-[#121212]" : "text-[#121212]/40"}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
