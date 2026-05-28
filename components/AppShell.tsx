"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full bg-zinc-950">
      <nav className="w-48 shrink-0 border-r-2 border-zinc-800 flex flex-col py-5 bg-zinc-950 shadow-[4px_0_0_0_rgba(0,0,0,0.3)]">
        <div className="px-4 mb-8">
          <div className="text-lg font-bold tracking-tight text-zinc-100">Yield</div>
          <div className="text-[10px] uppercase tracking-widest text-emerald-500/80 mt-0.5">
            Publisher agent
          </div>
        </div>
        <ul className="px-2 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-md px-3 py-2.5 text-sm font-medium border-2 transition duration-200 ${
                    active
                      ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]"
                      : "border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <main className="flex flex-1 flex-col min-w-0">{children}</main>
    </div>
  );
}
