import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

export default function ProductStatsChart({
  stats,
  title = 'Product Distribution',
  showLegend = true,
}: ProductStatsChartProps) {
  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  const maxValue = Math.max(...stats.map((s) => s.value));

  return (
    <div className="rounded-xl border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-6">{title}</h3>
      <div className="space-y-4">
        {stats.map((stat, index) => {
          const percentage = total > 0 ? (stat.value / total) * 100 : 0;
          const barWidth = maxValue > 0 ? (stat.value / maxValue) * 100 : 0;

          let TrendIcon = Minus;
          let trendColor = 'text-muted-foreground';
          if (stat.percentage !== undefined) {
            if (stat.percentage > 0) {
              TrendIcon = TrendingUp;
              trendColor = 'text-green-600';
            } else if (stat.percentage < 0) {
              TrendIcon = TrendingDown;
              trendColor = 'text-red-600';
            }
          }

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', stat.bgColor)} aria-hidden="true" />
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{stat.value}</span>
                  <span className="text-muted-foreground">({percentage.toFixed(1)}%)</span>
                  {stat.percentage !== undefined && (
                    <span className={cn('flex items-center gap-1', trendColor)}>
                      <TrendIcon className="w-3 h-3" aria-hidden="true" />
                      {stat.percentage >= 0 ? '+' : ''}{stat.percentage}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: stat.color }}
                  role="progressbar"
                  aria-valuenow={stat.value}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-label={`${stat.label}: ${stat.value}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      {showLegend && total > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-muted-foreground">Total: {total} products</p>
        </div>
      )}
    </div>
  );
}