import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
  inverted = false,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  inverted?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-none border border-foreground transition-colors duration-100 ${
        inverted
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-card-foreground"
      } ${hover ? "hover:bg-foreground hover:text-background" : ""} ${className}`}
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
    "inline-flex items-center justify-center rounded-none text-sm font-medium uppercase tracking-widest font-label transition-colors duration-100 focus-ring disabled:opacity-40 disabled:pointer-events-none min-h-[44px]";
  const variants = {
    default:
      "border-2 border-foreground bg-transparent text-foreground px-8 py-4 hover:bg-foreground hover:text-background",
    primary:
      "border-2 border-foreground bg-foreground text-background px-8 py-4 hover:bg-background hover:text-foreground",
    ghost:
      "border-0 bg-transparent text-foreground px-4 py-2 normal-case tracking-normal font-body hover:underline underline-offset-4",
    danger:
      "border-2 border-foreground bg-foreground text-background px-8 py-4 hover:bg-background hover:text-foreground",
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
      className={`w-full rounded-none border-0 border-b-2 border-foreground bg-background px-0 py-2.5 text-base text-foreground placeholder:text-muted-foreground placeholder:italic focus:outline-none focus:border-b-[4px] focus-visible:border-b-[4px] ${className}`}
      {...props}
    />
  );
}

export function SectionRule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t-4 border-foreground my-0 ${className}`} />;
}

export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-label text-xs uppercase tracking-widest text-muted-foreground ${className}`}
    >
      {children}
    </span>
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
