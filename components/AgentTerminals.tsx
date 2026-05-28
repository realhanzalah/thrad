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
    <div className="grid lg:grid-cols-3 gap-6">
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
    <Card className="flex flex-col overflow-hidden min-h-[320px] p-0 border-2">
      <div className="px-4 py-3 border-b border-foreground flex items-center gap-3">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 border border-foreground bg-foreground" />
          <span className="w-2.5 h-2.5 border border-foreground bg-background" />
          <span className="w-2.5 h-2.5 border border-foreground bg-muted" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{agent.title}</div>
          <div className="font-label text-[10px] text-muted-foreground truncate mt-0.5">
            {agent.subtitle}
          </div>
        </div>
        {latest?.status === "running" && (
          <span className="font-label text-[10px] uppercase tracking-widest">live</span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 p-4 font-label text-[11px] leading-relaxed text-foreground bg-muted overflow-y-auto max-h-[400px]"
      >
        {traces.length === 0 ? (
          <p className="text-muted-foreground">Waiting for activity…</p>
        ) : (
          traces
            .slice()
            .reverse()
            .map((t) => (
              <div key={t.id} className="mb-5 last:mb-0 border-b border-border-light pb-4 last:border-0">
                <div className="text-muted-foreground mb-2 uppercase tracking-widest text-[10px]">
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
