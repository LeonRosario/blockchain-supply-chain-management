import { cn, formatDateTime } from '@/utils';
import type { Product, ProductStatus } from '@/types';
import StatusBadge, { type StatusTone } from '@/components/common/StatusBadge';
import { ChevronRight, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { StaggerItem, StaggerList } from '@/components/motion';

interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'shipped' | 'delivered' | 'recalled';
  product: Pick<Product, 'id' | 'productId' | 'name' | 'status'>;
  timestamp: string;
  user?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  maxItems?: number;
}

const statusConfig: Record<ProductStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'info' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  recalled: { label: 'Recalled', tone: 'danger' },
  in_transit: { label: 'In Transit', tone: 'info' },
  delivered: { label: 'Delivered', tone: 'success' },
};

const activityIcons = {
  created: { icon: Package, color: 'text-info', bg: 'bg-info/10' },
  updated: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
  shipped: { icon: Truck, color: 'text-transit', bg: 'bg-transit/10' },
  delivered: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  recalled: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10' },
};

const activityLabels = {
  created: 'Product created',
  updated: 'Product updated',
  shipped: 'Product shipped',
  delivered: 'Product delivered',
  recalled: 'Product recalled',
};

export default function ActivityFeed({
  activities,
  title = 'Recent Activity',
  showViewAll = false,
  onViewAll,
  maxItems = 5,
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);
  const showHeader = Boolean(title) || (showViewAll && onViewAll);

  if (displayActivities.length === 0) {
    return (
      <div className={cn('p-5 sm:p-6', showHeader && 'rounded-xl border border-border/60')}>
        {showHeader && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            {showViewAll && onViewAll && (
              <button className="text-sm text-primary hover:underline" onClick={onViewAll}>
                View all
              </button>
            )}
          </div>
        )}
        <div className="py-8 text-center text-sm text-muted-foreground">
          No recent activity
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-5 sm:p-6', showHeader && 'rounded-xl border border-border/60')}>
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          {showViewAll && onViewAll && (
            <button
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              onClick={onViewAll}
            >
              View all
            </button>
          )}
        </div>
      )}

      <StaggerList className="space-y-1" stagger={0.05}>
        {displayActivities.map((activity) => {
          const iconConfig = activityIcons[activity.type];
          const Icon = iconConfig.icon;
          const status = statusConfig[activity.product.status] ?? {
            label: activity.product.status,
            tone: 'neutral' as StatusTone,
          };

          return (
            <StaggerItem key={activity.id}>
              <div className="group flex items-start gap-3.5 rounded-xl p-2.5 transition-colors hover:bg-accent/50">
                <div className={cn('mt-0.5 shrink-0 rounded-xl p-2 ring-1 ring-inset ring-border/40', iconConfig.bg)}>
                  <Icon className={cn('h-4 w-4', iconConfig.color)} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-sm font-medium">{activityLabels[activity.type]}</p>
                    <span className="text-muted-foreground/60 text-xs" aria-hidden="true">
                      ·
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{activity.product.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {activity.product.productId}
                    </span>
                    <StatusBadge label={status.label} tone={status.tone} dot />
                  </div>
                  {activity.user && (
                    <p className="mt-1 text-xs text-muted-foreground">By {activity.user}</p>
                  )}
                </div>
                <ChevronRight
                  className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </div>
  );
}