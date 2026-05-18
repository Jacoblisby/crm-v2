import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainHeader, MainWrapper } from "@/components/MainHeader";

// Geist Sans — Vercel's typeface. Geometric grotesque med fremragende numeral-rendering.
// Bruges som primary sans throughout — Variant D cinematic tech-product aesthetic.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "365 Ejendomme — CRM v2",
  description: "Internal Buy List & CRM for 365 Ejendomme",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="da"
      className={`h-full antialiased ${geist.variable} ${geistMono.variable}`}
    >
      <body className="bg-background min-h-screen text-ink">
        <MainHeader />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
