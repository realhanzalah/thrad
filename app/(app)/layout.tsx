import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/Onboarding";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      <AppShell>{children}</AppShell>
    </OnboardingGate>
  );
}
