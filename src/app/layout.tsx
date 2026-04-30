import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
    <html lang="da" className="h-full antialiased">
      <body className="bg-slate-50 min-h-screen text-slate-900">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg whitespace-nowrap">
              365 <span className="text-slate-400">Ejendomme</span>
            </Link>
            <nav className="flex gap-1 text-sm overflow-x-auto -mx-2 px-2">
              <Link href="/" className="px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">Inbox</Link>
              <Link href="/pipeline" className="px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">Pipeline</Link>
              <Link href="/buy-list" className="px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">Buy List</Link>
              <Link href="/on-market" className="px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">On-market</Link>
            </nav>
            <div className="ml-auto text-xs text-slate-500 hidden sm:block">v2 · read-only mirror</div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
