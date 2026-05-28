import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThradTag } from "@/components/ThradTag";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Herald",
  description: "Ad agent for AI publishers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#1040C0] focus:text-white focus:px-6 focus:py-3 focus:text-xs focus:font-bold focus:uppercase focus:tracking-widest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
        >
          Skip to content
        </a>
        <ThradTag />
        {children}
      </body>
    </html>
  );
}
