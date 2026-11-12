import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/utils';

export interface StaggerListProps extends HTMLMotionProps<'div'> {
  /** Delay between each child, in seconds. */
  stagger?: number;
  delayChildren?: number;
}

/**
 * Container that staggers direct <StaggerItem> children.
 */
export function StaggerList({
  children,
  className,
  stagger = 0.06,
  delayChildren = 0.04,
  ...props
}: StaggerListProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={cn(className)} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children as React.ReactNode}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.08 }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children as React.ReactNode}
    </motion.div>
  );
}

export interface StaggerItemProps extends HTMLMotionProps<'div'> {
  y?: number;
}

export function StaggerItem({
  children,
  className,
  y = 12,
  ...props
}: StaggerItemProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={cn(className)} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children as React.ReactNode}
      </div>
    );
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children as React.ReactNode}
    </motion.div>
  );
}