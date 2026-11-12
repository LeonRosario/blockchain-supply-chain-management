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

export default function Timeline({ items, emptyMessage = 'No timeline events yet.' }: TimelineProps) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="relative space-y-6">
      {items.map((item, index) => {
        const completed = item.completed !== false;
        return (
          <li key={item.id} className="relative flex gap-4">
            {index < items.length - 1 && (
              <span
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%+0.5rem)] w-px',
                  completed ? 'bg-primary/30' : 'bg-border'
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                completed
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground'
              )}
            >
              {completed ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h4 className={cn('text-sm font-semibold', !completed && 'text-muted-foreground')}>
                  {item.title}
                </h4>
                {item.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(item.timestamp)}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {item.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </span>
                )}
                {item.meta && <span>{item.meta}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}