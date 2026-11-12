import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils';

interface DrawLineProps {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  /** 0–1 portion of the line to draw. */
  scaleTo?: number;
  delay?: number;
}

/**
 * A connector that draws itself when scrolled into view.
 * Used by timelines and chain visualisations.
 */
export default function DrawLine({
  orientation = 'vertical',
  className,
  scaleTo = 1,
  delay = 0.1,
}: DrawLineProps) {
  const reduce = useReducedMotion();
  const vertical = orientation === 'vertical';

  return (
    <motion.div
      aria-hidden="true"
      initial={reduce ? false : { scaleX: vertical ? 1 : 0, scaleY: vertical ? 0 : 1 }}
      whileInView={{
        scaleX: 1,
        scaleY: 1,
        transition: {
          duration: 0.65,
          delay,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      viewport={{ once: true, amount: 0.2 }}
      style={{
        transformOrigin: vertical ? 'top' : 'left',
        ...(vertical ? { scaleY: scaleTo } : { scaleX: scaleTo }),
      }}
      className={cn(
        vertical ? 'w-px' : 'h-px',
        vertical
          ? 'bg-gradient-to-b from-primary/70 via-primary/35 to-transparent'
          : 'bg-gradient-to-r from-primary/70 via-primary/35 to-transparent',
        className
      )}
    />
  );
}