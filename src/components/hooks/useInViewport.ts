import { useEffect, useRef, useState } from 'react';

export function useInViewport<T extends Element>(
  options: IntersectionObserverInit = { rootMargin: '200px 0px', threshold: 0 }
) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setIsInView(true);
          obs.disconnect();
          break;
        }
      }
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
  }, [options.root, options.rootMargin, options.threshold]);

  return { ref, isInView } as const;
}
