'use client';

/**
 * EmbedMode — aktiveres via ?embed=1 query param.
 *
 * Naar embedded:
 *   1. Skjuler SalgHeader + footer (via root .embed-mode klasse + CSS)
 *   2. Sender hoejde-updates til parent vindue via postMessage saa
 *      en iframe-wrapper kan auto-resize til content
 *
 * Bruges fra public/salg-embed.html eller fra andre sites (WordPress, etc.)
 * der embedder via iframe.
 */
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function EmbedMode() {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';

  useEffect(() => {
    if (!isEmbed) return;

    document.documentElement.classList.add('embed-mode');

    // Send hoejde til parent ved hver mutation (content aendring,
    // step-skift, etc.) Debounced med requestAnimationFrame.
    let raf = 0;
    function postHeight() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight;
        try {
          window.parent.postMessage(
            { type: '365-salg-resize', height: h },
            '*',
          );
        } catch {
          // ignore — parent maa veere cross-origin uden adgang
        }
      });
    }

    postHeight();

    const obs = new MutationObserver(postHeight);
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    window.addEventListener('resize', postHeight);
    window.addEventListener('load', postHeight);

    // Send eksplicit "ready" saa parent ved at iframe er klar
    try {
      window.parent.postMessage({ type: '365-salg-ready' }, '*');
    } catch {
      // ignore
    }

    return () => {
      document.documentElement.classList.remove('embed-mode');
      obs.disconnect();
      window.removeEventListener('resize', postHeight);
      window.removeEventListener('load', postHeight);
      cancelAnimationFrame(raf);
    };
  }, [isEmbed]);

  return null;
}
