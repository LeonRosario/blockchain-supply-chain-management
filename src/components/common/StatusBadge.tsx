import { cn } from '@/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

const toneClasses: Record<StatusTone, string> = {
  success: 'border-green-200 bg-green-100 text-green-800',
  warning: 'border-amber-200 bg-amber-100 text-amber-800',
  danger: 'border-red-200 bg-red-100 text-red-800',
  info: 'border-blue-200 bg-blue-100 text-blue-800',
  neutral: 'border-gray-200 bg-gray-100 text-gray-700',
  purple: 'border-violet-200 bg-violet-100 text-violet-800',
};

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
  dot?: boolean;
}

export default function StatusBadge({
  label,
  tone = 'neutral',
  className,
  dot = false,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {label}
    </span>
  );
}