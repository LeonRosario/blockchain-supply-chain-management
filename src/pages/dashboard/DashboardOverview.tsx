import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  History,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Skeleton,
} from '@/components/ui';
import {
  StatsCard,
  ActivityFeed,
  ProductStatsChart,
} from '@/components/dashboard';
import { DemoDataBanner, StatusBadge } from '@/components/common';
import {
  AnimatedCard,
  FadeIn,
  StaggerItem,
  StaggerList,
} from '@/components/motion';
import { useAuth } from '@/hooks';
import productService from '@/services/product.service';
import type { ProductStats, ProductStatus } from '@/types';
import {
  mockProducts,
  mockProductStats,
  mockRecentActivity,
  mockStatsChartData,
} from '@/data/mockProducts';

type ActivityItem = {
  id: string;
  type: 'created' | 'updated' | 'shipped' | 'delivered' | 'recalled';
  product: { id: string; productId: string; name: string; status: ProductStatus };
  timestamp: string;
  user?: string;
};

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageOperations = Boolean(user && user.role !== 'customer');
  const [stats, setStats] = useState<ProductStats>(mockProductStats);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(mockRecentActivity);
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = user?.name?.split(' ')[0];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Only replace the sample dashboard when both datasets come from the
        // API. Mixing one live result with sample data would misrepresent it.
        const [statsRes, activityRes] = await Promise.allSettled([
          productService.getStats(),
          productService.getRecentActivity(10),
        ]);

        const statsOk = statsRes.status === 'fulfilled' && statsRes.value.success;
        const activityOk =
          activityRes.status === 'fulfilled' && activityRes.value.success;

        if (!statsOk || !activityOk) {
          setIsDemo(true);
          return;
        }

        setStats(statsRes.value.data);
        const activities: ActivityItem[] = activityRes.value.data.map((product) => ({
          id: `act-${product.id}`,
          type: (product.status === 'delivered'
            ? 'delivered'
            : product.status === 'in_transit'
              ? 'shipped'
              : 'created') as ActivityItem['type'],
          product: {
            id: product.id,
            productId: product.productId,
            name: product.name,
            status: product.status,
          },
          timestamp: product.updatedAt,
          user: 'System',
        }));
        setRecentActivity(activities);
        setIsDemo(false);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setIsDemo(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleViewProducts = (filter?: string) => {
    if (filter) {
      navigate(`/dashboard/products?status=${filter}`);
    } else {
      navigate('/dashboard/products');
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      iconColor: 'text-blue-600 dark:text-blue-300',
      bgColor: 'bg-blue-500/10',
      onClick: canManageOperations ? () => handleViewProducts() : undefined,
    },
    {
      title: 'In Transit',
      value: stats.inTransit,
      icon: Truck,
      iconColor: 'text-violet-600 dark:text-violet-300',
      bgColor: 'bg-violet-500/10',
      onClick: canManageOperations ? () => handleViewProducts('in_transit') : undefined,
    },
    {
      title: 'Delivered',
      value: stats.delivered,
      icon: CheckCircle,
      iconColor: 'text-emerald-600 dark:text-emerald-300',
      bgColor: 'bg-emerald-500/10',
      onClick: canManageOperations ? () => handleViewProducts('delivered') : undefined,
    },
    {
      title: 'Pending Shipments',
      value: stats.pendingShipments,
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-300',
      bgColor: 'bg-amber-500/10',
      onClick: canManageOperations ? () => handleViewProducts('active') : undefined,
    },
  ];

  const quickActions = [
    ...(canManageOperations
      ? [
          {
            title: 'Add new product',
            description: 'Register a product in the supply chain',
            icon: Package,
            iconClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
            label: 'Create product',
            variant: 'default' as const,
            onClick: () => navigate('/dashboard/products/add'),
          },
          {
            title: 'View shipments',
            description: 'Track products currently in transit',
            icon: Truck,
            iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
            label: 'View shipments',
            variant: 'outline' as const,
            onClick: () => navigate('/shipments'),
          },
        ]
      : []),
    {
      title: 'Verify product',
      description: 'Scan a QR code and check authenticity',
      icon: ShieldCheck,
      iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
      label: 'Verify product',
      variant: 'outline' as const,
      onClick: () => navigate('/blockchain/verify'),
    },
    ...(!canManageOperations
      ? [
          {
            title: 'Verification history',
            description: 'Review your previous product checks',
            icon: History,
            iconClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
            label: 'Open history',
            variant: 'outline' as const,
            onClick: () => navigate('/customer/history'),
          },
        ]
      : []),
  ];

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border/60 bg-card/60 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border/60 bg-card/60 p-6">
              <Skeleton className="mb-5 h-5 w-44" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <FadeIn inView={false}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Workspace overview
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {firstName ? `Welcome back, ${firstName}.` : 'Dashboard overview.'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Monitor your products, shipments, and verification activity at a glance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={isDemo ? 'Sample data in use' : 'Live API data'}
              tone={isDemo ? 'warning' : 'success'}
              dot
            />
            {canManageOperations && (
              <Button onClick={() => navigate('/dashboard/products/add')}>
                <Package className="mr-2 h-4 w-4" />
                Add product
              </Button>
            )}
          </div>
        </div>
      </FadeIn>

      {isDemo && (
        <DemoDataBanner
          title="Sample dashboard data"
          message="The product metrics, distribution chart, and recent activity below come from local demo records because the dashboard API did not return both datasets. They are not live supply-chain records."
        />
      )}

      {/* Stats Cards */}
      <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <StaggerItem key={stat.title}>
            <StatsCard {...stat} />
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-4 w-4" />
                </span>
                Product distribution
                <StatusBadge label="Sample data" tone="warning" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductStatsChart
                stats={mockStatsChartData}
                title=""
                showLegend={false}
              />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                  <Clock className="h-4 w-4" />
                </span>
                Recent activity
              </CardTitle>
              {canManageOperations && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard/products')}
                >
                  View all
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ActivityFeed
                activities={recentActivity}
                title=""
                showViewAll={false}
                maxItems={5}
              />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Quick Actions */}
      <FadeIn delay={0.05}>
        <div
          className={`grid grid-cols-1 gap-4 ${
            canManageOperations ? 'md:grid-cols-3' : 'md:grid-cols-2'
          }`}
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <AnimatedCard key={action.title} glow className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  variant={action.variant}
                  onClick={action.onClick}
                >
                  {action.label}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </AnimatedCard>
            );
          })}
        </div>
      </FadeIn>

      {/* Status Summary */}
      {canManageOperations && (
        <FadeIn delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  <CheckCircle className="h-4 w-4" />
                </span>
                Product status summary
                <StatusBadge label="Sample data" tone="warning" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {[
                  {
                    status: 'active',
                    label: 'Active',
                    count: mockProducts.filter((p) => p.status === 'active').length,
                    color: 'border-blue-500/20 bg-blue-500/[0.06] text-blue-700 dark:text-blue-300',
                  },
                  {
                    status: 'in_transit',
                    label: 'In Transit',
                    count: mockProducts.filter((p) => p.status === 'in_transit').length,
                    color:
                      'border-violet-500/20 bg-violet-500/[0.06] text-violet-700 dark:text-violet-300',
                  },
                  {
                    status: 'delivered',
                    label: 'Delivered',
                    count: mockProducts.filter((p) => p.status === 'delivered').length,
                    color:
                      'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-300',
                  },
                  {
                    status: 'inactive',
                    label: 'Inactive',
                    count: mockProducts.filter((p) => p.status === 'inactive').length,
                    color:
                      'border-slate-500/20 bg-slate-500/[0.06] text-slate-600 dark:text-slate-300',
                  },
                  {
                    status: 'recalled',
                    label: 'Recalled',
                    count: mockProducts.filter((p) => p.status === 'recalled').length,
                    color:
                      'border-red-500/20 bg-red-500/[0.06] text-red-700 dark:text-red-300',
                  },
                ].map((item) => (
                  <button
                    key={item.status}
                    type="button"
                    className={`group rounded-xl border p-4 text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-soft ${item.color}`}
                    onClick={() => handleViewProducts(item.status)}
                  >
                    <div className="text-2xl font-bold tabular-nums">{item.count}</div>
                    <div className="mt-0.5 flex items-center justify-between gap-1 text-xs font-medium">
                      {item.label}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}