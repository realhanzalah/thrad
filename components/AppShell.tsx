"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BauhausLogo, shadowMd } from "./ui";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full bg-[#F0F0F0]">
      <nav
        className={`w-52 shrink-0 border-r-2 lg:border-r-4 border-[#121212] bg-white flex flex-col py-6 ${shadowMd}`}
      >
        <div className="px-5 mb-10">
          <div className="flex items-center gap-2">
            <BauhausLogo />
            <div>
              <div className="text-lg font-black uppercase tracking-tighter text-[#121212] leading-none">
                Herald
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#1040C0] mt-1">
                Publisher agent
              </div>
            </div>
          </div>
        </div>
        <ul className="px-3 space-y-2">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wide border-2 transition-all duration-200 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] ${
                    active
                      ? `border-[#121212] bg-[#1040C0] text-white ${shadowMd}`
                      : "border-transparent text-[#121212]/60 hover:border-[#121212] hover:bg-[#E0E0E0] hover:text-[#121212]"
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
