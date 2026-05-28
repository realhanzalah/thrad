"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/",
    label: "Yield console",
    description: "Earnings, settings, and what the agent did",
  },
  {
    href: "/demo",
    label: "Sample app",
    description: "The cooking assistant your users would see",
  },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full">
      <nav className="w-56 shrink-0 border-r border-zinc-800/70 bg-zinc-950 flex flex-col">
        <div className="px-4 py-5 border-b border-zinc-800/60">
          <div className="text-lg font-semibold text-zinc-100">Yield</div>
          <p className="mt-1 text-[12px] text-zinc-500 leading-snug">
            Ad agent for AI apps. Works for you, not the ad network.
          </p>
        </div>
        <ul className="flex-1 p-2 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-2.5 transition ${
                    active
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-200"
                      : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="mt-0.5 text-[11px] leading-snug opacity-80">
                    {item.description}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="px-4 py-3 border-t border-zinc-800/60 text-[11px] text-zinc-600 leading-snug">
          Same agent and APIs on both pages. Open console in one tab and the
          sample app in another to demo live.
        </div>
      </nav>
      <main className="flex flex-1 flex-col min-w-0">{children}</main>
    </div>
  );
}
