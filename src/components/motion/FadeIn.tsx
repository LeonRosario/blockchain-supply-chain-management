import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/utils';

export interface FadeInProps extends HTMLMotionProps<'div'> {
  /** Seconds before the entrance begins. */
  delay?: number;
  /** Vertical travel in pixels. */
  y?: number;
  /** Animate once when scrolled into view (default) or immediately. */
  once?: boolean;
  /** Trigger on viewport entry instead of on mount. */
  inView?: boolean;
}

/**
 * Consistent entrance for sections and cards.
 * Transform + opacity only, disabled for reduced-motion users.
 */
export default function FadeIn({
  children,
  className,
  delay = 0,
  y = 14,
  once = true,
  inView = true,
  ...props
}: FadeInProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      {...(inView
        ? { whileInView: reduce ? undefined : { opacity: 1, y: 0 } }
        : { animate: reduce ? undefined : { opacity: 1, y: 0 } })}
      viewport={{ once, amount: 0.15, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}