import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border-2 border-zinc-700 bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.55)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Btn({
  children,
  variant = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded-md border-2 text-sm font-medium transition duration-200 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:pointer-events-none";
  const variants = {
    default:
      "border-zinc-600 bg-zinc-800 text-zinc-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:bg-zinc-700",
    primary:
      "border-emerald-700 bg-emerald-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.55)] hover:bg-emerald-500",
    ghost: "border-transparent bg-transparent text-zinc-400 shadow-none hover:text-zinc-200",
    danger:
      "border-amber-800 bg-amber-950 text-amber-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:bg-amber-900",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function fmtGbp(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(n);
}

export function fmtRatio(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  return `${n.toFixed(2)}×`;
}

export function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}
