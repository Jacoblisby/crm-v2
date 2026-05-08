import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Design-afstemning · 365 Ejendomme',
};

export default function DesignVoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
