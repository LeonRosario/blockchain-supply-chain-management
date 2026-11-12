import { Check } from 'lucide-react';
import type { ShipmentStatus } from '@/types';
import { cn, getCompletedStageCount, getShipmentProgress, SHIPMENT_STAGES, SHIPMENT_STAGE_LABELS } from '@/utils';

interface ShipmentProgressProps {
  status: ShipmentStatus;
}

export default function ShipmentProgress({ status }: ShipmentProgressProps) {
  const progress = getShipmentProgress(status);
  const completedCount = getCompletedStageCount(status);
  const isStopped = status === 'cancelled' || status === 'returned';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">Shipment progress</span>
        <span className="text-muted-foreground">
          {status === 'cancelled' ? 'Cancelled' : status === 'returned' ? 'Returned' : `${progress}%`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            status === 'cancelled'
              ? 'bg-red-500'
              : status === 'returned'
                ? 'bg-slate-500'
                : 'bg-primary'
          )}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Shipment progress"
        />
      </div>
      <ol className="mt-4 grid grid-cols-5 gap-2">
        {SHIPMENT_STAGES.map((stage, index) => {
          const completed = index < completedCount;
          const current = index === completedCount - 1 && !isStopped;
          return (
            <li key={stage} className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold',
                  completed
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground',
                  current && 'ring-4 ring-primary/15'
                )}
              >
                {completed ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium leading-tight sm:text-xs',
                  completed ? 'text-foreground' : 'text-muted-foreground'
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