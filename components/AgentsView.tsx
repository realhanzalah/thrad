"use client";

import { useYieldState } from "@/hooks/useYieldState";
import { AgentTerminals } from "./AgentTerminals";

export default function AgentsView() {
  const { traces } = useYieldState();

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="px-6 md:px-8 lg:px-12 py-8 md:py-10 border-b-4 border-foreground relative">
        <div className="absolute inset-0 texture-grid pointer-events-none opacity-40" aria-hidden />
        <div className="relative">
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
            Agents
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl">
            Live trace from each agent — intent scoring, ROI calculation, and the
            learning loop that adjusts policy for your business.
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 py-10 md:py-12">
        <AgentTerminals traces={traces} />
      </div>
    </div>
  );
}
