import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative flex animate-in flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center fade-in-0 slide-in-from-bottom-1 duration-300',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.04] to-transparent"
      />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-muted/50 text-muted-foreground shadow-soft">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="relative mt-4 text-base font-semibold tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="relative mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}