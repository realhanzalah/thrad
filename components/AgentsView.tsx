"use client";

import { useYieldState } from "@/hooks/useYieldState";
import { AgentTerminals } from "./AgentTerminals";

export default function AgentsView() {
  const { traces } = useYieldState();

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="px-6 py-5 border-b-2 border-zinc-800">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Agents</h1>
        <p className="mt-1 text-sm text-zinc-500 max-w-xl">
          Live trace from each agent — intent scoring, ROI calculation, and the
          learning loop that adjusts policy for your business.
        </p>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AgentTerminals traces={traces} />
      </div>
    </div>
  );
}
