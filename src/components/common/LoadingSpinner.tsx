import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface GlobalSpinnerProps {
  fullScreen?: boolean;
  label?: string;
}

/**
 * Global loading indicator.
 * fullScreen=true  → centred over the entire viewport
 * fullScreen=false → inline spinner
 */
export default function GlobalSpinner({
  fullScreen = true,
  label = 'Loading…',
}: GlobalSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'fixed inset-0 z-[9999] bg-background'
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
