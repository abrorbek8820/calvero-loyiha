import { useEffect } from 'react';

export default function useSafeViewport() {
  useEffect(() => {
    // 1) <meta name="viewport"> ni runtime’da kiritish/yaxshilash
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';
      document.head.appendChild(meta);
    } else if (!/viewport-fit=cover/.test(meta.content)) {
      meta.content = meta.content + ', viewport-fit=cover';
    }

    // 2) OPPO uchun pastki panel kompensatsiyasi
    const setSafeBottom = () => {
      const vv = window.visualViewport;
      const visibleH = vv ? vv.height : window.innerHeight;
      const safeBottom = Math.max(0, Math.round(window.innerHeight - visibleH));
      document.documentElement.style.setProperty('--safe-bottom', safeBottom + 'px');
    };

    setSafeBottom();
    const onResize = () => setSafeBottom();

    window.addEventListener('resize', onResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
      }
    };
  }, []);
}