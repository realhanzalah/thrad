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
    <div className="relative flex min-h-screen w-full bg-background z-10">
      <nav className="w-48 shrink-0 border-r border-foreground bg-background flex flex-col py-8">
        <div className="px-6 mb-12">
          <div className="font-display text-2xl font-medium tracking-tight text-foreground">
            Yield
          </div>
          <div className="font-label text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
            Publisher agent
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className="block w-8 border-t-4 border-foreground" />
            <span className="block w-3 h-3 border border-foreground shrink-0" />
          </div>
        </div>
        <ul className="px-4 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-none px-3 py-3 text-sm font-medium border transition-colors duration-100 focus-ring ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <main id="main-content" className="flex flex-1 flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
