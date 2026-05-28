"use client";

import type { BusinessMetrics, LearningState } from "@/lib/types";
import { Card, fmtGbp, fmtPct, fmtRatio, Label } from "./ui";

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
      <Card className="p-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Metrics appear after the first ad activity.
        </p>
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
    <div className="space-y-6">
      {budgetGbp !== undefined && budgetGbp > 0 && (
        <p className="font-label text-xs text-muted-foreground">
          Monthly budget cap:{" "}
          <span className="text-foreground tabular-nums">{fmtGbp(budgetGbp)}</span>
          {" · "}spend in metrics uses this session&apos;s activity
        </p>
      )}

      {/* Inverted stats section */}
      <section className="relative section-inverted texture-lines-inverted py-8 px-6 md:px-8 overflow-hidden">
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {primary.map((m) => (
            <div key={m.label} className="group">
              <Label className="text-background/60">{m.label}</Label>
              <div className="mt-2 font-display text-3xl md:text-4xl font-medium tabular-nums tracking-tight">
                {m.value}
              </div>
              <div className="mt-2 text-[11px] text-background/50 leading-relaxed">
                {m.hint}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondary.map((m) => (
          <Card key={m.label} className="p-5" hover>
            <Label>{m.label}</Label>
            <div className="mt-2 text-xl font-medium tabular-nums">{m.value}</div>
          </Card>
        ))}
      </div>

      {learning && (
        <Card className="p-6 border-2">
          <Label>Learning agent</Label>
          <p className="mt-3 text-base leading-relaxed">{learning.summary}</p>
          <p className="mt-3 text-lg font-display italic">{learning.recommendation}</p>
          {learning.applied && learning.suggestedAutonomy && (
            <p className="mt-4 font-label text-xs text-muted-foreground">
              Auto-adjusted strictness → {learning.suggestedAutonomy}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
