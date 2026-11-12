import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import AnimatedCard from '@/components/motion/AnimatedCard';
import CountUp from '@/components/motion/CountUp';
import { cn } from '@/utils/cn';

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
  iconColor = 'text-primary',
  bgColor = 'bg-primary/10',
  trend,
  onClick,
}: StatsCardProps) {
  const raw = String(value).replace(/,/g, '');
  const numeric = Number(raw);
  const isNumeric = raw.trim() !== '' && Number.isFinite(numeric);
  const decimals = raw.includes('.') ? Math.min(raw.split('.')[1]?.length ?? 0, 2) : 0;

  return (
    <AnimatedCard
      glow
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'group relative overflow-hidden p-5',
        onClick &&
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-primary/[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {isNumeric ? (
              <CountUp value={numeric} decimals={decimals} />
            ) : (
              value
            )}
          </p>
          {trend && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-danger'
              )}
            >
              {trend.value > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              ) : trend.value < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="font-normal text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-border/50 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3',
            bgColor
          )}
        >
          <Icon className={cn('h-5 w-5', iconColor)} aria-hidden="true" />
        </div>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    </AnimatedCard>
  );
}