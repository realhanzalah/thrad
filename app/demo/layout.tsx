import { Outfit } from "next/font/google";
import "./demo.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${outfit.variable} demo-bauhaus min-h-screen flex flex-col`}>
      {children}
    </div>
  );
}
