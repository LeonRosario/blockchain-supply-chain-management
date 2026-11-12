import { cn } from '@/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

const toneClasses: Record<StatusTone, string> = {
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  info: 'border-info/25 bg-info/10 text-info',
  neutral: 'border-border bg-muted/60 text-muted-foreground',
  purple: 'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
  dot?: boolean;
  /** Soft pulse for pending / confirming states. */
  pulse?: boolean;
}

export default function StatusBadge({
  label,
  tone = 'neutral',
  className,
  dot = false,
  pulse = false,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        toneClasses[tone],
        className
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          {pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}