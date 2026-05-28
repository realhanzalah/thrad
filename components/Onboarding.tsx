"use client";

import { useEffect, useState } from "react";
import type { AutonomyLevel } from "@/lib/types";
import { Card, Input, Label } from "./ui";
import { BauhausBtn } from "./bauhaus-ui";

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
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0] text-[#121212]/60 text-xs font-bold uppercase tracking-widest">
        Loading…
      </div>
    );
  }

  return (
    <>
      {children}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/80 p-4 dot-grid">
          <Card className="w-full max-w-md p-6 sm:p-8" corner="circle" cornerColor="#1040C0">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-[#121212] pr-6">
              Set up Herald
            </h2>
            <p className="mt-3 text-sm font-medium text-[#121212]/70 leading-relaxed">
              A starting budget and ad strictness. The learning agent will adjust over time
              as it sees your LTV and CAC.
            </p>

            <label className="block mt-6">
              <Label>Monthly ad budget (£)</Label>
              <Input
                type="number"
                min={50}
                step={50}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-2 w-full"
              />
            </label>

            <div className="mt-6">
              <Label>Ad strictness</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setAutonomy(l.value)}
                    className={`py-2.5 px-2 rounded-none border-2 text-left transition-all duration-200 ease-out shadow-[3px_3px_0px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] ${
                      autonomy === l.value
                        ? "border-[#121212] bg-[#1040C0] text-white"
                        : "border-[#121212] bg-white text-[#121212]/60 hover:bg-[#E0E0E0]"
                    }`}
                  >
                    <div className="text-xs font-bold uppercase">{l.label}</div>
                    <div className="text-[10px] mt-0.5 font-medium normal-case tracking-normal opacity-80">
                      {l.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <BauhausBtn
              variant="red"
              className="w-full mt-6 py-3"
              disabled={saving}
              onClick={submit}
            >
              {saving ? "Saving…" : "Start"}
            </BauhausBtn>
          </Card>
        </div>
      )}
    </>
  );
}
