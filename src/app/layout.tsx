import type { Metadata } from "next";
import { headers } from "next/headers";
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

/**
 * Sælgerdomænet skal ikke have CRM-ramme om sig.
 *
 * MainHeader skjuler sig selv ud fra stien — den kigger efter «/frontpage»
 * og «/salg». Det holdt, indtil saelg.365ejendom.dk fik roden omskrevet til
 * forsiden: omskrivningen sker inde i serveren, så browseren ser «/», og
 * så genkendte MainHeader den ikke. Resultatet var, at kunderne fik CRM'ets
 * menubjælke — Inbox, Pipeline, Foreninger — hen over salgssiden.
 *
 * Værtsnavnet er det pålidelige signal. Roden er en serverkomponent, så den
 * kan læse det direkte, og der er ingen hydreringsforskel mellem server og
 * klient som en window.location-tjek ville give.
 */
const SAELG_DOMAENE = 'saelg.365ejendom.dk';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const vaert = (await headers()).get('host')?.split(':')[0] ?? '';
  const erSaelgerdomaene = vaert === SAELG_DOMAENE;

  return (
    <html lang="da" className={`h-full antialiased ${inter.variable}`}>
      <body className="bg-background min-h-screen text-ink">
        {erSaelgerdomaene ? (
          children
        ) : (
          <>
            <MainHeader />
            <MainWrapper>{children}</MainWrapper>
          </>
        )}
      </body>
    </html>
  );
}
