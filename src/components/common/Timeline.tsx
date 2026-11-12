import { motion, useReducedMotion } from 'motion/react';
import { Check, Clock, MapPin } from 'lucide-react';
import { cn, formatDateTime } from '@/utils';

export interface TimelineEntry {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  location?: string;
  completed?: boolean;
  meta?: string;
}

interface TimelineProps {
  items: TimelineEntry[];
  emptyMessage?: string;
}

/**
 * Animated activity timeline. Connectors draw in on first view, nodes pop in,
 * and the next pending step carries a soft pulse. Data and ordering are
 * passed through unchanged.
 */
export default function Timeline({
  items,
  emptyMessage = 'No timeline events yet.',
}: TimelineProps) {
  const reduce = useReducedMotion();

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const firstPendingIndex = items.findIndex((item) => item.completed === false);

  return (
    <ol className="relative space-y-6">
      {items.map((item, index) => {
        const completed = item.completed !== false;
        const isCurrent = !completed && index === firstPendingIndex;

        return (
          <motion.li
            key={item.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.35,
              delay: reduce ? 0 : Math.min(index, 8) * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
            aria-current={isCurrent ? 'step' : undefined}
            className="relative flex gap-4"
          >
            {index < items.length - 1 && (
              <motion.span
                aria-hidden="true"
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.5,
                  delay: reduce ? 0 : 0.08 + Math.min(index, 8) * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformOrigin: 'top' }}
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%+0.5rem)] w-px',
                  completed
                    ? 'bg-gradient-to-b from-primary/55 via-primary/30 to-primary/10'
                    : 'bg-border'
                )}
              />
            )}

            <motion.span
              initial={reduce ? false : { scale: 0.55, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 26,
                delay: reduce ? 0 : Math.min(index, 8) * 0.03,
              }}
              className={cn(
                'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                completed
                  ? 'gradient-accent border-transparent text-white shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.7)]'
                  : 'border-border bg-background text-muted-foreground'
              )}
            >
              {isCurrent && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring"
                />
              )}
              {completed ? (
                <Check className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Clock className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              )}
            </motion.span>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h4
                  className={cn(
                    'text-sm font-semibold',
                    !completed && 'text-muted-foreground'
                  )}
                >
                  {item.title}
                  {isCurrent && (
                    <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Next
                    </span>
                  )}
                </h4>
                {item.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(item.timestamp)}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {item.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {item.location}
                  </span>
                )}
                {item.meta && <span>{item.meta}</span>}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}