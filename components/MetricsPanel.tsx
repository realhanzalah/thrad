"use client";

import type { BusinessMetrics, LearningState } from "@/lib/types";
import { Card, fmtGbp, fmtPct, fmtRatio } from "./ui";

export function MetricsPanel({
  metrics,
  learning,
  budgetGbp,
}: {
  metrics: BusinessMetrics | null;
  learning: LearningState | null;
  budgetGbp?: number;
}) {
  if (!metrics) {
    return (
      <Card className="p-6">
        <p className="text-sm text-zinc-500">Metrics appear after the first ad activity.</p>
      </Card>
    );
  }

  const primary = [
    { label: "LTV", value: fmtGbp(metrics.ltv), hint: "Expected value per customer" },
    { label: "CAC", value: fmtGbp(metrics.cac), hint: "Cost to acquire a sale" },
    { label: "LTV : CAC", value: fmtRatio(metrics.ltvCacRatio), hint: "Unit economics health" },
    { label: "ROAS", value: fmtRatio(metrics.roas), hint: "Revenue per £ spent" },
  ];

  const secondary = [
    { label: "Revenue", value: fmtGbp(metrics.revenue) },
    { label: "Ad spend", value: fmtGbp(metrics.adSpend) },
    { label: "Profit", value: fmtGbp(metrics.profit) },
    { label: "Conv. rate", value: fmtPct(metrics.conversionRate) },
  ];

  return (
    <div className="space-y-4">
      {budgetGbp !== undefined && budgetGbp > 0 && (
        <p className="text-xs text-zinc-500">
          Monthly budget cap:{" "}
          <span className="text-zinc-400 tabular-nums">{fmtGbp(budgetGbp)}</span>
          {" · "}spend in metrics uses this session&apos;s activity
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {primary.map((m) => (
          <Card key={m.label} className="p-4 hover:-translate-y-0.5 transition-transform">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">
              {m.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">
              {m.value}
            </div>
            <div className="mt-1 text-[11px] text-zinc-600">{m.hint}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondary.map((m) => (
          <Card key={m.label} className="p-3">
            <div className="text-[11px] text-zinc-500">{m.label}</div>
            <div className="text-lg font-medium tabular-nums text-zinc-200">{m.value}</div>
          </Card>
        ))}
      </div>

      {learning && (
        <Card className="p-4 border-emerald-800/60 bg-emerald-950/20">
          <div className="text-[11px] uppercase tracking-wider text-emerald-500/90">
            Learning agent
          </div>
          <p className="mt-1 text-sm text-zinc-300">{learning.summary}</p>
          <p className="mt-2 text-sm text-emerald-200/90">{learning.recommendation}</p>
          {learning.applied && learning.suggestedAutonomy && (
            <p className="mt-2 text-xs text-zinc-500">
              Auto-adjusted strictness → {learning.suggestedAutonomy}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
