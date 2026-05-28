import type { AuditStatus, ConversionSignals, Placement } from "./types";

export type AuditResult = {
  status: AuditStatus;
  reasons: string[];
};

const MIN_DWELL_MS = 1500;
const MIN_LATENCY_MS = 800;
const MAX_PLAUSIBLE_VALUE_GBP = 500;

export function scoreConversionTrust(
  signals: ConversionSignals,
  placement?: Placement,
  value?: number,
): AuditResult {
  const reasons: string[] = [];
  if (signals.dwellMs < MIN_DWELL_MS) {
    reasons.push(
      `They only spent ${signals.dwellMs}ms on the page — real shoppers usually stay longer.`,
    );
  }
  if (signals.latencyMs < MIN_LATENCY_MS) {
    reasons.push(
      `Purchase came ${signals.latencyMs}ms after the click — too fast to be real.`,
    );
  }
  if (signals.repeatFingerprint) {
    reasons.push("Same device already reported a sale in this session.");
  }
  if (signals.valueMismatch) {
    reasons.push("Sale amount does not match the product price we showed.");
  }
  if (value !== undefined && value > MAX_PLAUSIBLE_VALUE_GBP) {
    reasons.push(`Sale of £${value} is unusually high for this type of product.`);
  }
  // Silence unused param lint
  void placement;
  return {
    status: reasons.length ? "held_for_review" : "clean_auto_billed",
    reasons,
  };
}

export function suspiciousSignals(): ConversionSignals {
  return {
    dwellMs: 120,
    latencyMs: 220,
    repeatFingerprint: true,
    valueMismatch: false,
  };
}

export function cleanSignals(): ConversionSignals {
  return {
    dwellMs: 4200 + Math.floor(Math.random() * 2000),
    latencyMs: 6000 + Math.floor(Math.random() * 4000),
    repeatFingerprint: false,
    valueMismatch: false,
  };
}
