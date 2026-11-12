import type { ReactNode } from 'react';
import { cn } from '@/utils';

interface InfoFieldProps {
  label: string;
  value: ReactNode;
  icon?: React.ElementType;
  className?: string;
  valueClassName?: string;
}

export default function InfoField({
  label,
  value,
  icon: Icon,
  className,
  valueClassName,
}: InfoFieldProps) {
  return (
    <div className={cn('rounded-lg border bg-muted/30 p-3', className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className={cn('mt-1 break-words text-sm font-medium', valueClassName)}>
        {value}
      </div>
    </div>
  );
}