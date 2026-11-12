import { AlertTriangle, Database } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils';

interface DemoDataBannerProps {
  message?: ReactNode;
  className?: string;
  title?: string;
  tone?: 'warning' | 'info';
}

/**
 * Visible disclosure for records that come from the local demo database.
 * Used anywhere sample data could otherwise be mistaken for live data.
 */
export default function DemoDataBanner({
  message,
  className,
  title = 'Demo data',
  tone = 'warning',
}: DemoDataBannerProps) {
  const Icon = tone === 'warning' ? AlertTriangle : Database;
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        tone === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-blue-200 bg-blue-50 text-blue-900',
        className
      )}
      role="note"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <div className="mt-0.5 opacity-90">
          {message ??
            'The backend is unavailable. These records are local sample data and are not blockchain-verified.'}
        </div>
      </div>
    </div>
  );
}