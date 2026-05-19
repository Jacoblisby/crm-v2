'use client';

import { useFunnelV3 } from './FunnelV3Context';
import { Landing } from './Landing';
import { Funnel } from './Funnel';

export const dynamic = 'force-dynamic';

export default function SalgV3Page() {
  const { state } = useFunnelV3();
  if (state.screenIdx === 0) return <Landing />;
  return <Funnel />;
}
