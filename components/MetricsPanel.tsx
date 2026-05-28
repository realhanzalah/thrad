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
      <Card className="p-6" corner="square" cornerColor="#1040C0">
        <p className="text-sm font-medium text-[#121212]/70 leading-relaxed">
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
        <p className="text-xs font-bold uppercase tracking-widest text-[#121212]/50">
          Monthly budget cap:{" "}
          <span className="text-[#121212] tabular-nums">{fmtGbp(budgetGbp)}</span>
          {" · "}spend in metrics uses this session&apos;s activity
        </p>
      )}

      <section className="border-2 lg:border-4 border-[#121212] bg-[#F0C020] shadow-[4px_4px_0px_0px_#121212] lg:shadow-[8px_8px_0px_0px_#121212]">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#121212]">
          {primary.map((m, i) => (
            <div key={m.label} className="p-5 sm:p-6">
              <Label accent={i % 2 === 0 ? "red" : "blue"}>{m.label}</Label>
              <div className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tabular-nums tracking-tighter text-[#121212]">
                {m.value}
              </div>
              <div className="mt-2 text-[11px] font-medium text-[#121212]/60 leading-relaxed">
                {m.hint}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondary.map((m, i) => (
          <Card key={m.label} className="p-4" cornerIndex={i}>
            <Label>{m.label}</Label>
            <div className="mt-2 text-xl font-black tabular-nums text-[#121212]">{m.value}</div>
          </Card>
        ))}
      </div>

      {learning && (
        <Card className="p-5 border-[#1040C0]" corner="circle" cornerColor="#1040C0">
          <Label accent="blue">Learning agent</Label>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[#121212] pr-4">
            {learning.summary}
          </p>
          <p className="mt-3 text-base font-bold text-[#1040C0]">{learning.recommendation}</p>
          {learning.applied && learning.suggestedAutonomy && (
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#121212]/50">
              Auto-adjusted strictness → {learning.suggestedAutonomy}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
