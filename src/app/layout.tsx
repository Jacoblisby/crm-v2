import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { MainHeader, MainWrapper } from "@/components/MainHeader";

// Hanken Grotesk — Zillow's "Object Sans" closest free analog.
// Variable weight 100-900 lader os skrue paa display vs body via samme familie.
// Det er "kun en font" filosofien fra Zillow.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
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
    <html lang="da" className={`h-full antialiased ${hanken.variable}`}>
      <body className="bg-white min-h-screen text-slate-900">
        <MainHeader />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
