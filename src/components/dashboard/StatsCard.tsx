import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  bgColor = 'bg-blue-50',
  trend,
  onClick,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-all hover:shadow-md',
        onClick ? 'cursor-pointer hover:bg-gray-50' : '',
        'border border-gray-100'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-sm',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              <span className="font-medium">{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-3', bgColor)}>
          <Icon className={cn('w-6 h-6', iconColor)} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}