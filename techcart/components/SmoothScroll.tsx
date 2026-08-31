'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    Lenis?: any;
  }
}

export default function SmoothScroll() {
  useEffect(() => {
    let lenisInstance: any = null;
    let animId: number;

    const initLenis = () => {
      if (typeof window !== 'undefined' && window.Lenis) {
        lenisInstance = new window.Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          smoothWheel: true,
        });

        function raf(time: number) {
          if (lenisInstance) {
            lenisInstance.raf(time);
            animId = requestAnimationFrame(raf);
          }
        }

        animId = requestAnimationFrame(raf);
      }
    };

    if (window.Lenis) {
      initLenis();
    } else {
      const interval = setInterval(() => {
        if (window.Lenis) {
          clearInterval(interval);
          initLenis();
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (lenisInstance) lenisInstance.destroy();
    };
  }, []);

  return null;
}
