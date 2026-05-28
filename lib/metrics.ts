import { appendTrace, finishTrace, startTrace } from "./agent-trace";
import { getStore } from "./store";
import type { BusinessMetrics } from "./types";

const COST_PER_IMPRESSION = 0.1;
const COST_PER_CLICK = 0.35;
const LTV_REPEAT_FACTOR = 1.3;

export function computeMetrics(): BusinessMetrics {
  const traceId = startTrace("roi", [
    "[roi] Recalculating unit economics…",
    "[roi] Loading session funnel data",
  ]);

  const s = getStore();
  const placements = [...s.placements.values()];
  const conversions = [...s.conversions.values()].filter(
    (c) =>
      c.auditStatus === "clean_auto_billed" ||
      c.auditStatus === "human_confirmed",
  );

  const impressions = placements.length;
  const clicks = placements.filter((p) => p.clickedAt).length;
  const conversionCount = conversions.length;
  const revenue = s.earnings.totalGbp;
  const pendingRevenue = s.earnings.pendingGbp;

  appendTrace(traceId, `[roi] Impressions: ${impressions} · Clicks: ${clicks}`);
  appendTrace(
    traceId,
    `[roi] Billed conversions: ${conversionCount} · Revenue: £${revenue.toFixed(2)}`,
  );

  let adSpend =
    impressions * COST_PER_IMPRESSION + clicks * COST_PER_CLICK;
  const budgetCap = s.profile.monthlyBudgetGbp;
  if (budgetCap > 0) {
    adSpend = Math.min(adSpend, budgetCap);
  }
  appendTrace(
    traceId,
    `[roi] Ad spend = (${impressions} × £${COST_PER_IMPRESSION}) + (${clicks} × £${COST_PER_CLICK}) = £${adSpend.toFixed(2)}`,
  );

  const cac =
    conversionCount > 0 ? adSpend / conversionCount : 0;
  const avgOrder = conversionCount > 0 ? revenue / conversionCount : 0;
  const ltv = conversionCount > 0 ? avgOrder * LTV_REPEAT_FACTOR : 0;
  const roas = adSpend > 0 ? revenue / adSpend : 0;
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  const conversionRate = clicks > 0 ? conversionCount / clicks : 0;
  const clickThroughRate = impressions > 0 ? clicks / impressions : 0;
  const profit = revenue - adSpend;
  const arpu = conversionCount > 0 ? revenue / conversionCount : 0;

  appendTrace(traceId, `[roi] CAC = spend / conversions = £${cac.toFixed(2)}`);
  appendTrace(
    traceId,
    `[roi] LTV = avg order (£${avgOrder.toFixed(2)}) × ${LTV_REPEAT_FACTOR} repeat factor = £${ltv.toFixed(2)}`,
  );
  appendTrace(traceId, `[roi] ROAS = £${roas.toFixed(2)} · LTV:CAC = ${ltvCacRatio.toFixed(2)}`);
  appendTrace(traceId, `[roi] Done.`);

  finishTrace(traceId);

  return {
    revenue,
    pendingRevenue,
    adSpend,
    profit,
    impressions,
    clicks,
    conversions: conversionCount,
    cac,
    ltv,
    roas,
    ltvCacRatio,
    conversionRate,
    clickThroughRate,
    arpu,
    updatedAt: Date.now(),
  };
}
