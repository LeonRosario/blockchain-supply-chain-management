import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import type { ShipmentStatus } from '@/types';
import {
  cn,
  getCompletedStageCount,
  getShipmentProgress,
  SHIPMENT_STAGES,
  SHIPMENT_STAGE_LABELS,
} from '@/utils';

interface ShipmentProgressProps {
  status: ShipmentStatus;
}

/**
 * Shipment stepper: animated progress fill, staggered connectors, and a pulse
 * on the current stage. Stage order and completion logic are unchanged.
 */
export default function ShipmentProgress({ status }: ShipmentProgressProps) {
  const reduce = useReducedMotion();
  const progress = getShipmentProgress(status);
  const completedCount = getCompletedStageCount(status);
  const isStopped = status === 'cancelled' || status === 'returned';
  const currentIndex = isStopped ? -1 : completedCount - 1;

  const progressLabel =
    status === 'cancelled'
      ? 'Cancelled'
      : status === 'returned'
        ? 'Returned'
        : `${progress}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">Shipment progress</span>
        <span
          className={cn(
            'font-semibold tabular-nums',
            status === 'cancelled'
              ? 'text-danger'
              : status === 'returned'
                ? 'text-muted-foreground'
                : 'text-foreground'
          )}
        >
          {progressLabel}
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Shipment progress: ${progressLabel}`}
      >
        <motion.div
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cn(
            'h-full rounded-full',
            status === 'cancelled'
              ? 'bg-danger'
              : status === 'returned'
                ? 'bg-slate-500'
                : 'gradient-accent'
          )}
        />
      </div>

      <ol className="mt-5 grid grid-cols-5 gap-2">
        {SHIPMENT_STAGES.map((stage, index) => {
          const completed = index < completedCount;
          const current = index === currentIndex && !isStopped;
          const connectorComplete = index < completedCount - 1;

          return (
            <li
              key={stage}
              aria-current={current ? 'step' : undefined}
              className="relative flex flex-col items-center gap-2 text-center"
            >
              {index < SHIPMENT_STAGES.length - 1 && (
                <motion.span
                  aria-hidden="true"
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: reduce ? 0 : 0.12 + index * 0.07,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ transformOrigin: 'left' }}
                  className={cn(
                    'absolute left-1/2 top-4 h-0.5 w-full',
                    connectorComplete ? 'bg-primary/60' : 'bg-border'
                  )}
                />
              )}

              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-300',
                  completed
                    ? 'gradient-accent border-transparent text-white shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.8)]'
                    : 'border-border bg-background text-muted-foreground',
                  current && 'ring-4 ring-primary/15'
                )}
              >
                {current && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring"
                  />
                )}
                <span className="relative z-10">
                  {completed ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
              </span>

              <span
                className={cn(
                  'text-[11px] font-medium leading-tight sm:text-xs',
                  completed ? 'text-foreground' : 'text-muted-foreground',
                  current && 'text-primary'
                )}
              >
                {SHIPMENT_STAGE_LABELS[stage]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}