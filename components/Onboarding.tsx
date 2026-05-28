"use client";

import { useEffect, useState } from "react";
import type { AutonomyLevel } from "@/lib/types";
import { Btn, Card, Input } from "./ui";

const LEVELS: { value: AutonomyLevel; label: string; hint: string }[] = [
  { value: "conservative", label: "Careful", hint: "Fewer ads · intent 80+" },
  { value: "balanced", label: "Balanced", hint: "Default · intent 65+" },
  { value: "aggressive", label: "Eager", hint: "More ads · intent 50+" },
];

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  const [budget, setBudget] = useState("500");
  const [autonomy, setAutonomy] = useState<AutonomyLevel>("balanced");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile?.onboarded) {
          setShow(false);
        } else {
          setShow(true);
          if (data.profile?.monthlyBudgetGbp) {
            setBudget(String(data.profile.monthlyBudgetGbp));
          }
        }
      })
      .finally(() => setReady(true));
  }, []);

  const submit = async () => {
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyBudgetGbp: Number(budget),
        autonomy,
      }),
    });
    setSaving(false);
    setShow(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <>
      {children}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
              Set up Yield
            </h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              A starting budget and ad strictness. The learning agent will adjust over time
              as it sees your LTV and CAC.
            </p>

            <label className="block mt-6 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Monthly ad budget (£)
            </label>
            <Input
              type="number"
              min={50}
              step={50}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-2"
            />

            <label className="block mt-5 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Ad strictness
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setAutonomy(l.value)}
                  className={`py-2.5 px-2 rounded-none border-2 text-left transition duration-200 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    autonomy === l.value
                      ? "border-emerald-700 bg-emerald-950/60 text-emerald-200 shadow-[4px_4px_0px_0px_#000]"
                      : "border-zinc-600 bg-zinc-900 text-zinc-400 shadow-[3px_3px_0px_0px_#000] hover:border-zinc-500"
                  }`}
                >
                  <div className="text-xs font-bold uppercase">{l.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-80 normal-case tracking-normal">
                    {l.hint}
                  </div>
                </button>
              ))}
            </div>

            <Btn
              variant="primary"
              className="w-full mt-6 py-3"
              disabled={saving}
              onClick={submit}
            >
              {saving ? "Saving…" : "Start"}
            </Btn>
          </Card>
        </div>
      )}
    </>
  );
}
