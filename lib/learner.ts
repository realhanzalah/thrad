import Anthropic from "@anthropic-ai/sdk";
import { appendTrace, finishTrace, startTrace } from "./agent-trace";
import { computeMetrics } from "./metrics";
import {
  getAutonomy,
  getLearning,
  setAutonomy,
  setLearning,
  thresholdFor,
} from "./store";
import type { AutonomyLevel, BusinessMetrics, LearningState } from "./types";

const MODEL = "claude-sonnet-4-6";

function ruleBasedLearn(m: BusinessMetrics): LearningState {
  const autonomy = getAutonomy();
  const threshold = thresholdFor(autonomy);
  let recommendation = "Hold current settings — gather more conversions.";
  let suggestedAutonomy: AutonomyLevel | undefined;
  let applied = false;

  if (m.conversions === 0 && m.impressions >= 2) {
    recommendation =
      "Low conversion volume. Consider lowering the intent bar to test more placements.";
    suggestedAutonomy = autonomy === "conservative" ? "balanced" : "aggressive";
  } else if (m.ltvCacRatio >= 3 && m.conversions >= 1) {
    recommendation =
      "Strong LTV:CAC. You can safely show ads more often.";
    suggestedAutonomy = "aggressive";
  } else if (m.ltvCacRatio > 0 && m.ltvCacRatio < 1) {
    recommendation =
      "LTV below CAC — tighten ad strictness until quality improves.";
    suggestedAutonomy = "conservative";
  } else if (m.roas >= 2) {
    recommendation = "Healthy ROAS. Current strictness is working.";
  }

  if (suggestedAutonomy && suggestedAutonomy !== autonomy) {
    setAutonomy(suggestedAutonomy);
    applied = true;
  }

  return {
    lastRunAt: Date.now(),
    summary: `LTV £${m.ltv.toFixed(2)} · CAC £${m.cac.toFixed(2)} · ROAS ${m.roas.toFixed(2)}x · bar ${threshold}+`,
    recommendation,
    suggestedAutonomy,
    applied,
  };
}

async function llmLearn(m: BusinessMetrics): Promise<LearningState> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return ruleBasedLearn(m);

  const autonomy = getAutonomy();
  const client = new Anthropic({ apiKey });
  const prompt = `You are Yield's learning agent. Given these publisher metrics, return STRICT JSON only:
{
  "summary": "<one line>",
  "recommendation": "<one actionable sentence>",
  "suggested_autonomy": "conservative" | "balanced" | "aggressive" | null
}

Metrics: revenue £${m.revenue}, ad spend £${m.adSpend}, CAC £${m.cac}, LTV £${m.ltv}, ROAS ${m.roas}, LTV:CAC ${m.ltvCacRatio}, impressions ${m.impressions}, clicks ${m.clicks}, conversions ${m.conversions}, current autonomy ${autonomy}, intent threshold ${thresholdFor(autonomy)}.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const obj = JSON.parse(text.slice(start, end + 1)) as {
      summary?: string;
      recommendation?: string;
      suggested_autonomy?: AutonomyLevel | null;
    };
    let applied = false;
    if (
      obj.suggested_autonomy &&
      obj.suggested_autonomy !== autonomy
    ) {
      setAutonomy(obj.suggested_autonomy);
      applied = true;
    }
    return {
      lastRunAt: Date.now(),
      summary: obj.summary ?? ruleBasedLearn(m).summary,
      recommendation: obj.recommendation ?? ruleBasedLearn(m).recommendation,
      suggestedAutonomy: obj.suggested_autonomy ?? undefined,
      applied,
    };
  } catch {
    return ruleBasedLearn(m);
  }
}

export async function runLearner(): Promise<LearningState> {
  const traceId = startTrace("learner", [
    "[learner] Starting optimization cycle…",
    "[learner] Reading ROI metrics from roi agent",
  ]);

  const metrics = computeMetrics();
  appendTrace(
    traceId,
    `[learner] LTV:CAC = ${metrics.ltvCacRatio.toFixed(2)} · ROAS = ${metrics.roas.toFixed(2)}`,
  );

  let learning: LearningState;
  try {
    appendTrace(traceId, "[learner] Evaluating policy adjustments…");
    learning = await llmLearn(metrics);
    appendTrace(traceId, `[learner] ${learning.recommendation}`);
    if (learning.applied && learning.suggestedAutonomy) {
      appendTrace(
        traceId,
        `[learner] Applied autonomy → ${learning.suggestedAutonomy}`,
      );
    } else {
      appendTrace(traceId, "[learner] No autonomy change this cycle.");
    }
  } catch (err) {
    appendTrace(traceId, `[learner] Fallback to rules: ${String(err)}`);
    learning = ruleBasedLearn(metrics);
    finishTrace(traceId, ["[learner] Done (fallback)."], true);
    setLearning(learning);
    return learning;
  }

  appendTrace(traceId, "[learner] Cycle complete.");
  finishTrace(traceId);
  setLearning(learning);
  return learning;
}
