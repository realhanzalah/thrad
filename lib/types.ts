export type Category =
  | "cookware"
  | "ingredients"
  | "appliances"
  | "general"
  | "sensitive";

export type Decision = "place" | "hold" | "skip" | "noop";

export type AutonomyLevel = "conservative" | "balanced" | "aggressive";

export type AgentDecision = {
  intent_score: number;
  category: Category;
  monetizable: boolean;
  decision: Decision;
  reason: string;
  offer_query: string | null;
  assistant_reply: string;
};

export type Offer = {
  title: string;
  url: string;
  price?: string;
  merchant?: string;
  snippet?: string;
};

export type Placement = {
  impressionId: string;
  clickId: string;
  sessionId: string;
  turnId: string;
  prompt: string;
  offer: Offer;
  intentScore: number;
  reason: string;
  ts: number;
  clickedAt?: number;
};

export type ConversionSignals = {
  dwellMs: number;
  latencyMs: number;
  repeatFingerprint: boolean;
  valueMismatch: boolean;
};

export type AuditStatus =
  | "clean_auto_billed"
  | "held_for_review"
  | "human_confirmed"
  | "rejected";

export type Conversion = {
  conversionId: string;
  clickId: string;
  sessionId: string;
  value: number;
  currency: string;
  signals: ConversionSignals;
  auditStatus: AuditStatus;
  heldReasons: string[];
  ts: number;
};

export type ChatTurn = {
  turnId: string;
  userMessage: string;
  assistantReply: string;
  decision: AgentDecision;
  placement?: Placement;
  ts: number;
};

export type RailItemKind = "place" | "skip" | "hold" | "audit" | "conversion";

export type RailItem = {
  id: string;
  kind: RailItemKind;
  ts: number;
  turnId?: string;
  userMessage?: string;
  decision?: AgentDecision;
  placement?: Placement;
  conversion?: Conversion;
  pendingApproval?: boolean;
};

export type ChatResponse = {
  turnId: string;
  assistantReply: string;
  decision: AgentDecision;
  placement?: Placement;
  railItem: RailItem;
};

export type AgentId = "intent" | "roi" | "learner";

export type AgentTrace = {
  id: string;
  agent: AgentId;
  ts: number;
  lines: string[];
  status: "running" | "done" | "error";
};

export type BusinessMetrics = {
  revenue: number;
  pendingRevenue: number;
  adSpend: number;
  profit: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cac: number;
  ltv: number;
  roas: number;
  ltvCacRatio: number;
  conversionRate: number;
  clickThroughRate: number;
  arpu: number;
  updatedAt: number;
};

export type LearningState = {
  lastRunAt: number;
  summary: string;
  recommendation: string;
  suggestedAutonomy?: AutonomyLevel;
  applied: boolean;
};

export type PublisherProfile = {
  onboarded: boolean;
  monthlyBudgetGbp: number;
  autonomy: AutonomyLevel;
};
