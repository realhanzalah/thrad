"use client";

import { useEffect, useRef } from "react";
import type { AgentId, AgentTrace } from "@/lib/types";
import { Card } from "./ui";

const AGENTS: { id: AgentId; title: string; subtitle: string }[] = [
  {
    id: "intent",
    title: "Intent agent",
    subtitle: "Scores messages · decides show / hold / skip",
  },
  {
    id: "roi",
    title: "ROI agent",
    subtitle: "LTV · CAC · ROAS · funnel math",
  },
  {
    id: "learner",
    title: "Learning agent",
    subtitle: "Reads ROI · adjusts policy for this business",
  },
];

export function AgentTerminals({ traces }: { traces: AgentTrace[] }) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {AGENTS.map((agent) => (
        <TerminalWindow
          key={agent.id}
          agent={agent}
          traces={traces.filter((t) => t.agent === agent.id).slice(0, 8)}
        />
      ))}
    </div>
  );
}

function TerminalWindow({
  agent,
  traces,
}: {
  agent: (typeof AGENTS)[number];
  traces: AgentTrace[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const latest = traces[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [traces]);

  return (
    <Card className="flex flex-col overflow-hidden min-h-[320px]">
      <div className="px-3 py-2 border-b-2 border-zinc-700 bg-zinc-950 flex items-center gap-2">
        <span className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-zinc-200 truncate">
            {agent.title}
          </div>
          <div className="text-[10px] text-zinc-500 truncate">{agent.subtitle}</div>
        </div>
        {latest?.status === "running" && (
          <span className="text-[10px] text-emerald-400 animate-pulse">live</span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 p-3 font-mono text-[11px] leading-relaxed text-emerald-400/90 bg-black/40 overflow-y-auto max-h-[400px]"
      >
        {traces.length === 0 ? (
          <p className="text-zinc-600">Waiting for activity…</p>
        ) : (
          traces
            .slice()
            .reverse()
            .map((t) => (
              <div key={t.id} className="mb-4 last:mb-0">
                <div className="text-zinc-600 mb-1">
                  {new Date(t.ts).toLocaleTimeString()}
                  {t.status === "error" ? " · error" : ""}
                </div>
                {t.lines.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap break-words">
                    {line}
                  </div>
                ))}
              </div>
            ))
        )}
      </div>
    </Card>
  );
}
