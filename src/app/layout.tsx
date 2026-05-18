import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainHeader, MainWrapper } from "@/components/MainHeader";

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
    <html lang="da" className={`h-full antialiased ${inter.variable}`}>
      <body className="bg-background min-h-screen text-ink">
        <MainHeader />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
