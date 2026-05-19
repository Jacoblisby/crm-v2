'use client';

import { useFunnelV2 } from './FunnelV2Context';
import { Landing } from './Landing';
import { Funnel } from './Funnel';

export const dynamic = 'force-dynamic';

export default function SalgV2Page() {
  const { state } = useFunnelV2();
  // screenIdx convention:
  //   0 = Landing
  //   1..N = funnel screens (BekraeftAdresse, HvornaarFlytter, Køkken, ..., NyBolig)
  //   N+1 = Estimat
  if (state.screenIdx === 0) return <Landing />;
  return <Funnel />;
}
