import { type ReactNode } from "react";

/** Hard shadows + borders per design system, Yield dark palette */
export const shadowSm = "shadow-[3px_3px_0px_0px_#000000]";
export const shadowMd = "shadow-[4px_4px_0px_0px_#000000]";
export const shadowLg = "shadow-[8px_8px_0px_0px_#000000]";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-none border-2 border-zinc-600 bg-zinc-900 ${shadowLg} transition duration-200 ease-out hover:-translate-y-1 ${className}`}
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
    "inline-flex items-center justify-center rounded-none border-2 text-sm font-semibold uppercase tracking-wide transition duration-200 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:pointer-events-none disabled:active:translate-x-0 disabled:active:translate-y-0";
  const variants = {
    default:
      `border-zinc-500 bg-zinc-800 text-zinc-100 ${shadowMd} hover:bg-zinc-700`,
    primary:
      `border-emerald-800 bg-emerald-600 text-white ${shadowMd} hover:bg-emerald-500`,
    ghost:
      "border-transparent bg-transparent text-zinc-400 shadow-none normal-case tracking-normal hover:text-zinc-200",
    danger:
      `border-amber-900 bg-amber-950 text-amber-100 ${shadowMd} hover:bg-amber-900`,
  };
  const { type = "button", ...rest } = props;
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-none border-2 border-zinc-600 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-700 ${shadowSm} ${className}`}
      {...props}
    />
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
