import { type ReactNode } from "react";
import {
  BauhausBtn,
  BauhausCard,
  BauhausInput,
  BauhausLabel,
  type BtnVariant,
  type CornerShape,
} from "./bauhaus-ui";

export { BauhausLogo, BauhausDecor, BauhausLink, IconArrowRight, IconArrowLeft, IconCheck } from "./bauhaus-ui";
export { shadowSm, shadowMd, shadowLg } from "./bauhaus-ui";

const CORNER_COLORS = ["#D02020", "#1040C0", "#F0C020"] as const;
const CORNERS: CornerShape[] = ["circle", "square", "triangle"];

export function Card({
  children,
  className = "",
  corner,
  cornerColor,
  cornerIndex = 0,
}: {
  children: ReactNode;
  className?: string;
  corner?: CornerShape;
  cornerColor?: string;
  cornerIndex?: number;
}) {
  return (
    <BauhausCard
      className={className}
      corner={corner ?? CORNERS[cornerIndex % 3]}
      cornerColor={cornerColor ?? CORNER_COLORS[cornerIndex % 3]}
    >
      {children}
    </BauhausCard>
  );
}

const variantMap: Record<"default" | "primary" | "ghost" | "danger", BtnVariant> = {
  primary: "red",
  default: "outline",
  ghost: "ghost",
  danger: "red",
};

export function Btn({
  children,
  variant = "default",
  shape = "square",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
  shape?: "square" | "pill";
}) {
  return (
    <BauhausBtn
      variant={variantMap[variant]}
      shape={shape}
      className={className}
      {...props}
    >
      {children}
    </BauhausBtn>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <BauhausInput {...props} />;
}

export function Label({
  children,
  className = "",
  accent = "default",
}: {
  children: ReactNode;
  className?: string;
  accent?: "default" | "blue" | "red" | "white";
}) {
  return (
    <BauhausLabel className={className} accent={accent}>
      {children}
    </BauhausLabel>
  );
}

export function SectionRule({ className = "" }: { className?: string }) {
  return (
    <hr className={`border-0 border-b-2 lg:border-b-4 border-[#121212] my-0 ${className}`} />
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
