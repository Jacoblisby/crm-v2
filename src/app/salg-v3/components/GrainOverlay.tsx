/**
 * GrainOverlay — fixed SVG noise paa hele viewport.
 * 5% opacity, multiply blend, pointer-events-none.
 * Bryder digital flatness uden at flikre paa scroll (data-URI = ingen
 * network), uden at koste FPS (svg-filter renderes en gang ved load).
 */
export function GrainOverlay() {
  // baseFrequency=0.9 giver fin grain. seed=2 hindrer hot-reload-flicker.
  const noise = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='2' stitchTiles='stitch'/>
        <feColorMatrix values='0 0 0 0 0
                               0 0 0 0 0
                               0 0 0 0 0
                               0 0 0 0.4 0'/>
      </filter>
      <rect width='100%' height='100%' filter='url(#n)' opacity='1'/>
    </svg>
  `)}`;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[2]"
      style={{
        backgroundImage: `url("${noise}")`,
        backgroundSize: '200px 200px',
        mixBlendMode: 'multiply',
        opacity: 0.05,
      }}
    />
  );
}
