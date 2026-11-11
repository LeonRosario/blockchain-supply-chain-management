import { cn, formatDateTime } from '@/utils';
import type { Product, ProductStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';

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

const statusConfig: Record<ProductStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  recalled: { label: 'Recalled', variant: 'destructive' },
  in_transit: { label: 'In Transit', variant: 'outline' },
  delivered: { label: 'Delivered', variant: 'default' },
};

const activityIcons = {
  created: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  updated: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  recalled: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
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

  if (displayActivities.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {showViewAll && onViewAll && (
            <button className="text-sm text-primary hover:underline" onClick={onViewAll}>
              View all
            </button>
          )}
        </div>
        <div className="text-center text-muted-foreground py-8">
          No recent activity
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {showViewAll && onViewAll && (
          <button className="text-sm text-primary hover:underline" onClick={onViewAll}>
            View all
          </button>
        )}
      </div>
      <div className="space-y-4">
        {displayActivities.map((activity) => {
          const iconConfig = activityIcons[activity.type];
          const Icon = iconConfig.icon;

          return (
            <div key={activity.id} className="flex items-start gap-4">
              <div className={cn('rounded-full p-2 flex-shrink-0', iconConfig.bg)}>
                <Icon className={cn('w-4 h-4', iconConfig.color)} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{activityLabels[activity.type]}</p>
                  <span className="text-muted-foreground text-xs">·</span>
                  <p className="text-sm text-muted-foreground">{formatDateTime(activity.timestamp)}</p>
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{activity.product.name}</span>
                  <span className="text-muted-foreground text-sm">({activity.product.productId})</span>
                  <Badge variant={statusConfig[activity.product.status]?.variant || 'secondary'}>
                    {statusConfig[activity.product.status]?.label || activity.product.status}
                  </Badge>
                </div>
                {activity.user && (
                  <p className="mt-1 text-xs text-muted-foreground">By {activity.user}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </div>
  );
}