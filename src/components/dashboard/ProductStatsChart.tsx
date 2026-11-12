import { motion, useReducedMotion } from 'motion/react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatItem {
  label: string;
  value: number;
  percentage?: number;
  color: string;
  bgColor: string;
}

interface ProductStatsChartProps {
  stats: StatItem[];
  title?: string;
  showLegend?: boolean;
}

/**
 * Animated distribution bars. Widths animate on first view; values and the
 * underlying data are unchanged.
 */
export default function ProductStatsChart({
  stats,
  title = 'Product Distribution',
  showLegend = true,
}: ProductStatsChartProps) {
  const reduce = useReducedMotion();
  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  const maxValue = Math.max(...stats.map((stat) => stat.value), 1);

  return (
    <div>
      {title && <h3 className="text-lg font-semibold">{title}</h3>}

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{total}</span>
        <span className="text-sm text-muted-foreground">
          products across {stats.length} categories
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {stats.map((stat, index) => {
          const percentage = total > 0 ? (stat.value / total) * 100 : 0;
          const barWidth = maxValue > 0 ? (stat.value / maxValue) * 100 : 0;

          let TrendIcon = Minus;
          let trendColor = 'text-muted-foreground';
          if (stat.percentage !== undefined) {
            if (stat.percentage > 0) {
              TrendIcon = TrendingUp;
              trendColor = 'text-success';
            } else if (stat.percentage < 0) {
              TrendIcon = TrendingDown;
              trendColor = 'text-danger';
            }
          }

          return (
            <div key={stat.label} className="group">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: stat.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-medium">{stat.label}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="font-semibold tabular-nums">{stat.value}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {percentage.toFixed(1)}%
                  </span>
                  {stat.percentage !== undefined && (
                    <span className={cn('flex items-center gap-0.5 font-medium tabular-nums', trendColor)}>
                      <TrendIcon className="h-3 w-3" aria-hidden="true" />
                      {stat.percentage > 0 ? '+' : ''}
                      {stat.percentage}%
                    </span>
                  )}
                </div>
              </div>

              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={stat.value}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={`${stat.label}: ${stat.value} of ${total}`}
              >
                <motion.div
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${barWidth}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{
                    duration: 0.65,
                    delay: 0.08 + index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full rounded-full transition-[filter] duration-300 group-hover:brightness-110"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${stat.color}, ${stat.color}b3)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {showLegend && total > 0 && (
        <div className="mt-6 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          Distribution is calculated from the displayed category counts.
        </div>
      )}
    </div>
  );
}