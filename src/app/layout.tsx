import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";
import { MainHeader, MainWrapper } from "@/components/MainHeader";

// DM Serif Display — Variant C "Sommerhave Luxe" display headlines.
// Italic er en separat instance fordi DM Serif kun har vaegte 400.
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

// Inter — body + UI. cv11/ss01 OpenType features via globals.css.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      className={`h-full antialiased ${dmSerif.variable} ${inter.variable}`}
    >
      <body className="bg-paper min-h-screen text-ink">
        <MainHeader />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
