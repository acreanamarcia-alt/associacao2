import { useEffect, useRef, useState } from 'react';

export interface UseCountUpOptions {
  /** Animation duration in milliseconds (default: 1150) */
  durationMs?: number;
  /** Whether the initial mount starts counting from 0 (default: true) */
  startFromZeroOnMount?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Smoothly animates an integer counter from 0 on initial mount (or from the
 * previous displayed value on subsequent updates) using requestAnimationFrame
 * and an ease-out cubic curve. Respects `prefers-reduced-motion`.
 */
export function useCountUp(
  target: number,
  options: UseCountUpOptions = {}
): number {
  const { durationMs = 1150, startFromZeroOnMount = true } = options;
  const safeTarget = Number.isFinite(target) ? Math.max(0, Math.round(target)) : 0;

  const [displayValue, setDisplayValue] = useState<number>(() => {
    if (!startFromZeroOnMount || prefersReducedMotion()) {
      return safeTarget;
    }
    return 0;
  });

  const currentValueRef = useRef<number>(displayValue);
  currentValueRef.current = displayValue;

  useEffect(() => {
    if (prefersReducedMotion() || durationMs <= 0) {
      currentValueRef.current = safeTarget;
      setDisplayValue(safeTarget);
      return;
    }

    const from = currentValueRef.current;
    if (from === safeTarget) {
      return;
    }

    let rafId = 0;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out cubic: starts crisp, decelerates smoothly into final integer
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(from + (safeTarget - from) * eased);

      currentValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        currentValueRef.current = safeTarget;
        setDisplayValue(safeTarget);
      }
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [safeTarget, durationMs]);

  return displayValue;
}
