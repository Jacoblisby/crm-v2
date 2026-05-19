'use client';

/**
 * v3 genbruger v2's state-shape. Vi har bare brug for samme localStorage-bridge
 * og samme display-string sync. Dette gør at v2 og v3 deler underliggende
 * state hvis bruger hopper mellem routes.
 */
export {
  FunnelV2Provider as FunnelV3Provider,
  useFunnelV2 as useFunnelV3,
} from '../salg-v2/FunnelV2Context';
