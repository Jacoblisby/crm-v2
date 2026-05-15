import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { MainHeader, MainWrapper } from "@/components/MainHeader";

// Body + UI sans. font-feature-settings i globals.css traekker cv11/ss01/ss03.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display-serif for hero-H1 paa /salg. Variable axis (SOFT) for warm karakter
// der matcher akvarel-flowet. Brug via .font-display class.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
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
      className={`h-full antialiased ${inter.variable} ${fraunces.variable}`}
    >
      <body className="bg-slate-50 min-h-screen text-slate-900">
        <MainHeader />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
