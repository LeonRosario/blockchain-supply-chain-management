import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '@/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Route-level fade + slight slide. Remount this with the route pathname as key.
 */
export default function PageTransition({
  children,
  className,
}: PageTransitionProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}