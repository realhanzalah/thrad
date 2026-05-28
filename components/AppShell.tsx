"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { shadowMd } from "./ui";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full bg-zinc-950">
      <nav
        className={`w-48 shrink-0 border-r-2 border-zinc-700 bg-zinc-950 flex flex-col py-5 ${shadowMd}`}
      >
        <div className="px-4 mb-8">
          <div className="text-lg font-black uppercase tracking-tight text-zinc-100">
            Yield
          </div>
          <div className="text-[10px] uppercase tracking-widest text-emerald-500/90 mt-1">
            Publisher agent
          </div>
        </div>
        <ul className="px-2 space-y-2">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-none px-3 py-2.5 text-sm font-semibold border-2 transition duration-200 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    active
                      ? `border-emerald-700 bg-emerald-950/50 text-emerald-200 ${shadowMd}`
                      : "border-transparent text-zinc-500 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900"
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
