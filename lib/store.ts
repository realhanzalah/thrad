import type {
  AutonomyLevel,
  Conversion,
  Placement,
  RailItem,
} from "./types";

type Store = {
  sessionId: string;
  autonomy: AutonomyLevel;
  placements: Map<string, Placement>; // by impressionId
  placementsByClickId: Map<string, Placement>;
  conversions: Map<string, Conversion>;
  rail: RailItem[];
  earnings: { totalGbp: number; pendingGbp: number };
};

// Module-level in-memory store (single-process Vercel function instance).
// This is intentional: this is a demo, persistence is out of scope.
const g = globalThis as unknown as { __yieldStore?: Store };

function makeSessionId(): string {
  return "sess_" + Math.random().toString(36).slice(2, 10);
}

function init(): Store {
  return {
    sessionId: makeSessionId(),
    autonomy: "balanced",
    placements: new Map(),
    placementsByClickId: new Map(),
    conversions: new Map(),
    rail: [],
    earnings: { totalGbp: 0, pendingGbp: 0 },
  };
}

export function getStore(): Store {
  if (!g.__yieldStore) g.__yieldStore = init();
  return g.__yieldStore;
}

export function resetStore(): void {
  g.__yieldStore = init();
}

export function setAutonomy(level: AutonomyLevel): void {
  getStore().autonomy = level;
}

export function getAutonomy(): AutonomyLevel {
  return getStore().autonomy;
}

export function thresholdFor(level: AutonomyLevel): number {
  switch (level) {
    case "conservative":
      return 80;
    case "balanced":
      return 65;
    case "aggressive":
      return 50;
  }
}

export function addRailItem(item: RailItem): void {
  getStore().rail.unshift(item);
}

export function updateRailItem(
  id: string,
  patch: Partial<RailItem>,
): RailItem | undefined {
  const s = getStore();
  const idx = s.rail.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  s.rail[idx] = { ...s.rail[idx], ...patch };
  return s.rail[idx];
}

export function findRailItemByClickId(clickId: string): RailItem | undefined {
  return getStore().rail.find((r) => r.placement?.clickId === clickId);
}

export function findRailItemById(id: string): RailItem | undefined {
  return getStore().rail.find((r) => r.id === id);
}

export function recordPlacement(p: Placement): void {
  const s = getStore();
  s.placements.set(p.impressionId, p);
  s.placementsByClickId.set(p.clickId, p);
}

export function placementByClickId(clickId: string): Placement | undefined {
  return getStore().placementsByClickId.get(clickId);
}

function syncPlacementOnRail(clickId: string, patch: Partial<Placement>): void {
  const s = getStore();
  s.rail = s.rail.map((r) => {
    if (r.placement?.clickId !== clickId) return r;
    return { ...r, placement: { ...r.placement, ...patch } };
  });
}

export function recordClick(clickId: string): Placement | undefined {
  const p = placementByClickId(clickId);
  if (!p) return undefined;
  if (!p.clickedAt) {
    p.clickedAt = Date.now();
    syncPlacementOnRail(clickId, { clickedAt: p.clickedAt });
  }
  return p;
}

export function placementByImpressionId(
  impressionId: string,
): Placement | undefined {
  return getStore().placements.get(impressionId);
}

export function recordConversion(c: Conversion): void {
  const s = getStore();
  s.conversions.set(c.conversionId, c);
  if (c.auditStatus === "clean_auto_billed" || c.auditStatus === "human_confirmed") {
    s.earnings.totalGbp += c.value;
  } else if (c.auditStatus === "held_for_review") {
    s.earnings.pendingGbp += c.value;
  }
}

export function billHeldConversion(conversionId: string): Conversion | undefined {
  const s = getStore();
  const c = s.conversions.get(conversionId);
  if (!c) return undefined;
  if (c.auditStatus !== "held_for_review") return c;
  c.auditStatus = "human_confirmed";
  s.earnings.pendingGbp = Math.max(0, s.earnings.pendingGbp - c.value);
  s.earnings.totalGbp += c.value;
  return c;
}

export function rejectHeldConversion(conversionId: string): Conversion | undefined {
  const s = getStore();
  const c = s.conversions.get(conversionId);
  if (!c) return undefined;
  if (c.auditStatus !== "held_for_review") return c;
  c.auditStatus = "rejected";
  s.earnings.pendingGbp = Math.max(0, s.earnings.pendingGbp - c.value);
  return c;
}

export function getEarnings(): { totalGbp: number; pendingGbp: number } {
  return { ...getStore().earnings };
}

export function getRail(): RailItem[] {
  return getStore().rail.slice();
}

export function getSessionId(): string {
  return getStore().sessionId;
}

export function uuid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}
