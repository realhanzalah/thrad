"use client";

import { useEffect, useState } from "react";
import type { AutonomyLevel } from "@/lib/types";
import { Btn, Card, Input, Label } from "./ui";

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
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm font-label uppercase tracking-widest">
        Loading…
      </div>
    );
  }

  return (
    <>
      {children}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4 md:p-8">
          <Card className="w-full max-w-md p-8 md:p-10 bg-background relative">
            <div className="absolute inset-0 texture-grid pointer-events-none opacity-50" aria-hidden />
            <div className="relative">
              <h2 className="font-display text-3xl font-medium tracking-tight">
                Set up Yield
              </h2>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                A starting budget and ad strictness. The learning agent will adjust over time
                as it sees your LTV and CAC.
              </p>

              <label className="block mt-8">
                <Label>Monthly ad budget (£)</Label>
                <Input
                  type="number"
                  min={50}
                  step={50}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mt-3"
                />
              </label>

              <div className="mt-8">
                <Label>Ad strictness</Label>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setAutonomy(l.value)}
                      className={`py-3 px-2 rounded-none border-2 text-left transition-colors duration-100 focus-ring ${
                        autonomy === l.value
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground bg-background text-muted-foreground hover:bg-foreground hover:text-background"
                      }`}
                    >
                      <div className="text-xs font-label uppercase tracking-widest">
                        {l.label}
                      </div>
                      <div className="text-[10px] mt-1 opacity-80 normal-case tracking-normal font-body">
                        {l.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Btn
                variant="primary"
                className="w-full mt-8 py-4"
                disabled={saving}
                onClick={submit}
              >
                {saving ? "Saving…" : "Start →"}
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
