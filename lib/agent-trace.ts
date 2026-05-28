import type { AgentId, AgentTrace } from "./types";

function traceId(): string {
  return `trace_${Math.random().toString(36).slice(2, 10)}`;
}

const MAX_TRACES = 120;

const g = globalThis as unknown as { __yieldTraces?: AgentTrace[] };

function traces(): AgentTrace[] {
  if (!g.__yieldTraces) g.__yieldTraces = [];
  return g.__yieldTraces;
}

export function startTrace(agent: AgentId, lines: string[]): string {
  const id = traceId();
  const entry: AgentTrace = {
    id,
    agent,
    ts: Date.now(),
    lines: [...lines],
    status: "running",
  };
  traces().unshift(entry);
  if (traces().length > MAX_TRACES) traces().pop();
  return id;
}

export function appendTrace(id: string, line: string): void {
  const t = traces().find((x) => x.id === id);
  if (t) t.lines.push(line);
}

export function finishTrace(id: string, lines?: string[], error = false): void {
  const t = traces().find((x) => x.id === id);
  if (!t) return;
  if (lines) t.lines.push(...lines);
  t.status = error ? "error" : "done";
}

export function logTrace(agent: AgentId, lines: string[]): void {
  const id = startTrace(agent, []);
  finishTrace(id, lines);
}

export function getTraces(agent?: AgentId): AgentTrace[] {
  const all = traces().slice();
  if (!agent) return all;
  return all.filter((t) => t.agent === agent);
}
