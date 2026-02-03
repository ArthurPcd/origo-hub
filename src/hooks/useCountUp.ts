'use client';

import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number; // ms, default 1800
  start?: number;    // default 0
  easing?: 'linear' | 'easeOut'; // default 'easeOut'
}

/**
 * Animates a number from `start` to `end` once the ref element enters the viewport.
 * Returns { ref, value } — attach ref to any DOM element.
 */
export function useCountUp({
  end,
  duration = 1800,
  start = 0,
  easing = 'easeOut',
}: UseCountUpOptions) {
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState(start);
  const hasStarted = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          observer.unobserve(element);

          const startTime = performance.now();
          const range = end - start;

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress =
              easing === 'easeOut'
                ? 1 - Math.pow(1 - progress, 3) // cubic ease-out
                : progress;

            setValue(Math.round(start + range * easedProgress));

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [end, start, duration, easing]);

  return { ref, value };
}
