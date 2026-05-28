"use client";

import { useEffect, useRef } from "react";
import type { AgentId, AgentTrace } from "@/lib/types";
import { Card } from "./ui";

const AGENTS: { id: AgentId; title: string; subtitle: string; accent: string }[] = [
  {
    id: "intent",
    title: "Intent agent",
    subtitle: "Scores messages · decides show / hold / skip",
    accent: "#D02020",
  },
  {
    id: "roi",
    title: "ROI agent",
    subtitle: "LTV · CAC · ROAS · funnel math",
    accent: "#1040C0",
  },
  {
    id: "learner",
    title: "Learning agent",
    subtitle: "Reads ROI · adjusts policy for this business",
    accent: "#F0C020",
  },
];

export function AgentTerminals({ traces }: { traces: AgentTrace[] }) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {AGENTS.map((agent, i) => (
        <TerminalWindow
          key={agent.id}
          agent={agent}
          traces={traces.filter((t) => t.agent === agent.id).slice(0, 8)}
          index={i}
        />
      ))}
    </div>
  );
}

function TerminalWindow({
  agent,
  traces,
  index,
}: {
  agent: (typeof AGENTS)[number];
  traces: AgentTrace[];
  index: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const latest = traces[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [traces]);

  return (
    <Card className="flex flex-col overflow-hidden min-h-[320px] p-0" cornerIndex={index}>
      <div
        className="px-3 py-2.5 border-b-2 border-[#121212] flex items-center gap-2"
        style={{ backgroundColor: agent.accent }}
      >
        <span className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D02020] border border-[#121212]" />
          <span className="w-2.5 h-2.5 bg-[#F0C020] border border-[#121212]" />
          <span
            className="w-2.5 h-2.5 bg-white border border-[#121212]"
            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black uppercase tracking-tight text-[#121212] truncate">
            {agent.title}
          </div>
          <div className="text-[10px] font-bold text-[#121212]/70 truncate">{agent.subtitle}</div>
        </div>
        {latest?.status === "running" && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212] animate-pulse">
            live
          </span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 p-3 font-mono text-[11px] leading-relaxed text-[#1040C0] bg-[#121212] overflow-y-auto max-h-[400px]"
      >
        {traces.length === 0 ? (
          <p className="text-[#E0E0E0]/60">Waiting for activity…</p>
        ) : (
          traces
            .slice()
            .reverse()
            .map((t) => (
              <div key={t.id} className="mb-4 last:mb-0 border-b border-[#E0E0E0]/20 pb-3 last:border-0">
                <div className="text-[#E0E0E0]/50 mb-1 text-[10px] uppercase tracking-widest">
                  {new Date(t.ts).toLocaleTimeString()}
                  {t.status === "error" ? " · error" : ""}
                </div>
                {t.lines.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap break-words text-[#F0C020]/90">
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
