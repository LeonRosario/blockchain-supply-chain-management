import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/utils';

export interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Use an accessible label when the visual number is decorated. */
  ariaLabel?: string;
}

/**
 * Animated number that runs once when it enters the viewport.
 * Falls back to the static value for reduced-motion users.
 */
export default function CountUp({
  value,
  duration = 0.9,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  ariaLabel,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      ref={ref}
      className={cn('tabular-nums', className)}
      aria-label={ariaLabel ?? `${prefix}${value.toLocaleString()}${suffix}`}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}