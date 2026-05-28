import Link from "next/link";
import { type ReactNode, type SVGProps } from "react";

function IconArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function IconArrowLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function IconCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden {...props}>
      <path d="M5 13l4 4L19 7" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

export { IconArrowRight, IconArrowLeft, IconCheck };

export function BauhausLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-hidden>
      <span className="h-3 w-3 rounded-full bg-[#D02020] border-2 border-[#121212]" />
      <span className="h-3 w-3 rounded-none bg-[#1040C0] border-2 border-[#121212]" />
      <span
        className="h-3 w-3 bg-[#F0C020] border-2 border-[#121212]"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    </div>
  );
}

type CornerShape = "circle" | "square" | "triangle";

export function BauhausCard({
  children,
  className = "",
  corner = "circle",
  cornerColor = "#D02020",
}: {
  children: ReactNode;
  className?: string;
  corner?: CornerShape;
  cornerColor?: string;
}) {
  return (
    <div
      className={`relative bg-white border-2 lg:border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212] lg:shadow-[8px_8px_0px_0px_#121212] transition-transform duration-200 ease-out hover:-translate-y-1 ${className}`}
    >
      <span
        className="absolute top-3 right-3 h-3 w-3 lg:h-4 lg:w-4 border-2 border-[#121212] pointer-events-none"
        style={{
          backgroundColor: cornerColor,
          borderRadius: corner === "circle" ? "9999px" : "0",
          clipPath:
            corner === "triangle"
              ? "polygon(50% 0%, 0% 100%, 100% 100%)"
              : undefined,
          transform: corner === "square" ? "rotate(45deg)" : undefined,
        }}
      />
      {children}
    </div>
  );
}

const btnBase =
  "inline-flex items-center justify-center font-bold uppercase tracking-wider text-sm border-2 border-[#121212] shadow-[4px_4px_0px_0px_#121212] transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] disabled:opacity-40 disabled:pointer-events-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

const btnVariants = {
  red: "bg-[#D02020] text-white hover:bg-[#D02020]/90",
  blue: "bg-[#1040C0] text-white hover:bg-[#1040C0]/90",
  yellow: "bg-[#F0C020] text-[#121212] hover:bg-[#F0C020]/90",
  outline: "bg-white text-[#121212] hover:bg-[#E0E0E0]",
  ghost: "border-none shadow-none bg-transparent text-[#121212] hover:bg-[#E0E0E0] active:translate-x-0 active:translate-y-0",
} as const;

export function BauhausBtn({
  children,
  variant = "red",
  shape = "square",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof btnVariants;
  shape?: "square" | "pill";
}) {
  const radius = shape === "pill" ? "rounded-full" : "rounded-none";
  return (
    <button
      type="button"
      className={`${btnBase} ${btnVariants[variant]} ${radius} px-5 py-2.5 min-h-[44px] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BauhausLink({
  href,
  children,
  variant = "blue",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof btnVariants;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${btnBase} ${btnVariants[variant]} rounded-none px-4 py-2 text-sm ${className}`}
    >
      {children}
    </Link>
  );
}

export function BauhausInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex-1 rounded-none border-2 border-[#121212] bg-white px-3 py-2.5 text-base font-medium text-[#121212] placeholder:text-[#121212]/50 focus:outline-none focus:ring-2 focus:ring-[#1040C0] focus:ring-offset-2 ${className}`}
      {...props}
    />
  );
}

export function BauhausDecor({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <span className="absolute -right-8 top-8 h-24 w-24 rounded-full border-2 border-white/30 bg-white/15" />
      <span className="absolute -left-6 bottom-12 h-20 w-20 rotate-45 border-2 border-white/25 bg-white/10" />
      <span
        className="absolute right-1/4 bottom-4 h-14 w-14 bg-[#F0C020]/25 border-2 border-white/20"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    </div>
  );
}
