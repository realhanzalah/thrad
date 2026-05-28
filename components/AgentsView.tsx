"use client";

import { useYieldState } from "@/hooks/useYieldState";
import { AgentTerminals } from "./AgentTerminals";
import { Label } from "./ui";

export default function AgentsView() {
  const { traces } = useYieldState();

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="relative px-6 md:px-8 py-6 md:py-8 border-b-2 lg:border-b-4 border-[#121212] bg-[#1040C0] text-white overflow-hidden">
        <div className="pointer-events-none absolute -right-6 top-4 h-20 w-20 rounded-full border-2 border-white/30 bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute left-1/3 bottom-2 h-12 w-12 rotate-45 border-2 border-white/20 bg-[#F0C020]/30" aria-hidden />
        <div className="relative">
          <Label accent="white">Yield</Label>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-[0.95]">
            Agents
          </h1>
          <p className="mt-3 text-sm font-medium text-white/85 max-w-xl leading-relaxed">
            Live trace from each agent — intent scoring, ROI calculation, and the
            learning loop that adjusts policy for your business.
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 dot-grid">
        <AgentTerminals traces={traces} />
      </div>
    </div>
  );
}
