import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/utils';

export interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  /** Lift on hover. Disabled for reduced-motion users. */
  hover?: boolean;
  /** Soft glow ring on hover. */
  glow?: boolean;
}

/**
 * Card surface with an optional spring hover lift.
 */
export default function AnimatedCard({
  children,
  className,
  hover = true,
  glow = false,
  ...props
}: AnimatedCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      whileHover={
        hover && !reduce
          ? { y: -4, transition: { type: 'spring', stiffness: 320, damping: 24 } }
          : undefined
      }
      whileTap={
        hover && !reduce
          ? { scale: 0.995, transition: { duration: 0.12 } }
          : undefined
      }
      className={cn(
        'rounded-2xl border bg-card text-card-foreground shadow-soft',
        glow &&
          'transition-shadow duration-300 hover:border-primary/25 hover:shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}